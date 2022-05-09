import Player = KalturaPlayerTypes.Player;

export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function getDomainFromUrl(url: string) {
  return url.replace(/^(.*\/\/[^\/?#]*).*$/, '$1');
}

export function makeAssetUrl(serviceUrl: string, assetId: string, ks: string = '') {
  return `${serviceUrl}/index.php/service/thumbAsset/action/serve/thumbAssetId/${assetId}${ks ? `/ks/${ks}` : ''}`;
}

export function sortArrayBy<T>(cuePoints: T[], primarySortKey: string, secondarySortKey?: string) {
  return cuePoints.sort(function (a: any, b: any) {
    return secondarySortKey
      ? a[primarySortKey] - b[primarySortKey] || a[secondarySortKey] - b[secondarySortKey]
      : a[primarySortKey] - b[primarySortKey];
  });
}

export function getKs(player: Player): string {
  if (player.shouldAddKs && player.shouldAddKs() && player.config.session?.ks) {
    return player.config.session.ks;
  }
  return '';
}
