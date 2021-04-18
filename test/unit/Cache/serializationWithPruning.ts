import { Cache } from '../../../src/Cache';
import { CacheSnapshot } from '../../../src/CacheSnapshot';
import { query, strictConfig } from '../../helpers';

describe(`serialization with pruning`, () => {

  const getAFooQuery = query(`query getAFoo($id: ID!) {
    one {
      two {
        three(id: $id, withExtra: true) {
          id name extraValue
        }
      }
    }
  }`, { id: 0 });

  let originalCacheSnapshot: CacheSnapshot, cache: Cache;
  beforeEach(() => {
    cache = new Cache(strictConfig);
    cache.write(
      getAFooQuery,
      {
        one: {
          two: [
            {
              three: {
                id: '30',
                name: 'Three0',
                extraValue: '30-42',
              },
            },
            {
              three: {
                id: '31',
                name: 'Three1',
                extraValue: '31-42',
              },
            },
            null,
          ],
        },
      },
    );
    originalCacheSnapshot = cache.getSnapshot();
  });

  it(`extracts only the sub-branch specified by the prune query`, () => {
    // first muddy up the cache with another query
    const muddyQuery = query(`query muddy {
      viewer {
        id
        first
        last
        carrier {
          id
          hqCity
          phoneNo
        }
      }
    }`);

    cache.write(
      muddyQuery,
      {
        viewer: {
          id: 'tough007',
          first: 'James',
          last: 'Bond',
          carrier: {
            id: 'mi5',
            hqCity: 'London',
            phoneNo: '+44 20 7946 0820',
          },
        },
      },
    );

    // extract but prune it with 'getAFooQuery'
    const extractResult = cache.extract(/* optimistic */ false, getAFooQuery);
    const storedExtractResult = JSON.stringify(extractResult);

    const newCache = new Cache();
    newCache.restore(JSON.parse(storedExtractResult));

    // the restored cache should look as if muddyQuery never happens
    jestExpect(newCache.getSnapshot()).toEqual(originalCacheSnapshot);
  });

  it(`can extract the cache with slightly trimmed 'three' object`, () => {
    // set up an alternative query in which the 'three' object doesn't have
    // the 'name' field
    const altPruneQuery = query(`query getAFoo($id: ID!) {
      one {
        two {
          three(id: $id, withExtra: true) {
            id extraValue
          }
        }
      }
    }`, { id: 0 });

    // build the expected cache
    const expectedCache = new Cache(strictConfig);
    expectedCache.write(
      altPruneQuery,
      {
        one: {
          two: [
            {
              three: {
                id: '30',
                extraValue: '30-42',
              },
            },
            {
              three: {
                id: '31',
                extraValue: '31-42',
              },
            },
            null,
          ],
        },
      },
    );

    // prune the original cache
    const extractResult = cache.extract(/* optimistic */ false, altPruneQuery);
    const storedExtractResult = JSON.stringify(extractResult);

    const newCache = new Cache();
    newCache.restore(JSON.parse(storedExtractResult));

    // the restored cache should look as if it is built up from scrach with
    // altPruneQuery
    jestExpect(newCache.getSnapshot()).toEqual(expectedCache.getSnapshot());
  });

});
