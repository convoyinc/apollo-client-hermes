import { Cache } from '../../../../src';
import { query } from '../../../helpers';

describe(`context.CacheContext`, () => {
  describe(`onChange callback on error`, () => {
    const mockOnChange = jest.fn();
    const graphqlQuery = query(`{
      foo {
        id
        bar {
          id
          name
        }
      }
    }`);

    const cache = new Cache({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        group: jest.fn(),
        groupEnd: jest.fn(),
      },
      onChange: mockOnChange,
    });

    it(`do not trigger onChange callback on error`, () => {
      cache.transaction((transaction) => {
        transaction.write(
          graphqlQuery,
          {
            foo: {
              id: 0,
              bar: {
                id: 1,
                name: 'Gouda',
              },
            },
          }
        );
        throw new Error(`Fake error`);
      });
      jestExpect(mockOnChange.mock.calls.length).toBe(0);
    });

  });
});
