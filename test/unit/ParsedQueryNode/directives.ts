import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { parseQuery } from '../../../src/ParsedQueryNode';
import { fragmentMapForDocument, getOperationOrDie } from '../../../src/util';
import { strictConfig } from '../../helpers';

describe(`parseQuery with queries with directives`, () => {

  const context = new CacheContext(strictConfig);
  function parseOperation(operationString: string) {
    const document = gql(operationString);
    const operation = getOperationOrDie(document);
    const FragmentMap = fragmentMapForDocument(document);
    return parseQuery(context, FragmentMap, operation.selectionSet);
  }

  it(`collects variables in directives on fields`, () => {
    const operation = `{
      foo {
        bar @simple(arg: $varA)
        baz(bat: "bad") @complex(arg0: $varB, arg1: $varC)
      }
    }`;
    jestExpect(parseOperation(operation).variables).toEqual(
      new Set(['varA', 'varB', 'varC'])
    );
  });

  it(`collects variables in directives in and on fragments`, () => {
    const operation = `
      query getThings {
        foo {
          ...smallFoo @simple(arg0: $varD)
          ...bigFoo
        }
      }

      fragment smallFoo on Foo {
        id
      }

      fragment bigFoo on Foo {
        id @simple(var0: $varA)
        name @complex(arg0: $varB, arg1: $varC)
      }
    `;
    jestExpect(parseOperation(operation).variables).toEqual(
      new Set(['varA', 'varB', 'varC', 'varD'])
    );
  });

});
