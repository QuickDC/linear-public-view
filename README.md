# Public Linear Roadmap Viewer

A public, read-only roadmap viewer for Linear that allows external stakeholders to view issues and add comments without requiring Linear access.

## Features

- **4-Column Kanban Board**: Issues organized into Todo, In Progress, Done, and Cancelled
- **Public Commenting**: Stakeholders can leave feedback without Linear accounts
- **Status Mapping**: Automatically maps Linear workflow states to public columns
- **Spam Protection**: Honeypot field to prevent bot submissions
- **Rate Limiting**: IP-based rate limiting (5 comments per hour)
- **Caching**: In-memory caching for better performance
- **Docker Support**: Easy deployment with Docker and docker-compose

## Prerequisites

- Node.js 18+ and npm 9+
- A Linear account with Business plan
- Linear API key with read/write access

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
LINEAR_API_KEY=lin_api_xxx

# Optional filters (at least one recommended)
LINEAR_TEAM_ID=your_team_id
LINEAR_PROJECT_ID=your_project_id
LINEAR_ROADMAP_LABEL=Roadmap

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
CACHE_TTL_ISSUES=300000
CACHE_TTL_COMMENTS=120000

# Rate limiting
RATE_LIMIT_MAX_COMMENTS=5
RATE_LIMIT_WINDOW_MS=3600000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/roadmap](http://localhost:3000/roadmap) in your browser.

## Getting Your Linear API Key

1. Go to Linear Settings → API
2. Click "Create new API key"
3. Give it a descriptive name (e.g., "Public Roadmap")
4. Copy the key (starts with `lin_api_`)
5. Paste into your `.env` file

**Important**: Keep this key secure and never commit it to version control.

## Finding Linear IDs

See [docs/LINEAR_SETUP.md](docs/LINEAR_SETUP.md) for detailed instructions on finding:
- Team IDs
- Project IDs
- Label names for filtering

## Status Mapping

Linear workflow states are mapped to 4 public columns:

| Public Column | Linear States |
|--------------|---------------|
| Todo | Backlog, Todo |
| In Progress | In Progress |
| Done | Done, Completed |
| Cancelled | Canceled |

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t linear-roadmap .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables in Docker

Create a `.env` file in the project root with your configuration. Docker Compose will automatically load it.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── issues/
│   │   │   ├── route.ts              # GET /api/issues
│   │   │   └── [id]/
│   │   │       └── comments/
│   │   │           └── route.ts      # GET/POST /api/issues/:id/comments
│   │   └── health/
│   │       └── route.ts              # GET /api/health (healthcheck)
│   ├── roadmap/
│   │   └── page.tsx                  # Main roadmap page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home (redirects to /roadmap)
│   └── globals.css                   # Global styles
├── components/
│   ├── KanbanBoard.tsx               # 4-column board
│   ├── IssueCard.tsx                 # Issue card component
│   ├── IssueModal.tsx                # Issue detail modal
│   ├── CommentList.tsx               # Comment display
│   └── CommentForm.tsx               # Add comment form
└── lib/
    ├── linear/
    │   ├── client.ts                 # Linear API client
    │   ├── queries.ts                # GraphQL queries
    │   ├── types.ts                  # TypeScript types
    │   └── status-mapper.ts          # Status mapping logic
    ├── cache/
    │   └── in-memory.ts              # In-memory cache
    ├── security/
    │   ├── honeypot.ts               # Honeypot validation
    │   └── rate-limiter.ts           # Rate limiting
    └── utils.ts                      # Utility functions
```

## API Endpoints

### GET /api/issues
Fetches all issues (cached for 5 minutes)

**Response:**
```json
{
  "data": [...],
  "cached": true
}
```

### GET /api/issues/:id/comments
Fetches comments for a specific issue (cached for 2 minutes)

**Response:**
```json
{
  "data": [...],
  "cached": false
}
```

### POST /api/issues/:id/comments
Adds a comment to an issue

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",  // optional
  "comment": "Great feature!",
  "honeypot": ""  // must be empty
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully"
}
```

## Security

- **API Key Protection**: Linear API key is server-side only, never exposed to frontend
- **Honeypot**: Hidden form field to catch bots
- **Rate Limiting**: Max 5 comments per IP per hour
- **Input Validation**: Name and comment are sanitized and length-limited
- **Read-Only**: No ability to edit, delete, or change issue status

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `LINEAR_API_KEY` | - | **Required** - Your Linear API key |
| `LINEAR_TEAM_ID` | - | Optional - Filter by team |
| `LINEAR_PROJECT_ID` | - | Optional - Filter by project |
| `LINEAR_ROADMAP_LABEL` | - | Optional - Filter by label name |
| `CACHE_TTL_ISSUES` | 300000 | Cache TTL for issues (ms) |
| `CACHE_TTL_COMMENTS` | 120000 | Cache TTL for comments (ms) |
| `RATE_LIMIT_MAX_COMMENTS` | 5 | Max comments per IP per window |
| `RATE_LIMIT_WINDOW_MS` | 3600000 | Rate limit window (1 hour) |

## Known Limitations

1. **Real-time updates**: Changes in Linear take up to 5 minutes to appear (cache)
2. **Comment threading**: All comments are flat, no nested replies
3. **Attachments**: Cannot upload files in public comments
4. **User attribution**: Public comments appear as API key owner in Linear
5. **Filtering**: Only one team/project/label filter supported
6. **Search**: No search functionality
7. **Sorting**: Issues displayed in creation order only

## Troubleshooting

### Issues not loading

1. Check your Linear API key is correct
2. Verify the team/project/label IDs exist
3. Check the console for error messages
4. Ensure your Linear API key has read access

### Comments not posting

1. Check rate limiting (5 comments/hour)
2. Verify your Linear API key has write access
3. Check the browser console for errors
4. Ensure name and comment fields are filled

### Docker issues

1. Make sure `.env` file exists and is configured
2. Check Docker logs: `docker-compose logs -f`
3. Verify port 3000 is not in use

## Contributing

This is a standalone project. Feel free to fork and customize for your needs.

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
