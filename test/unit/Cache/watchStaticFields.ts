import { Cache as CacheInterface } from '@apollo/client';

import { query, strictConfig } from '../../helpers';
import { Cache } from '../../../src';

describe(`Cache#watch`, () => {

  const fullGraph = query(`{
    foo {
      id
      bar {
        id
        name
      }
      baz {
        id
        name
      }
    }
  }`);

  const simpleGraph = query(`{
    foo {
      id
      bar {
        id
        name
      }
    }
  }`);

  const partialOverlap = query(`{
    foo {
      id
      baz {
        id
        name
      }
    }
  }`);

  const indirectEdit = query(`{
    thing {
      id
      name
    }
  }`);

  const baseState = {
    foo: {
      id: 1,
      bar: {
        id: 2,
        name: 'bar',
      },
      baz: {
        id: 3,
        name: 'baz',
      },
    },
  };

  let cache: Cache;
  beforeEach(() => {
    cache = new Cache(strictConfig);
    cache.write(fullGraph, baseState);
  });

  it(`triggers a callback immediately upon registration`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));

    jestExpect(updates.length).toBe(1);
    const [update] = updates;
    jestExpect(update.result).toEqual(baseState);
    jestExpect(update.complete).toBe(true);
  });

  it(`triggers a callback after writing the same query with new values`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(simpleGraph, { foo: { id: 1, bar: { id: 3, name: 'bar' } } });

    jestExpect(updates.length).toBe(2);

    const [, update] = updates;
    jestExpect((update.result as any).foo.bar.id).toBe(3);
    jestExpect(update.complete).toBe(true);
  });

  it(`doesn't trigger a callback if unrelated entities change`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(partialOverlap, { foo: { id: 1, baz: { id: 3, name: 'baz2' } } });

    jestExpect(updates.length).toBe(1);
  });

  it(`triggers an update on indirect edits to an entity`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(indirectEdit, { thing: { id: 2, name: 'bar2' } });

    jestExpect(updates.length).toBe(2);
    const [, update] = updates;
    jestExpect((update.result as any).foo.bar.name).toBe('bar2');
    jestExpect(update.complete).toBe(true);
  });

  it(`triggers an update on reference updates from the query root`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(simpleGraph, { foo: { id: 100, bar: { id: 2, name: 'bar' } } });

    jestExpect(updates.length).toBe(2);
    const [, update] = updates;
    jestExpect((update.result as any).foo.id).toBe(100);
    jestExpect(update.complete).toBe(true);
  });

  it(`handles transitions from complete to incomplete`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    cache.watch(simpleGraph, newResult => updates.push(newResult));
    cache.write(partialOverlap, { foo: { id: 100, baz: { id: 3, name: 'baz' } } });

    jestExpect(updates.length).toBe(2);
    const [, update] = updates;
    jestExpect((update.result as any).foo.id).toBe(100);
    jestExpect((update.result as any).foo.bar).toBe(undefined);
    jestExpect(update.complete).toBe(false);
  });

  it(`handles transitions from incomplete to complete`, () => {
    const updates: CacheInterface.DiffResult<any>[] = [];
    const cache2 = new Cache(strictConfig);
    cache2.write(partialOverlap, { foo: { id: 1, baz: { id: 3, name: 'baz' } } });
    cache2.watch(simpleGraph, newResult => updates.push(newResult));
    cache2.write(simpleGraph, { foo: { id: 1, bar: { id: 2, name: 'bar' } } });

    jestExpect(updates.length).toBe(2);
    const [initial, update] = updates;

    jestExpect(initial.complete).toBe(false);
    jestExpect(update.complete).toBe(true);
  });

});
