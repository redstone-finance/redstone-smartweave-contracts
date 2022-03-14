const fs = require("fs");
const loader = require("@assemblyscript/loader");
const metering = require('wasm-metering');
const {Benchmark} = require("redstone-smartweave");

const wasmBinary = fs.readFileSync(__dirname + "/build/optimized.wasm");
const meteredWasmBinary = metering.meterWASM(wasmBinary, {
    meterType: "i32",
});
const wasm2json = require('wasm-json-toolkit').wasm2json
const json = wasm2json(meteredWasmBinary);
fs.writeFileSync("wasm_module.json", JSON.stringify(json, null, 2))

let limit = 5100000000;
let gasUsed = 0;

const imports = {
    metering: {
        usegas: (gas) => {
            gasUsed += gas;
            if (gasUsed > limit) {
                throw new Error(`[RE:OOG] Out of gas! Limit: ${formatGas(limit)}, used: ${formatGas(gasUsed)}`);
            }
        }
    },
    console: {
        "console.log": function (msgPtr) {
            console.log(`Contract: ${wasmExports.__getString(msgPtr)}`);
        },
        "console.logO": function (msgPtr, objPtr) {
            console.log(`Contract: ${wasmExports.__getString(msgPtr)}`, JSON.parse(wasmExports.__getString(objPtr)));
        },
    },
    block: {
        "Block.height": function () {
            return 875290;
        },
        "Block.indep_hash": function () {
            return wasmExports.__newString("iIMsQJ1819NtkEUEMBRl6-7I6xkeDipn1tK4w_cDFczRuD91oAZx5qlgSDcqq1J1");
        },
        "Block.timestamp": function () {
            return 123123123;
        },
    },
    transaction: {
        "Transaction.id": function () {
            return wasmExports.__newString("Transaction.id");
        },
        "Transaction.owner": function () {
            return wasmExports.__newString("Transaction.owner");
        },
        "Transaction.target": function () {
            return wasmExports.__newString("Transaction.target");
        },
    },
    contract: {
        "Contract.id": function () {
            return wasmExports.__newString("Contract.id");
        },
        "Contract.owner": function () {
            return wasmExports.__newString("Contract.owner");
        },
    },
    msg: {
        "msg.sender": function () {
            return wasmExports.__newString("msg.sender");
        },
    },
    api: {
        _readContractState: (fnIndex, contractTxIdPtr) => {
            const contractTxId = wasmExports.__getString(contractTxIdPtr);
            const callbackFn = getFn(fnIndex);
            console.log("Simulating read state of", contractTxId);
            return setTimeout(() => {
                console.log('calling callback');
                callbackFn(__newString(JSON.stringify({
                    contractTxId
                })));
            }, 1000);
        },
        clearTimeout,
    },
    env: {
        abort(messagePtr, fileNamePtr, line, column) {
            console.error("--------------------- Error message from AssemblyScript ----------------------");
            console.error("  " + wasmExports.__getString(messagePtr));
            console.error(
                '    In file "' + wasmExports.__getString(fileNamePtr) + '"'
            );
            console.error(`    on line ${line}, column ${column}.`);
            console.error("------------------------------------------------------------------------------\n");
        },
    }
}

function getFn(idx) {
    return wasmExports.table.get(idx);
}

const wasmModule = loader.instantiateSync(
    meteredWasmBinary,
    imports
);

const wasmExports = wasmModule.exports;

const {handle, lang, initState, currentState, type} = wasmModule.exports;
const {__newString, __getString} = wasmModule.exports;

function safeHandle(action) {
    try {
        return doHandle(action)
    } catch (e) {
        // note: as exceptions handling in WASM is currently somewhat non-existent
        // https://www.assemblyscript.org/status.html#exceptions
        // and since we have to somehow differentiate different types of exceptions
        // - each exception message has to have a proper prefix added.

        // exceptions with prefix [RE:] ("Runtime Exceptions") should break the execution immediately
        // - eg: [RE:OOG] - [RuntimeException: OutOfGas]

        // exception with prefix [CE:] ("Contract Exceptions") should be logged, but should not break
        // the state evaluation - as they are considered as contracts' business exception (eg. validation errors)
        // - eg: [CE:WTF] - [ContractException: WhatTheFunction] ;-)
        if (e.message.startsWith('[RE:')) {
            throw e;
        } else {
            console.error(e.message);
        }
    }
}

function doHandle(action) {
    // TODO: consider NOT using @assemblyscript/loader and handle conversions manually
    // - as @assemblyscript/loader adds loads of crap to the output binary.
    const actionPtr = __newString(JSON.stringify(action));
    const resultPtr = handle(actionPtr);
    const result = __getString(resultPtr);

    return JSON.parse(result);
}

function doInitState() {
    let statePtr = __newString(JSON.stringify({
            firstName: 'first_ppe',
            lastName: 'last_ppe',
            counter: 0
        }
    ));

    initState(statePtr);

    gasUsed = 0;
}

function doGetCurrentState() {
    const currentStatePtr = currentState();
    return JSON.parse(wasmExports.__getString(currentStatePtr));
}


const actions = [
    {function: 'foreignRead', contractTxId: 'sdfsdf23423sdfsdfsdfsdfsdfsdfsdfsdf'}
    /*{function: 'increment'},
    {function: 'decrement'},
    {function: 'increment'},
    {function: 'fullName'},
    {function: 'unknownFn'}, /!* this one should throw unknown function *!/
    {function: 'increment'}, /!* this one should throw out of gas *!/
    {function: 'decrement'}  /!* this one should not be called *!/*/
]

// note: this will be useful in SDK to prepare the wasm execution env. properly
// for contracts written in different langs (eg. in assemblyscript we can use the
// built-in @assemblyscript/loader to simplify the communication - but obv. it wont' be available
// in Rust or Go)
console.log("Contract language:", __getString(lang));
console.log("Contract type:", type.value);

//(o) initialize the state in the wasm contract
doInitState();

//(o) evaluate all actions
for (const action of actions) {
    console.log("==============================================================================")
    const handlerResult = safeHandle(action);
    console.log({
        handlerResult,
        state: doGetCurrentState(),
        gas: `${formatGas(gasUsed)}`,
        gasLimit: `${formatGas(limit)}`
    });
}

// (o) re-init the state
/*doInitState();
console.log("Current state", doGetCurrentState());
limit = limit * 100000;

const benchmark = Benchmark.measure();
for (let i = 0; i < 1_000_000; i++) {
  if (i % 100_000 == 0) {
    console.log('calling', i + 1);
  }
  safeHandle({function: 'increment'});
}
console.log("Computed 1M interactions in", benchmark.elapsed());
console.log("Current state", doGetCurrentState());
console.log("Gas used", formatGas(gasUsed));*/

function formatGas(gas) {
    return gas * 1e-4;
}
