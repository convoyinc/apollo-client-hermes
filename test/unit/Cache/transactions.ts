import { Cache } from '../../../src/Cache';
import { StaticNodeId } from '../../../src/schema';
import { query } from '../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`transactions`, () => {

  const simpleQuery = query(`{
    foo {
      bar
      baz
    }
  }`);

  let cache: Cache, debug: jest.Mock<any>, info: jest.Mock<any>, warn: jest.Mock<any>;
  beforeEach(() => {
    debug = jest.fn();
    info = jest.fn();
    warn = jest.fn();
    cache = new Cache({
      logger: { debug, info, warn, group: jest.fn(), groupEnd: jest.fn() },
    });
  });

  it(`commits on success`, () => {
    cache.transaction((transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
    });

    jestExpect(cache.getEntity(QueryRootId)).toEqual({
      foo: { bar: 1, baz: 'hi' },
    });
    jestExpect(cache.getSnapshot().baseline).toEqual(cache.getSnapshot().optimistic);
  });

  it(`doesn't modify the cache until completion`, () => {
    cache.transaction((transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      jestExpect(cache.getEntity(QueryRootId)).toBe(undefined);
    });
  });

  it(`rolls back on error`, () => {
    cache.transaction((transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      throw new Error(`bewm`);
    });

    jestExpect(cache.getEntity(QueryRootId)).toBe(undefined);
  });

  it(`logs on error`, () => {
    const exception = new Error(`bewm`);
    cache.transaction((transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hi' } });
      throw exception;
    });

    jestExpect(warn.mock.calls.length).toBe(1);
    jestExpect(warn.mock.calls[0]).toContain(exception.toString());
  });

  it(`read optimistic transaction`, () => {
    cache.transaction(
      /** changeIdOrCallback */'123',
      (transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
      }
    );

    jestExpect(cache.read(simpleQuery, /** optimistic */ true).result).toEqual({
      foo: { bar: 1, baz: 'hello' },
    });
  });

  it(`read multiple optimistic transactions`, () => {
    cache.transaction(
      /** changeIdOrCallback */'123',
      (transaction) => {
        transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
      }
    );

    const otherQuery = query(`{
      fizz {
        buzz
      }
    }`);

    cache.transaction(
      /** changeIdOrCallback */'456',
      (transaction) => {
        transaction.write(otherQuery, { fizz: { buzz: 'boom' } });
      }
    );

    jestExpect(cache.read(simpleQuery, /** optimistic */ true).result).toEqual(
      jestExpect.objectContaining({ foo: { bar: 1, baz: 'hello' } })
    );

    jestExpect(cache.read(otherQuery, /** optimistic */ true).result).toEqual(
      jestExpect.objectContaining({ fizz: { buzz: 'boom' } })
    );
  });

  it(`rolls back optimistic transactions`, () => {
    cache.transaction(/** changeIdOrCallback */ '123', (transaction) => {
      transaction.write(simpleQuery, { foo: { bar: 1, baz: 'hello' } });
    });

    jestExpect(cache.read(simpleQuery, /** optimistic */ true).result).toEqual({
      foo: { bar: 1, baz: 'hello' },
    });

    cache.transaction((transaction) => {
      transaction.rollback('123');
    });

    jestExpect(cache.read(simpleQuery, /** optimistic */ true).result).toBe(
      undefined
    );
  });
});
