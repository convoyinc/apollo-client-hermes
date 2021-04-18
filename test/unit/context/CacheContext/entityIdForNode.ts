import { CacheContext } from '../../../../src/context/CacheContext';

describe(`context.CacheContext`, () => {
  describe(`entityIdForNode`, () => {
    describe(`default behavior`, () => {

      let context: CacheContext;
      beforeAll(() => {
        context = new CacheContext();
      });

      it(`emits the id property from nodes`, () => {
        jestExpect(context.entityIdForValue({ id: 'hello' })).toBe('hello');
      });

      it(`coerces numbers to strings`, () => {
        jestExpect(context.entityIdForValue({ id: 123 })).toBe('123');
      });

      it(`treats all other types as undefined`, () => {
        jestExpect(context.entityIdForValue({ id: true })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: false })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: null })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: undefined } as any)).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: Symbol.iterator } as any)).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: {} })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id() {} } as any)).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: { id: 'hi' } })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: [] })).toBe(undefined);
        jestExpect(context.entityIdForValue({ id: ['hi'] })).toBe(undefined);
      });

      it(`ignores nodes that lack an id property`, () => {
        jestExpect(context.entityIdForValue(undefined as any)).toBe(undefined);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        jestExpect(context.entityIdForValue({ idd: 'hi' })).toBe(undefined);
        jestExpect(context.entityIdForValue([] as any)).toBe(undefined);
        jestExpect(context.entityIdForValue((() => {}) as any)).toBe(undefined);
      });

    });

    describe(`custom mapper`, () => {

      let context: CacheContext, mapper: jest.Mock<any>;
      beforeAll(() => {
        mapper = jest.fn();
        context = new CacheContext({
          entityIdForNode: mapper,
        });
      });

      it(`passes the value through if it's a string`, () => {
        mapper.mockReturnValueOnce('abc123');
        jestExpect(context.entityIdForValue({})).toBe('abc123');
      });

      it(`coerces numbers to strings`, () => {
        mapper.mockReturnValueOnce(1.2);
        jestExpect(context.entityIdForValue({})).toBe('1.2');
      });

      it(`treats other types as undefined`, () => {
        mapper.mockReturnValueOnce(true);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(false);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(null);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(undefined);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(Symbol.iterator);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce({});
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(() => {});
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce({ id: 'hi' });
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce([]);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(['hi']);
        jestExpect(context.entityIdForValue({})).toBe(undefined);
      });
    });
  });
});
