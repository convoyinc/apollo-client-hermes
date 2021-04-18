import gql from 'graphql-tag';

import { CacheContext } from '../../../../src/context/CacheContext';

describe(`context.CacheContext`, () => {
  describe(`parseQuery`, () => {

    const simpleQuery = gql`{ foo }`;

    it(`memoizes identical queries w/o variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery });
      const parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery });

      jestExpect(parsed1).toBe(parsed2);
    });

    it(`memoizes identical queries w/ the same variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });

      jestExpect(parsed1).toBe(parsed2);
    });

    it(`considers the rootId part of a query's identity`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseOperation({ rootId: 'root1', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseOperation({ rootId: 'root2', document: simpleQuery, variables: { a: 1 } });

      jestExpect(parsed1).not.toBe(parsed2);
    });

    it(`considers variables part of a query's identity`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 2 } });

      jestExpect(parsed1).not.toBe(parsed2);
    });

    it(`doesn't get tripped up by undefined variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseOperation({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseOperation({ rootId: 'root', document: simpleQuery });

      jestExpect(parsed1).not.toBe(parsed2);
    });

  });
});
