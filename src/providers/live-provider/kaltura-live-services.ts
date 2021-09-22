import {UUID} from './uuid';

const HashSeparatorText = 'HashSeparator';

export class KalturaLiveServices {
  public static getAnonymousUserId(userId: string): string {
    if (typeof Storage === 'undefined') {
      // No web storage Support, just generate and return a anonymous user id
      return KalturaLiveServices._generateAnonymousUserId(userId);
    }

    // Web storage is supported
    let anonymousUserId;
    anonymousUserId = localStorage.getItem('anonymousUserId');

    if (!anonymousUserId) {
      anonymousUserId = KalturaLiveServices._generateAnonymousUserId(userId);
      localStorage.setItem('anonymousUserId', anonymousUserId);
    }

    return anonymousUserId;
  }

  private static _generateAnonymousUserId(userId: string) {
    return `##${userId}${HashSeparatorText}${UUID.numberedUuidV1()}##`;
  }
}
