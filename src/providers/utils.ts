export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function getDomainFromUrl(url: string) {
  return url.replace(/^(.*\/\/[^\/?#]*).*$/, '$1');
}

export function makeAssetUrl(baseThumbAssetUrl: string, assetId: string) {
  let assetUrl = '';
  // for some thumb cue points, assetId may be undefined from the API.
  if (typeof assetId !== 'undefined') {
    assetUrl = baseThumbAssetUrl.replace(/thumbAssetId\/([^\/]+)/, '/thumbAssetId/' + assetId);
  }
  return assetUrl;
}

export function generateThumb(serviceUrl: string, partnerId: string = '', entryId: string, startTime: number, ks: string = '') {
  return `${serviceUrl.split('api_v3')[0]}/p/${partnerId}/sp/${partnerId}00/thumbnail/entry_id/${entryId}/width/400/vid_sec/${(
    startTime / 1000
  ).toFixed(2)}${ks ? `/ks/${ks}` : ''}`;
}

export function sortArrayBy<T>(cuePoints: T[], primarySortKey: string, secondarySortKey?: string) {
  return cuePoints.sort(function (a: any, b: any) {
    return secondarySortKey
      ? a[primarySortKey] - b[primarySortKey] || a[secondarySortKey] - b[secondarySortKey]
      : a[primarySortKey] - b[primarySortKey];
  });
}

// TODO: move to shared utils
export const generateId = (): string => {
  return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
};

// TODO: move to shared utils
const generateNumberedId = (): string => {
  const uuid = generateId();
  let numStr = '';
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charAt(i);
    numStr += Number.isNaN(+char) ? char.charCodeAt(0) : char;
  }
  return numStr;
};

// TODO: move to shared utils
export function getUserId(): string {
  if (typeof Storage === 'undefined') {
    // No web storage Support, just generate and return a anonymous user id
    return _generateAnonymousUserId();
  }
  // Web storage is supported
  let anonymousUserId;
  anonymousUserId = localStorage.getItem('anonymousUserId');
  if (!anonymousUserId) {
    anonymousUserId = _generateAnonymousUserId();
    localStorage.setItem('anonymousUserId', anonymousUserId);
  }
  return anonymousUserId;
}

// TODO: move to shared utils
function _generateAnonymousUserId() {
  const HashSeparatorText = 'HashSeparator';
  const DefaultAnonymousPrefix = 'Guest';
  return `##${DefaultAnonymousPrefix}${HashSeparatorText}${generateNumberedId()}##`;
}
