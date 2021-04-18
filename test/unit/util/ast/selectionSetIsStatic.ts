import gql from 'graphql-tag';

import { selectionSetIsStatic } from '../../../../src';

describe(`ast.selectionSetIsStatic`, () => {

  function selection(source: string) {
    const definition = gql(source).definitions[0];
    if ('selectionSet' in definition) {
      return definition.selectionSet;
    }
    throw new Error(`No selectionSet found in '${source}'`);
  }

  it(`considers truly static fragments as static`, () => {
    jestExpect(selectionSetIsStatic(selection(`
      fragment foo on Foo {
        one
        two {
          three
          four
        }
      }
    `))).toBe(true);
  });

  it(`considers truly static operations as static`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one
      two {
        three
        four
      }
    }`))).toBe(true);
  });

  it(`considers aliases as dynamic`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one: two
    }`))).toBe(false);
  });

  it(`considers parameterized fields as dynamic`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one(foo: 123)
    }`))).toBe(false);
  });

  it(`honors @static when on aliased fields`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one: two @static
    }`))).toBe(true);
  });

  it(`honors @static when on parameterized fields`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one(foo: 123) @static
    }`))).toBe(true);
  });

  it(`honors @static on nested fields`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one {
        two {
          three: foo @static
          four(bar: 123) @static
          five: baz(fizz: 321) @static
        }
      }
    }`))).toBe(true);
  });

  it(`walks inline fragments`, () => {
    jestExpect(selectionSetIsStatic(selection(`{
      one {
        ... on Foo {
          three: foo
        }
      }
    }`))).toBe(false);
  });

  describe(`selections with fragment spreads`, () => {

    const mainSelection = selection(`{
      foo { ...Foo }
    }`);

    it(`supports fragment walking`, () => {
      const fragmentGetter = jest.fn(() => {
        return selection(`{
          one: foo
          two(bar: 123)
        }`);
      });

      jestExpect(selectionSetIsStatic(mainSelection, fragmentGetter)).toBe(false);
      jestExpect(fragmentGetter.mock.calls).toEqual([
        ['Foo'],
      ]);
    });

    it(`throws for missing fragments`, () => {
      function fragmentGetter() {
        return undefined;
      }

      jestExpect(() => {
        selectionSetIsStatic(mainSelection, fragmentGetter);
      }).toThrow(/fragment.*Foo/);
    });

    it(`throws if you forget fragmentGetter`, () => {
      jestExpect(() => {
        selectionSetIsStatic(mainSelection);
      }).toThrow(/fragmentGetter/);
    });

    it(`walks inline fragments that contain the spread`, () => {
      const fragmentGetter = jest.fn(() => selection(`{ one: foo }`));
      jestExpect(selectionSetIsStatic(selection(`{
        one {
          ... on Foo {
            ...Foo
          }
        }
      }`), fragmentGetter)).toBe(false);
    });
  });
});
