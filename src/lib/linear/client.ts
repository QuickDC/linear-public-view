import { GET_ISSUE_COMMENTS_QUERY, ADD_COMMENT_MUTATION } from './queries';
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
 * Builds a dynamic GraphQL query with only the filters that are provided
 */
function buildIssuesQuery(hasTeamId: boolean, hasProjectId: boolean, hasLabelName: boolean): string {
  const filters: string[] = [];

  if (hasTeamId) {
    filters.push('team: { id: { eq: $teamId } }');
  }
  if (hasProjectId) {
    filters.push('project: { id: { eq: $projectId } }');
  }
  if (hasLabelName) {
    filters.push('labels: { name: { eq: $labelName } }');
  }

  const filterString = filters.length > 0 ? `filter: { ${filters.join(', ')} }` : '';

  const variableDefinitions: string[] = [];
  if (hasTeamId) variableDefinitions.push('$teamId: String');
  if (hasProjectId) variableDefinitions.push('$projectId: String');
  if (hasLabelName) variableDefinitions.push('$labelName: String');

  const variablesString = variableDefinitions.length > 0 ? `(${variableDefinitions.join(', ')})` : '';

  return `
    query GetIssues${variablesString} {
      issues(
        ${filterString}
        ${filterString ? '' : ''}first: 100
      ) {
        nodes {
          id
          identifier
          title
          description
          state {
            name
          }
          labels {
            nodes {
              name
              color
            }
          }
          createdAt
          updatedAt
        }
      }
    }
  `;
}

/**
 * Fetches issues from Linear and normalizes them to public format
 */
export async function fetchIssues(): Promise<NormalizedIssue[]> {
  const variables: Record<string, string> = {};

  // Add optional filters from environment variables
  const hasTeamId = !!process.env.LINEAR_TEAM_ID;
  const hasProjectId = !!process.env.LINEAR_PROJECT_ID;
  const hasLabelName = !!process.env.LINEAR_ROADMAP_LABEL;

  if (hasTeamId) {
    variables.teamId = process.env.LINEAR_TEAM_ID!;
  }
  if (hasProjectId) {
    variables.projectId = process.env.LINEAR_PROJECT_ID!;
  }
  if (hasLabelName) {
    variables.labelName = process.env.LINEAR_ROADMAP_LABEL!;
  }

  const query = buildIssuesQuery(hasTeamId, hasProjectId, hasLabelName);
  const data = await linearGraphQL(query, variables);
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
