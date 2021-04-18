import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { ParsedQueryNode, parseQuery, VariableArgument } from '../../../src/ParsedQueryNode';
import { JsonScalar } from '../../../src/primitive';
import { getOperationOrDie } from '../../../src/util';
import { strictConfig } from '../../helpers';

describe(`parseQuery with parameterized queries`, () => {

  const context = new CacheContext(strictConfig);
  function parseOperation(operationString: string) {
    const operation = getOperationOrDie(gql(operationString));
    return parseQuery(context, {}, operation.selectionSet);
  }

  it(`parses single-field queries`, () => {
    jestExpect(parseOperation(`{ foo(arg: 1) }`)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode(undefined, undefined, { arg: 1 }),
      },
      variables: new Set(),
    });
  });

  it(`parses queries with variables`, () => {
    const operation = `
      query getThings($count: Int) {
        foo(limit: $count)
      }
    `;
    jestExpect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode(undefined, undefined, { limit: new VariableArgument('count') }),
      },
      variables: new Set(['count']),
    });
  });

  it(`flags ancestors of parameterized fields`, () => {
    const operation = `
      query getThings($count: Int) {
        foo {
          bar {
            baz(limit: $count)
          }
        }
      }
    `;
    jestExpect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          bar: new ParsedQueryNode({
            baz: new ParsedQueryNode(undefined, undefined, { limit: new VariableArgument('count') }),
          }, undefined, undefined, true),
        }, undefined, undefined, true),
      },
      variables: new Set(['count']),
    });
  });

  it(`preserves descendants of parameterized fields`, () => {
    const operation = `
      query getThings($count: Int) {
        foo {
          bar(limit: $count) {
            baz
          }
        }
      }
    `;
    jestExpect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          bar: new ParsedQueryNode<JsonScalar | VariableArgument>({
            baz: new ParsedQueryNode(),
          }, undefined, { limit: new VariableArgument('count') }),
        }, undefined, undefined, true),
      },
      variables: new Set(['count']),
    });
  });

});
