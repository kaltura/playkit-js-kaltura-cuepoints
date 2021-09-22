export class Utils {
  public static isEmptyObject(obj: Record<string, any>) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}

export function getDomainFromUrl(url: string) {
  return url.replace(/^(.*\/\/[^\/?#]*).*$/, '$1');
}
