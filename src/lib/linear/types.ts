export interface LinearLabel {
  name: string;
  color: string;
}

export interface LinearState {
  name: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: LinearState;
  labels: {
    nodes: LinearLabel[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface LinearComment {
  id: string;
  body: string;
  createdAt: string;
  user: {
    name: string;
    email?: string;
  } | null;
}

export type PublicStatus = 'todo' | 'in-progress' | 'done' | 'cancelled';

export interface NormalizedIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  status: PublicStatus;
  labels: LinearLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedComment {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  email?: string;
}

export interface AddCommentInput {
  name: string;
  email?: string;
  comment: string;
}
