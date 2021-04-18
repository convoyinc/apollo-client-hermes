import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

import { buildRawOperationFromQuery } from '../../../src/apollo/util';
import { CacheContext } from '../../../src/context';
import { QueryInfo } from '../../../src/context/QueryInfo';
import { strictConfig } from '../../helpers';

describe(`context.QueryInfo`, () => {

  const context = new CacheContext(strictConfig);

  describe(`with a valid query document`, () => {

    let query: DocumentNode, info: QueryInfo;
    beforeAll(() => {
      query = gql`
        fragment completeStuff on Stuff {
          id
          name
        }

        query getThings($ids: [ID]!) {
          stuff { ...completeStuff }
          things(ids: $ids) {
            ...completeThing
          }
        }

        fragment completeThing on Thing {
          id
          name
          extra
        }
      `;

      info = new QueryInfo(context, buildRawOperationFromQuery(query));
    });

    it(`hangs onto the document, with no changes`, () => {
      jestExpect(info.document).toBe(query);
    });

    it(`extracts the operation`, () => {
      jestExpect(info.operation.name!.value).toBe('getThings');
      jestExpect(info.operation.operation).toBe('query');
    });

    it(`extracts the operation name`, () => {
      jestExpect(info.operationName).toBe('getThings');
    });

    it(`builds a fragment map`, () => {
      jestExpect(Object.keys(info.fragmentMap)).toEqual(jestExpect.arrayContaining(['completeStuff', 'completeThing']));
    });

    it(`collects the variables that are used`, () => {
      jestExpect(info.variables).toEqual(new Set(['ids']));
    });

  });

  describe(`with variable defaults`, () => {

    let query: DocumentNode, info: QueryInfo;
    beforeAll(() => {
      query = gql`
        mutation makeCheesy($ids: [ID]!, $name: String = "Munster", $stinky: Boolean) {
          updateCheesiness(ids: $ids, name: $name, stinky: $stinky)
        }
      `;

      info = new QueryInfo(context, buildRawOperationFromQuery(query));
    });

    it(`collects the variables that are used`, () => {
      jestExpect(info.variables).toEqual(new Set(['ids', 'name', 'stinky']));
    });

    it(`collects default values for operation parameters`, () => {
      jestExpect(info.variableDefaults['name']).toBe('Munster');
    });

    it(`includes optional arguments as having a default value of null`, () => {
      jestExpect(info.variableDefaults['stinky']).toBe(null);
    });

    it(`excludes required parameters from the defaults`, () => {
      jestExpect(Object.keys(info.variableDefaults)).not.toEqual(jestExpect.arrayContaining(['ids']));
    });

  });

  describe(`validation`, () => {

    it(`asserts that all variables are declared`, () => {
      jestExpect(() => {
        new QueryInfo(context, buildRawOperationFromQuery(gql`
          query whoops($foo: Number) {
            thing(foo: $foo, bar: $bar, baz: $baz)
          }
        `));
      }).toThrow(/\$bar(.|\n)*\$baz/);
    });

    it(`asserts that all variables are declared, when used via fragments`, () => {
      jestExpect(() => {
        new QueryInfo(context, buildRawOperationFromQuery(gql`
          query whoops($foo: Number) {
            thing { ...stuff }
          }

          fragment stuff on Thing {
            stuff(foo: $foo, bar: $bar, baz: $baz)
          }
        `));
      }).toThrow(/\$bar(.|\n)*\$baz/);
    });

    it(`asserts that all variables are used`, () => {
      jestExpect(() => {
        new QueryInfo(context, buildRawOperationFromQuery(gql`
          query whoops($foo: Number, $bar: String, $baz: ID) {
            thing(bar: $bar)
          }
        `));
      }).toThrow(/\$foo(.|\n)*\$baz/);
    });

    it(`asserts that all variables are used, including fragments`, () => {
      jestExpect(() => {
        new QueryInfo(context, buildRawOperationFromQuery(gql`
          query whoops($foo: Number, $bar: String, $baz: ID) {
            thing { ...stuff }
          }

          fragment stuff on Thing {
            thing(bar: $bar)
          }
        `));
      }).toThrow(/\$foo(.|\n)*\$baz/);
    });

  });

});
