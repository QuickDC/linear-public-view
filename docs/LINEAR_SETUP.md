# Linear Setup Guide

This guide walks you through setting up your Linear account to work with the public roadmap viewer.

## Table of Contents

1. [Creating a Linear API Key](#creating-a-linear-api-key)
2. [Finding Your Team ID](#finding-your-team-id)
3. [Finding Your Project ID](#finding-your-project-id)
4. [Setting Up Roadmap Labels](#setting-up-roadmap-labels)
5. [Testing Your Configuration](#testing-your-configuration)

## Creating a Linear API Key

Your API key is required to fetch issues and post comments.

### Steps:

1. Log into your Linear workspace
2. Click on your profile icon (bottom left)
3. Select **Settings**
4. Navigate to **API** in the sidebar
5. Click **Create new API key**
6. Give it a descriptive name:
   - Example: "Public Roadmap Viewer"
7. Copy the generated key (starts with `lin_api_`)
8. Paste it into your `.env` file:
   ```env
   LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
   ```

### Important Notes:

- **Keep this key secure**: Never commit it to version control
- **Key permissions**: The key will have the same permissions as your Linear account
- **Regeneration**: You can regenerate the key if it's compromised

## Finding Your Team ID

If you want to filter issues by a specific team, you'll need the team ID.

### Method 1: Using Linear's GraphQL API Explorer

1. Go to [Linear API Explorer](https://linear.app/api/explorer)
2. Run this query:
   ```graphql
   query {
     teams {
       nodes {
         id
         name
         key
       }
     }
   }
   ```
3. Find your team in the results and copy the `id` field
4. Add to your `.env`:
   ```env
   LINEAR_TEAM_ID=abc123-def456-...
   ```

### Method 2: Using the URL

1. Go to your team's Linear workspace
2. Look at the URL: `https://linear.app/your-workspace/team/ABC/...`
3. The team key is `ABC` (the uppercase letters)
4. Use the GraphQL query above to find the full team ID from the key

## Finding Your Project ID

To filter issues by a specific project:

### Using Linear's GraphQL API Explorer

1. Go to [Linear API Explorer](https://linear.app/api/explorer)
2. Run this query:
   ```graphql
   query {
     projects {
       nodes {
         id
         name
         state
       }
     }
   }
   ```
3. Find your project in the results and copy the `id` field
4. Add to your `.env`:
   ```env
   LINEAR_PROJECT_ID=xyz789-abc123-...
   ```

### Alternative: Filter by Active Projects Only

```graphql
query {
  projects(filter: { state: { eq: "started" } }) {
    nodes {
      id
      name
      state
      description
    }
  }
}
```

## Setting Up Roadmap Labels

You can filter issues by a label (e.g., "Roadmap", "Public", "External").

### Creating a Roadmap Label:

1. In Linear, go to **Settings** → **Labels**
2. Click **New label**
3. Name it "Roadmap" (or your preferred name)
4. Choose a color
5. Click **Create**

### Using Label Filter:

1. Add to your `.env`:
   ```env
   LINEAR_ROADMAP_LABEL=Roadmap
   ```
2. Apply the label to issues you want to appear on the public roadmap

### Finding Label Names:

If you're not sure what labels exist:

```graphql
query {
  issueLabels {
    nodes {
      id
      name
      color
    }
  }
}
```

Run this query in the [Linear API Explorer](https://linear.app/api/explorer).

## Filtering Options

You can use **one or more** of these filters:

| Filter | Env Variable | Description |
|--------|--------------|-------------|
| Team | `LINEAR_TEAM_ID` | Show issues from a specific team |
| Project | `LINEAR_PROJECT_ID` | Show issues from a specific project |
| Label | `LINEAR_ROADMAP_LABEL` | Show issues with a specific label |

### Example Configurations:

**Filter by team only:**
```env
LINEAR_API_KEY=lin_api_xxx
LINEAR_TEAM_ID=abc123-def456-...
```

**Filter by project only:**
```env
LINEAR_API_KEY=lin_api_xxx
LINEAR_PROJECT_ID=xyz789-abc123-...
```

**Filter by label only:**
```env
LINEAR_API_KEY=lin_api_xxx
LINEAR_ROADMAP_LABEL=Roadmap
```

**Combine filters (team + label):**
```env
LINEAR_API_KEY=lin_api_xxx
LINEAR_TEAM_ID=abc123-def456-...
LINEAR_ROADMAP_LABEL=Roadmap
```

## Testing Your Configuration

### 1. Test API Key

Run this query in [Linear API Explorer](https://linear.app/api/explorer):

```graphql
query {
  viewer {
    id
    name
    email
  }
}
```

If it works, your API key is valid.

### 2. Test Issue Fetching

Run this query to see what issues will appear on your roadmap:

```graphql
query {
  issues(
    filter: {
      team: { id: { eq: "YOUR_TEAM_ID" } }
      # OR project: { id: { eq: "YOUR_PROJECT_ID" } }
      # OR labels: { name: { eq: "Roadmap" } }
    }
    first: 10
  ) {
    nodes {
      id
      identifier
      title
      state {
        name
      }
    }
  }
}
```

Replace the filter with your chosen filter option.

### 3. Test the Application

```bash
npm run dev
```

Open [http://localhost:3000/roadmap](http://localhost:3000/roadmap) and verify:
- Issues are loading
- Issues are in the correct columns
- Clicking an issue opens the modal
- Comments are loading

## Common Issues

### No issues appearing

1. **Check your filter**: Make sure the team/project/label actually has issues
2. **Verify IDs**: Double-check your team/project IDs are correct
3. **Check label name**: Label names are case-sensitive ("Roadmap" ≠ "roadmap")
4. **API permissions**: Ensure your API key has read access to the workspace

### Comments not posting

1. **Write permissions**: Your API key needs write access
2. **Rate limiting**: Check if you've hit the 5 comments/hour limit
3. **Network errors**: Check the browser console for error messages

### Wrong issues appearing

1. **Remove unused filters**: Comment out or remove filter env variables you're not using
2. **Check filter logic**: The application combines filters with AND logic

## GraphQL Playground

For advanced users, you can test queries directly at:
- [Linear API Explorer](https://linear.app/api/explorer)
- [Linear API Documentation](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)

## Next Steps

Once your configuration is working:

1. Deploy with Docker (see main README)
2. Set up a reverse proxy with SSL
3. Share the public URL with stakeholders
4. Monitor rate limiting logs for spam

## Need Help?

- [Linear API Docs](https://developers.linear.app/)
- [GraphQL API Reference](https://studio.apollographql.com/public/Linear-API/home)
- Create an issue in this repository
