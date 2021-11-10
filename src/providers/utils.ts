const {OVPConfiguration} = KalturaPlayer.providers;
export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function getDomainFromUrl(url: string) {
  return url.replace(/^(.*\/\/[^\/?#]*).*$/, '$1');
}

export function makeAssetUrl(serviceUrl: string = OVPConfiguration.get().serviceUrl, assetId: string, ks: string = '') {
  return `${serviceUrl}/index.php/service/thumbAsset/action/serve/thumbAssetId/${assetId}/ks/${ks}`;
}
