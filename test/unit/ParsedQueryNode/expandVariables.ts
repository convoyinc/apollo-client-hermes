import gql from 'graphql-tag';

import { buildRawOperationFromQuery } from '../../../src/apollo/util';
import { CacheContext, QueryInfo } from '../../../src/context';
import { ParsedQueryNode, expandVariables } from '../../../src/ParsedQueryNode';
import { JsonScalar } from '../../../src/primitive';
import { strictConfig } from '../../helpers';

describe(`ParsedQueryNode.expandVariables`, () => {

  const context = new CacheContext(strictConfig);

  function makeFieldMap(query: string) {
    return new QueryInfo(context, buildRawOperationFromQuery(gql(query))).parsed;
  }

  it(`handles static queries`, () => {
    const map = makeFieldMap(`
      query stuff {
        foo(limit: 5) {
          bar(tag: "hello")
        }
        baz(thing: null)
      }
    `);

    jestExpect(expandVariables(map, undefined)).toEqual({
      foo: new ParsedQueryNode<JsonScalar>({
        bar: new ParsedQueryNode(undefined, undefined, { tag: 'hello' }),
      }, undefined, { limit: 5 }, true),
      baz: new ParsedQueryNode(undefined, undefined, { thing: null }),
    });
  });

  it(`replaces top level variables`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    jestExpect(expandVariables(map, { foo: 123, bar: 'ohai' })).toEqual({
      thing: new ParsedQueryNode(undefined, undefined, { a: 123, b: 'ohai' }),
    });
  });

  it(`replaces top level variables of nested fields`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        one {
          two(a: $foo) {
            three {
              four(b: $bar)
            }
          }
        }
      }
    `);

    jestExpect(expandVariables(map, { foo: 123, bar: 'ohai' })).toEqual({
      one: new ParsedQueryNode<JsonScalar>({
        two: new ParsedQueryNode<JsonScalar>({
          three: new ParsedQueryNode({
            four: new ParsedQueryNode(undefined, undefined, { b: 'ohai' }),
          }, undefined, undefined, true),
        }, undefined, { a: 123 }, true),
      }, undefined, undefined, true),
    });
  });

  it(`replaces nested variables`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(one: { two: $bar, three: [1, 2, $foo] })
      }
    `);

    jestExpect(expandVariables(map, { foo: 123, bar: 'ohai' })).toEqual({
      thing: new ParsedQueryNode(undefined, undefined, { one: { two: 'ohai', three: [1, 2, 123] } }),
    });
  });

  it(`asserts that variables are provided when passed undefined`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    jestExpect(() => {
      expandVariables(map, undefined);
    }).toThrow(/\$(foo|bar)/);
  });

  it(`asserts that variables are provided`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    jestExpect(() => {
      expandVariables(map, { foo: 123 });
    }).toThrow(/\$bar/);
  });

});
