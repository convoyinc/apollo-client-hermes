import gql from 'graphql-tag';

import { Hermes } from '../../../../src';
import { CacheContext } from '../../../../src/context';
import { strictConfig } from '../../../helpers';

describe(`entity fragment without id`, () => {

  let hermes: Hermes;
  beforeEach(() => {
    hermes = new Hermes(new CacheContext(strictConfig));
    hermes.writeQuery({
      query: gql(`{
        entity {
          id
          child {
            id
            value
          }
        }
      }`),
      data: {
        entity: {
          id: 1,
          child: {
            id: 2,
            value: 'one',
          },
        },
      },
    });
  });

  it(`allows callers to update an entity with a fragment that doesn't select the id`, () => {
    hermes.writeFragment({
      id: '2',
      fragment: gql(`
        fragment aFragment on Child {
          value
        }
      `),
      data: {
        value: 'two',
      },
    });
  });

});
