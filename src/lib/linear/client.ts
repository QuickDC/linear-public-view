import { GET_ISSUES_QUERY, GET_ISSUE_COMMENTS_QUERY, ADD_COMMENT_MUTATION } from './queries';
import { mapLinearStatus } from './status-mapper';
import type { LinearIssue, NormalizedIssue, NormalizedComment, AddCommentInput } from './types';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

/**
 * Makes a GraphQL request to Linear API
 */
async function linearGraphQL(query: string, variables: Record<string, any> = {}) {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    throw new Error('LINEAR_API_KEY environment variable is not set');
  }

  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

/**
 * Fetches issues from Linear and normalizes them to public format
 */
export async function fetchIssues(): Promise<NormalizedIssue[]> {
  const variables: Record<string, string> = {};

  // Add optional filters from environment variables
  if (process.env.LINEAR_TEAM_ID) {
    variables.teamId = process.env.LINEAR_TEAM_ID;
  }
  if (process.env.LINEAR_PROJECT_ID) {
    variables.projectId = process.env.LINEAR_PROJECT_ID;
  }
  if (process.env.LINEAR_ROADMAP_LABEL) {
    variables.labelName = process.env.LINEAR_ROADMAP_LABEL;
  }

  const data = await linearGraphQL(GET_ISSUES_QUERY, variables);
  const issues: LinearIssue[] = data.issues.nodes;

  // Normalize issues to public format with status mapping
  return issues.map(issue => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    status: mapLinearStatus(issue.state.name),
    labels: issue.labels.nodes,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  }));
}

/**
 * Fetches comments for a specific issue
 */
export async function fetchIssueComments(issueId: string): Promise<NormalizedComment[]> {
  const data = await linearGraphQL(GET_ISSUE_COMMENTS_QUERY, { issueId });

  if (!data.issue) {
    throw new Error(`Issue not found: ${issueId}`);
  }

  const comments = data.issue.comments.nodes;

  // Normalize comments to public format
  return comments.map((comment: any) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    author: comment.user?.name || 'Anonymous',
    email: comment.user?.email,
  }));
}

/**
 * Adds a public comment to a Linear issue
 * Formats the comment to indicate it's from the public roadmap
 */
export async function addComment(issueId: string, input: AddCommentInput): Promise<void> {
  // Format the comment body to indicate it's from the public roadmap
  const formattedBody = `[Public Roadmap Comment]
Name: ${input.name}${input.email ? `\nEmail: ${input.email}` : ''}

${input.comment}`;

  const data = await linearGraphQL(ADD_COMMENT_MUTATION, {
    issueId,
    body: formattedBody,
  });

  if (!data.commentCreate.success) {
    throw new Error('Failed to create comment');
  }
}
