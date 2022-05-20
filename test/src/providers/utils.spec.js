import {isEmptyObject, getDomainFromUrl, makeAssetUrl, sortArrayBy} from '../../../src/providers/utils';

describe('Test provider utils', () => {
  it('should test if object empty', () => {
    expect(isEmptyObject({})).to.be.true;
    expect(isEmptyObject({a: 1})).to.be.false;
  });
  it('should get domain from URL', () => {
    expect(getDomainFromUrl('http://www.test.te/test-page/test')).to.eq('http://www.test.te');
  });
  it('should make asset URL with KS', () => {
    expect(makeAssetUrl('http://test.te/thumbAssetId/1_k0rlevfc/test_ks', "1_test")).to.eq('http://test.te//thumbAssetId/1_test/test_ks');
  });
  it('should sort array by property', () => {
    expect(sortArrayBy([{a: 2}, {a: 0.5}, {a: 1}], 'a')).to.eql([{a: 0.5}, {a: 1}, {a: 2}]);
    expect(
      sortArrayBy(
        [
          {a: 0.5, b: 1},
          {a: 1, b: 3},
          {a: 1, b: 2}
        ],
        'a',
        'b'
      )
    ).to.eql([
      {a: 0.5, b: 1},
      {a: 1, b: 2},
      {a: 1, b: 3}
    ]);
  });
});
