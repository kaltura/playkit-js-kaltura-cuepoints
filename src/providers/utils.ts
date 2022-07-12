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

export function makeChapterThumb(serviceUrl: string, partnerId: string = '', entryId: string, startTime: number, ks: string = '') {
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
