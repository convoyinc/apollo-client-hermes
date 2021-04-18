import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { query, strictConfig } from '../../../helpers';

describe(`operations.read`, () => {
  describe(`with resolver redirects`, () => {

    const context = new CacheContext({
      ...strictConfig,
      resolverRedirects: {
        Query: {
          thing: ({ id }) => id,
        },
        NestedType: {
          thing: ({ id }) => id,
        },
      },
    });

    const initialQuery = query(`{
      entities { __typename id name }
      nested { __typename }
    }`);
    const rootRedirectQuery = query(`
      query getRoot($id: number) {
        thing(id: $id) { __typename id name }
      }
    `);
    const nestedRedirectQuery = query(`
      query getNested($id: number) {
        nested {
          __typename
          thing(id: $id) { __typename id name }
        }
      }
    `);

    const baseSnapshot = write(context, new GraphSnapshot(), initialQuery, {
      entities: [
        { __typename: 'Thing', id: 1, name: 'One' },
        { __typename: 'Thing', id: 2, name: 'Two' },
      ],
      nested: { __typename: 'NestedType' },
    }).snapshot;

    it(`follows resolver redirects on the query root`, () => {
      const { result, complete } = read(context, { ...rootRedirectQuery, variables: { id: 1 } }, baseSnapshot);
      jestExpect((result as any).thing).toEqual({ __typename: 'Thing', id: 1, name: 'One' });
      jestExpect(complete).toBe(true);
    });

    it(`follows resolver redirects on the query root`, () => {
      const { result, complete } = read(context, { ...nestedRedirectQuery, variables: { id: 1 } }, baseSnapshot);
      jestExpect((result as any).nested.thing).toEqual({ __typename: 'Thing', id: 1, name: 'One' });
      jestExpect(complete).toBe(true);
    });

    it(`prefers explicitly queried values, when present`, () => {
      const { snapshot } = write(context, baseSnapshot, { ...rootRedirectQuery, variables: { id: 1 } }, {
        thing: { __typename: 'Thing', id: 111, name: 'Other One' },
      });

      const { result, complete } = read(context, { ...rootRedirectQuery, variables: { id: 1 } }, snapshot);
      jestExpect((result as any).thing).toEqual({ __typename: 'Thing', id: 111, name: 'Other One' });
      jestExpect(complete).toBe(true);
    });

    it(`supports redirects to nowhere`, () => {
      const { result, complete } = read(context, { ...rootRedirectQuery, variables: { id: 123 } }, baseSnapshot);
      jestExpect((result as any).thing).toEqual(undefined);
      jestExpect(complete).toBe(false);
    });

  });
});
