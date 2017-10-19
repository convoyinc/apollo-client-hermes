import { extract } from '../../../../../src/operations/extract';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { Serializeable, StaticNodeId } from '../../../../../src/schema';
import { createSnapshot } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.extract`, () => {
  describe(`nested parameterized value`, () => {

    let extractResult: Serializeable.GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          one: {
            two: [
              {
                three: {
                  id: '30',
                  name: 'Three0',
                  extraValue: '30-42',
                },
              },
              {
                three: {
                  id: '31',
                  name: 'Three1',
                  extraValue: '31-42',
                },
              },
            ],
          },
        },
        `query getAFoo($id: ID!) {
          one {
            two {
              three(id: $id, withExtra: true) {
                id name extraValue
              }
            }
          }
        }`,
        { id: 1 }
      ).snapshot;

      extractResult = extract(snapshot);
    });

    it(`extracts JSON serialization object`, () => {
      const parameterizedId0 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 0, 'three'],
        { id: 1, withExtra: true }
      );

      const parameterizedId1 = nodeIdForParameterizedValue(
        QueryRootId,
        ['one', 'two', 1, 'three'],
        { id: 1, withExtra: true }
      );

      expect(extractResult).to.deep.eq({
        [QueryRootId]: {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          outbound: [
            { id: QueryRootId, path: ['one', 'two', 0, 'three'] },
            { id: QueryRootId, path: ['one', 'two', 1, 'three'] },
          ],
          data: {
            one: {
              two: [],
            },
          },
        },
        [parameterizedId0]: {
          type: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 0, 'three'] }],
          outbound: [{ id: '30', path: [] }],
        },
        '30': {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [],
          data: {
            id: '30',
            name: 'Three0',
            extraValue: '30-42',
          },
        },
        [parameterizedId1]: {
          type: Serializeable.NodeSnapshotType.ParameterizedValueSnapshot,
          inbound: [{ id: QueryRootId, path: ['one', 'two', 1, 'three'] }],
          outbound: [{ id: '31', path: [] }],
        },
        '31': {
          type: Serializeable.NodeSnapshotType.EntitySnapshot,
          inbound: [{ id: parameterizedId1, path: [] }],
          data: {
            id: '31',
            name: 'Three1',
            extraValue: '31-42',
          },
        },
      });
    });

  });
});