/**
 * GraphQL query to fetch issues from Linear
 * Supports optional filtering by team, project, or labels
 */
export const GET_ISSUES_QUERY = `
  query GetIssues($teamId: String, $projectId: String, $labelName: String) {
    issues(
      filter: {
        team: { id: { eq: $teamId } }
        project: { id: { eq: $projectId } }
        labels: { name: { eq: $labelName } }
      }
      first: 100
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

/**
 * GraphQL query to fetch comments for a specific issue
 */
export const GET_ISSUE_COMMENTS_QUERY = `
  query GetIssueComments($issueId: String!) {
    issue(id: $issueId) {
      id
      comments {
        nodes {
          id
          body
          createdAt
          user {
            name
            email
          }
        }
      }
    }
  }
`;

/**
 * GraphQL mutation to add a comment to an issue
 */
export const ADD_COMMENT_MUTATION = `
  mutation AddComment($issueId: String!, $body: String!) {
    commentCreate(input: {
      issueId: $issueId
      body: $body
    }) {
      success
      comment {
        id
        createdAt
      }
    }
  }
`;
