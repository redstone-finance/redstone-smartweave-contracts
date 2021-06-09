export class Tools {

  static deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }

  static initIfUndefined(obj: any, prop: string, initValue: any) {
    if (obj[prop] === undefined) {
      obj[prop] = initValue;
    }
  }

}
