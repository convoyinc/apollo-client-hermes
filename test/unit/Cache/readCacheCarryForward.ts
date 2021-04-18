import { query, strictConfig } from '../../helpers';
import { Cache } from '../../../src';
import { RawOperation } from '../../../src/schema';

describe(`readCache carry-forward`, () => {

  const thingQuery = query(`
    query thing($id: ID!) {
      thing(id: $id) {
        id
        ref { id }
      }
    }
  `);

  function fullRead(cacheToReadFrom: Cache, queryToRead: RawOperation) {
    // We only track ids for observed queries; not one-offs.
    const unsubscribe = cacheToReadFrom.watch(queryToRead, () => {});
    // observers synchronously trigger a full read; we can unsub now.
    unsubscribe();
  }

  describe(`with strict mode enabled`, () => {

    let cache: Cache;
    beforeEach(() => {
      cache = new Cache(strictConfig);
    });

    it(`memoizes read results`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });

      jestExpect(cache.getSnapshot().baseline.readCache.size).toBe(0);
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });
      jestExpect(cache.getSnapshot().baseline.readCache.size).toBe(1);
    });

    it(`carries cache results forward if no entities in the cached query were changed`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

      cache.write({ ...thingQuery, variables: { id: 'b' } }, { thing: { id: 'b', ref: { id: 1 } } });
      jestExpect(cache.getSnapshot().baseline.readCache.size).toBe(1);
    });

    it(`drops cache results if entities in the cached query were changed`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 2 } } });
      jestExpect(cache.getSnapshot().baseline.readCache.size).toBe(0);
    });

    it(`drops cache results if containing entities in the cached query were changed`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });

      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'b', ref: { id: 1 } } });
      expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
    });

  });

  describe(`with strict mode disabled`, () => {

    let cache: Cache;
    beforeEach(() => {
      cache = new Cache({ ...strictConfig, strict: false });
    });

    it(`memoizes read results`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });

      expect(cache.getSnapshot().baseline.readCache.size).to.eq(0);
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });
      expect(cache.getSnapshot().baseline.readCache.size).to.eq(1);
    });

    it(`carries completeness forward, even if entities have changed`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 2 } } });

      const values = Array.from(cache.getSnapshot().baseline.readCache.values());
      expect(values).to.deep.eq([{ complete: true }]);
    });

    it(`doesn't carry results forward`, () => {
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'a', ref: { id: 1 } } });
      fullRead(cache, { ...thingQuery, variables: { id: 'a' } });
      cache.write({ ...thingQuery, variables: { id: 'a' } }, { thing: { id: 'b', ref: { id: 2 } } });

      const { result } = cache.read({ ...thingQuery, variables: { id: 'a' } });
      jestExpect(result).toEqual({
        thing: {
          id: 'b',
          ref: { id: 2 },
        },
      });
    });
  });

});
