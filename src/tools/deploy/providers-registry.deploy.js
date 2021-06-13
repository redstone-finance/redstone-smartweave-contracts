const helpers = require("../_helpers");
const {interactWrite} = require("smartweave");
const registry = require("../contracts-registry.api");

module.exports = {
  deploy: async (onTestWeave = true) => {
    onTestWeave = helpers.parseBoolean(onTestWeave);
    const {jwk, arweave, testWeave} = await helpers.initArweave(onTestWeave);
    const transactionId = await helpers.createContract(
      "./dist/providers-registry/providers-registry.contract.js",
      `./dist/providers-registry/initial-state${onTestWeave ? '-test' : ''}.json`,
      onTestWeave
    );

    return await registry.register(onTestWeave, "providers-registry", transactionId, "initial deploy");
  }
}

/*"providers": {
  "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ]
  },
  "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ]
  },
  "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc": {
    "adminsPool": [
      "I-5rWUehEv-MjdK9gFw09RxfSLQX9DIHxG614Wf8qo0",
      "zYqPZuALSPa_f5Agvf8g2JHv94cqMn9aBtnH7GFHbuA",
      "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc"
    ]
  }
}*/

require('make-runnable');

