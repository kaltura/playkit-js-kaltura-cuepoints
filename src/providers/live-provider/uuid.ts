// @ts-ignore
import {v5 as uuidV5, v1 as uuidV1} from 'uuid';

export class UUID {
  //timestamp
  public static uuidV1() {
    return uuidV1();
  }

  /**
   * usage example: uuidV5('domain', uuidV1())
   * @param name
   * @param namespace should be UUID string or a 16 byte array
   */
  public static uuidV5(name: string, namespace: string) {
    return uuidV5(name, namespace);
  }

  /**
   * generate uuidV1 as numbers only
   */
  public static numberedUuidV1(): string {
    const uuid = UUID.uuidV1();
    let numStr = '';

    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charAt(i);
      numStr += Number.isNaN(+char) ? char.charCodeAt(0) : char;
    }

    return numStr;
  }
}
