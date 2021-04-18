import { Cache } from '../../../src/Cache';
import { JsonValue } from '../../../src/primitive';
import { query, strictConfig } from '../../helpers';

describe(`deserialization with migration`, () => {

  const v1Query = query(`query v1($id: ID!) {
    one {
      two {
        three(id: $id, withExtra: true) {
          id
          name
          extraValue
          __typename
        }
      }
    }
  }`, { id: 0 });

  const v2Query =  query(`query v1($id: ID!) {
    one {
      two {
        three(id: $id, withExtra: true) {
          id
          name
          extraValue
          isNew
          __typename
        }
      }
    }
  }`, { id: 0 });

  let storedV1ExtractResult: string, expectedV2Cache: Cache;
  beforeEach(() => {
    const cache = new Cache(strictConfig);
    cache.write(
      v1Query,
      {
        one: {
          two: [
            {
              three: {
                id: '30',
                name: 'Three0',
                extraValue: '30-42',
                __typename: 'THREE',
              },
            },
            {
              three: {
                id: '31',
                name: 'Three1',
                extraValue: '31-42',
                __typename: 'THREE',
              },
            },
            null,
          ],
        },
      },
    );
    const extractResult = cache.extract(/* optimistic */ false);
    storedV1ExtractResult = JSON.stringify(extractResult);

    // build the expected v2 cache, where 'three' gains a new 'isNew' field
    // that defaults to 'false'
    expectedV2Cache = new Cache(strictConfig);
    expectedV2Cache.write(
      v2Query,
      {
        one: {
          two: [
            {
              three: {
                id: '30',
                name: 'Three0',
                extraValue: '30-42',
                isNew: false,
                __typename: 'THREE',
              },
            },
            {
              three: {
                id: '31',
                name: 'Three1',
                extraValue: '31-42',
                isNew: false,
                __typename: 'THREE',
              },
            },
            null,
          ],
        },
      },
    );

  });

  it(`migrates the restored cache to v2`, () => {
    const newCache = new Cache();
    // set up v1 -> v2 migration map that adds the 'isNew' field to 'THREE'
    newCache.restore(JSON.parse(storedV1ExtractResult), {
      _entities: {
        THREE: {
          isNew: (_previous: JsonValue) => false,
        },
      },
    });
    jestExpect(newCache.getSnapshot()).toEqual(expectedV2Cache.getSnapshot());
  });

  it(`throws if verifyQuery couldn't be satified due to missing migration map`, () => {
    const newCache = new Cache();
    jestExpect(() => {
      newCache.restore(JSON.parse(storedV1ExtractResult), undefined, v2Query);
    }).toThrow();
  });

  it(`throws if verifyQuery couldn't be satified due to inadequate migration map`, () => {
    const newCache = new Cache();
    jestExpect(() => {
      newCache.restore(JSON.parse(storedV1ExtractResult), {
        _entities: {
          THREE: {
            otherStuff: (_previous: JsonValue) => false,
          },
        },
      }, v2Query);
    }).toThrow();
  });

});
