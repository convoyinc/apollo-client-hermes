import { SelectionSetNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

/**
 * Change ids track diffs to the store that may eventually be rolled back.
 */
export type ChangeId = string;

/**
 * All node ids must be strings, for now.
 */
export type NodeId = string;

/**
 * Entity ids are just a specialized node id.
 *
 * Having a separate type is useful for documentation and safety.
 */
export type EntityId = NodeId;

/**
 * There are a few pre-defined nodes present in all schemas.
 */
export enum StaticNodeId {
  QueryRoot = '☣QueryRoot',
  MutationRoot = '☣MutationRoot',
  SubscriptionRoot = '☣SubscriptionRoot',
}

/**
 * All the information needed to describe a complete GraphQL query that can be
 * made against the cache (read or written).
 */
export interface Query {
  /** The id of the node to begin the query at. */
  readonly rootId: NodeId;
  /** The properties within the cache that the query is concerned with. */
  readonly selection: SelectionSetNode;
  /** Any variables used by parameterized edges within the selection set. */
  readonly variables?: object;
}