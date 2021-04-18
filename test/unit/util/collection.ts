import { lazyImmutableDeepSet } from '../../../src/util/collection';

describe(`util.collection`, () => {
  describe('lazyImmutableDeepSet', () => {

    it(`constructs a new object if there is no target or original`, () => {
      const updated = lazyImmutableDeepSet(undefined, undefined, ['id'], 1);
      jestExpect(updated).toEqual({ id: 1 });
    });

    it(`doesn't modify the original`, () => {
      const original = { id: 1 };
      const updated = lazyImmutableDeepSet(undefined, original, ['name'], 'hi');
      jestExpect(original).toEqual({ id: 1 });
      jestExpect(updated).toEqual({ id: 1, name: 'hi' });
    });

    it(`doesn't modify nested objects`, () => {
      const original = { id: 1, deep: { value: 1 } };
      const updated = lazyImmutableDeepSet(undefined, original, ['deep', 'value'], 2);
      jestExpect(original).toEqual({ id: 1, deep: { value: 1 } });
      jestExpect(updated).toEqual({ id: 1, deep: { value: 2 } });
    });

    it(`doesn't modify nested arrays`, () => {
      const original = { id: 1, list: [1, 2, 3] };
      const updated = lazyImmutableDeepSet(undefined, original, ['list', 1], 222);
      jestExpect(original).toEqual({ id: 1, list: [1, 2, 3] });
      jestExpect(updated).toEqual({ id: 1, list: [1, 222, 3] });
    });

    it(`doesn't modify deeply nested arrays and objects`, () => {
      const original = {
        one: {
          two: [
            0,
            1,
            2,
            {
              four: [0, 1, 2, 3, 4, 5, 6],
            },
            4,
            5,
          ],
        },
      };
      const updated = lazyImmutableDeepSet(undefined, original, ['one', 'two', 3, 'four', 5], 555);
      jestExpect(original).toEqual({
        one: {
          two: [
            0,
            1,
            2,
            {
              four: [0, 1, 2, 3, 4, 5, 6],
            },
            4,
            5,
          ],
        },
      });
      jestExpect(updated).toEqual({
        one: {
          two: [
            0,
            1,
            2,
            {
              four: [0, 1, 2, 3, 4, 555, 6],
            },
            4,
            5,
          ],
        },
      });
    });

    it(`doesn't re-create the target if it already differs from the original`, () => {
      const original = { id: 1 };
      const updated1 = lazyImmutableDeepSet(undefined, original, ['name'], 'hi');
      const updated2 = lazyImmutableDeepSet(updated1, original, ['fizz'], 'buzz');
      jestExpect(updated1).toBe(updated2);
      jestExpect(updated2).toEqual({ id: 1, name: 'hi', fizz: 'buzz' });
    });

    it(`doesn't re-create nested objects if they already differ from the original`, () => {
      const original = { id: 1, deep: { value: 1 } };
      const updated1 = lazyImmutableDeepSet(undefined, original, ['deep', 'value'], 2);
      const updated2 = lazyImmutableDeepSet(updated1, original, ['deep', 'extra'], 3);
      jestExpect(updated1).toBe(updated2);
      jestExpect(updated2).toEqual({ id: 1, deep: { value: 2, extra: 3 } });
    });

    it(`doesn't re-create nested arrays if they already differ from the original`, () => {
      const original = { id: 1, list: [1, 2, 3] };
      const updated1 = lazyImmutableDeepSet(undefined, original, ['list', 0], 111);
      const updated2 = lazyImmutableDeepSet(updated1, original, ['list', 2], 333);
      jestExpect(updated1).toBe(updated2);
      jestExpect(updated2).toEqual({ id: 1, list: [111, 2, 333] });
    });

    it(`doesn't re-create deeply nested arrays and objects if they already differ from the original`, () => {
      const original = {
        one: {
          two: [
            0,
            1,
            2,
            {
              four: [0, 1, 2, 3, 4, 5, 6],
            },
            4,
            5,
          ],
        },
      };
      const updated1 = lazyImmutableDeepSet(undefined, original, ['one', 'two', 3, 'four', 5], 555);
      const updated2 = lazyImmutableDeepSet(updated1, original, ['one', 'two', 3, 'four', 4], 444);
      jestExpect(updated1).toBe(updated2);
      jestExpect(updated2).toEqual({
        one: {
          two: [
            0,
            1,
            2,
            {
              four: [0, 1, 2, 3, 444, 555, 6],
            },
            4,
            5,
          ],
        },
      });
    });

  });
});
