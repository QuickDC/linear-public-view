import type { PublicStatus } from './types';

/**
 * Maps Linear workflow state names to public status
 * Following the spec:
 * - Todo: Backlog, Todo
 * - In Progress: In Progress
 * - Done: Done, Completed
 * - Cancelled: Canceled
 */
const STATUS_MAP: Record<string, PublicStatus> = {
  'Backlog': 'todo',
  'Todo': 'todo',
  'In Progress': 'in-progress',
  'Done': 'done',
  'Completed': 'done',
  'Canceled': 'cancelled',
  'In Dev': 'in-progress',
  'Dev Done': 'in-progress',
  'In Wessense': 'in-progress',
  'In Manual QA': 'in-progress'
};

/**
 * Maps a Linear state name to one of the 4 public statuses
 * Falls back to 'todo' if the state is not recognized
 */
export function mapLinearStatus(stateName: string): PublicStatus {
  const normalized = STATUS_MAP[stateName];
  if (!normalized) {
    console.warn(`Unknown Linear state: ${stateName}, defaulting to 'todo'`);
    return 'todo';
  }
  return normalized;
}

/**
 * Returns human-readable label for public status
 */
export function getStatusLabel(status: PublicStatus): string {
  const labels: Record<PublicStatus, string> = {
    'todo': 'Todo',
    'in-progress': 'In Progress',
    'done': 'Done',
    'cancelled': 'Cancelled',
  };
  return labels[status];
}

/**
 * Returns all public statuses in display order
 */
export function getAllStatuses(): PublicStatus[] {
  return ['todo', 'in-progress', 'done', 'cancelled'];
}
