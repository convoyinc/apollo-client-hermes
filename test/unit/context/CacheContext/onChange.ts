import { Cache } from '../../../../src';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
import { OptimisticUpdateQueue } from '../../../../src/OptimisticUpdateQueue';
import { StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`context.CacheContext`, () => {
  describe(`onChange callback`, () => {
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

    const cache = new Cache({ ...strictConfig, onChange: mockOnChange });

    it(`trigger onChange callback when write to cache`, () => {
      cache.write(
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

      const bar = { id: 1, name: 'Gouda' };
      const foo = {
        id: 0,
        bar,
      };

      const _values = {
        '0': new EntitySnapshot(
          foo,
          /* inbound */ [{ id: QueryRootId, path: ['foo'] }],
          /* outbound */ [{ id: '1', path: ['bar'] }],
        ),
        '1': new EntitySnapshot(
          bar,
          /* inbound */ [{ id: '0', path: ['bar'] }],
          /* outbound */ undefined,
        ),
        [QueryRootId]: new EntitySnapshot(
          {
            foo,
          },
          /* inbound */ undefined,
          /* outbound */ [{ id: '0', path: ['foo'] }],
        ),
      };

      jestExpect(mockOnChange.mock.calls.length).toBe(1);
      jestExpect(mockOnChange.mock.calls[0][0]).toEqual({
        baseline: new GraphSnapshot(_values),
        optimistic: new GraphSnapshot(_values),
        optimisticQueue: new OptimisticUpdateQueue(),
      });
      jestExpect(mockOnChange.mock.calls[0][1]).toEqual(new Set([QueryRootId, '0', '1']));
      mockOnChange.mockClear();
    });

    it(`trigger onChange callback when write with transaction`, () => {
      cache.transaction((transaction) => {
        transaction.write(
          graphqlQuery,
          {
            foo: {
              id: 0,
              bar: {
                id: 1,
                name: 'Munster',
              },
            },
          }
        );
      });

      const bar = { id: 1, name: 'Munster' };
      const foo = {
        id: 0,
        bar,
      };

      const _values = {
        '0': new EntitySnapshot(
          foo,
          /* inbound */ [{ id: QueryRootId, path: ['foo'] }],
          /* outbound */ [{ id: '1', path: ['bar'] }],
        ),
        '1': new EntitySnapshot(
          bar,
          /* inbound */ [{ id: '0', path: ['bar'] }],
          /* outbound */ undefined,
        ),
        [QueryRootId]: new EntitySnapshot(
          {
            foo,
          },
          /* inbound */ undefined,
          /* outbound */ [{ id: '0', path: ['foo'] }],
        ),
      };

      jestExpect(mockOnChange.mock.calls.length).toBe(1);
      jestExpect(mockOnChange.mock.calls[0][0]).toEqual({
        baseline: new GraphSnapshot(_values),
        optimistic: new GraphSnapshot(_values),
        optimisticQueue: new OptimisticUpdateQueue(),
      });
      jestExpect(mockOnChange.mock.calls[0][1]).toEqual(new Set(['1']));
      mockOnChange.mockClear();
    });

    it(`do not trigger onChange callback on read`, () => {
      cache.read(graphqlQuery);
      jestExpect(mockOnChange.mock.calls.length).toBe(0);
    });

  });
});
