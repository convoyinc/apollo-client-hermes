import { Cache } from '../../../src/Cache';
import { CacheSnapshot } from '../../../src/CacheSnapshot';
import { Serializable } from '../../../src/schema';
import { query, strictConfig } from '../../helpers';

describe(`serialization with optimistic update`, () => {

  const getAFooQuery =  query(`query getAFoo($id: ID!) {
    one {
      two {
        three(id: $id, withExtra: true) {
          id name extraValue
        }
      }
    }
  }`, { id: 1 });

  let originalCacheSnapshot: CacheSnapshot, extractResult: Serializable.GraphSnapshot, storedExtractResult: string;
  beforeEach(() => {
    const cache = new Cache(strictConfig);
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

    // Mock optimistic baseline
    const updateQuery = query(
      `{ id name extraValue }`,
      /* variables */ undefined,
      '31',
    );

    cache.transaction(
      /* changeId */ '31',
      (transaction) => {
        transaction.write(
          updateQuery,
          {
            id: '31',
            name: 'NEW-Three1',
            extraValue: null,
          }
        );
      }
    );

    originalCacheSnapshot = cache.getSnapshot();
    extractResult = cache.extract(/* optimistic */ true);
    storedExtractResult = JSON.stringify(extractResult);
  });

  it(`extract, stringify, and restore cache`, () => {
    const newCache = new Cache();
    newCache.restore(JSON.parse(storedExtractResult));
    jestExpect(newCache.getSnapshot().baseline).toEqual(originalCacheSnapshot.optimistic);
  });

  it(`extract and restore cache without JSON.stringify`, () => {
    const newCache = new Cache();
    jestExpect(() => {
      newCache.restore(extractResult);
    }).toThrow(/Unexpected 'undefined'/);
  });

});
