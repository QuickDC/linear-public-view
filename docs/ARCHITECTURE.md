# Architecture Documentation

This document describes the technical architecture of the Public Linear Roadmap Viewer.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Public User                          │
│              (Unauthenticated Browser)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Reverse Proxy (Optional)                   │
│                nginx / Caddy / Traefik                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           Next.js Application (Port 3000)               │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Frontend (React)                       │  │
│  │  - /roadmap page                                 │  │
│  │  - KanbanBoard component                         │  │
│  │  - IssueModal component                          │  │
│  │  - CommentForm component                         │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               │ Fetch API calls                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           API Routes (Next.js)                   │  │
│  │  - GET  /api/issues                              │  │
│  │  - GET  /api/issues/:id/comments                 │  │
│  │  - POST /api/issues/:id/comments                 │  │
│  │  - GET  /api/health                              │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Security Layer                           │  │
│  │  - Honeypot validation                           │  │
│  │  - IP-based rate limiting                        │  │
│  │  - Input sanitization                            │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         In-Memory Cache                          │  │
│  │  - Issues: 5 min TTL                             │  │
│  │  - Comments: 2 min TTL                           │  │
│  │  - Automatic cleanup                             │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Linear API Client                        │  │
│  │  - GraphQL queries                               │  │
│  │  - Status mapping                                │  │
│  │  - Comment formatting                            │  │
│  └────────────┬─────────────────────────────────────┘  │
└───────────────┼──────────────────────────────────────────┘
                │
                │ GraphQL over HTTPS
                │ Authorization: lin_api_xxx
                ▼
┌─────────────────────────────────────────────────────────┐
│             Linear GraphQL API                          │
│           https://api.linear.app/graphql                │
│                                                         │
│  - Issues data                                          │
│  - Comments data                                        │
│  - Workflow states                                      │
│  - Labels                                               │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **API Client**: Native fetch (no Linear SDK)

### Infrastructure
- **Deployment**: Docker + docker-compose
- **Caching**: In-memory (Map-based)
- **Security**: Honeypot + IP rate limiting

## Data Flow

### Fetching Issues

```
User visits /roadmap
    ↓
KanbanBoard component mounted
    ↓
Fetch /api/issues
    ↓
API Route checks cache
    ↓
Cache miss? → Fetch from Linear API
    ↓
Apply status mapping
    ↓
Store in cache (5 min)
    ↓
Return to frontend
    ↓
Render 4-column board
```

### Adding a Comment

```
User fills comment form
    ↓
Submit POST /api/issues/:id/comments
    ↓
Validate honeypot field
    ↓
Check rate limit (IP-based)
    ↓
Validate inputs (name, email, comment)
    ↓
Sanitize inputs
    ↓
Format comment body:
    [Public Roadmap Comment]
    Name: John Doe
    Email: john@example.com

    Comment text...
    ↓
POST to Linear API (commentCreate mutation)
    ↓
Invalidate comments cache for this issue
    ↓
Return success
    ↓
Frontend refreshes comments
```

## Status Mapping Logic

Linear workflow states are normalized to 4 public statuses:

```typescript
const STATUS_MAP = {
  'Backlog': 'todo',
  'Todo': 'todo',
  'In Progress': 'in-progress',
  'Done': 'done',
  'Completed': 'done',
  'Canceled': 'cancelled',
}
```

**Why?** Linear allows custom workflow states, but we want a consistent public view with exactly 4 columns as specified.

## Caching Strategy

### Cache Keys
- **Issues**: `issues:all`
- **Comments**: `issue:{issueId}:comments`

### TTL (Time to Live)
- **Issues**: 5 minutes (configurable)
- **Comments**: 2 minutes (configurable)

### Cache Invalidation
- **Issues**: No auto-invalidation (5 min expiry)
- **Comments**: Invalidated when new comment is posted

### Memory Management
- Automatic cleanup runs every 5 minutes
- Removes expired entries to prevent memory leaks

## Security Measures

### 1. API Key Protection
- Stored in environment variables
- Only accessed server-side
- Never exposed to frontend or browser

### 2. Honeypot Field
```html
<!-- Hidden field in comment form -->
<input name="website" style="display:none" />
```
- Legitimate users won't see/fill it
- Bots auto-fill all fields → rejected

### 3. Rate Limiting
- **Scope**: Per IP address
- **Limit**: 5 comments per hour (configurable)
- **Storage**: In-memory Map
- **Cleanup**: Every 10 minutes

### 4. Input Validation
- **Name**: Max 100 chars, required, trimmed
- **Email**: Max 100 chars, optional, validated format
- **Comment**: Max 5000 chars, required, trimmed

### 5. Read-Only Access
Users cannot:
- Edit issues
- Delete issues
- Change issue status
- Modify titles/descriptions

## API Design

### GET /api/issues

**Purpose**: Fetch all roadmap issues

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "identifier": "QDC-123",
      "title": "Issue title",
      "description": "Markdown description",
      "status": "todo",
      "labels": [
        { "name": "Feature", "color": "#ff0000" }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "cached": true
}
```

**Caching**: 5 minutes

### GET /api/issues/:id/comments

**Purpose**: Fetch comments for a specific issue

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "body": "Comment text",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": "John Doe",
      "email": "john@example.com"
    }
  ],
  "cached": false
}
```

**Caching**: 2 minutes

### POST /api/issues/:id/comments

**Purpose**: Add a comment to an issue

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "comment": "Great feature!",
  "honeypot": ""
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Comment added successfully"
}
```

**Response (Rate Limited)**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 5 comments per hour. Try again later.",
  "retryAfter": 1800000
}
```

**Security**: Honeypot + rate limiting + validation

## Component Hierarchy

```
App
└── RootLayout
    └── RoadmapPage
        └── KanbanBoard
            ├── IssueCard (per issue)
            └── IssueModal
                ├── CommentList
                │   └── Comment (per comment)
                └── CommentForm
```

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LINEAR_API_KEY` | ✅ | - | Linear API authentication |
| `LINEAR_TEAM_ID` | ❌ | - | Filter issues by team |
| `LINEAR_PROJECT_ID` | ❌ | - | Filter issues by project |
| `LINEAR_ROADMAP_LABEL` | ❌ | - | Filter issues by label |
| `CACHE_TTL_ISSUES` | ❌ | 300000 | Issue cache TTL (ms) |
| `CACHE_TTL_COMMENTS` | ❌ | 120000 | Comment cache TTL (ms) |
| `RATE_LIMIT_MAX_COMMENTS` | ❌ | 5 | Max comments per window |
| `RATE_LIMIT_WINDOW_MS` | ❌ | 3600000 | Rate limit window (ms) |

## Deployment Architecture

### Docker Container
```
Docker Image
├── Node.js 18 Alpine
├── Next.js standalone build
├── Environment variables (.env)
└── Exposed port 3000
```

### docker-compose.yml
- Single service: `app`
- Port mapping: `3000:3000`
- Auto-restart: `unless-stopped`
- Health check: `/api/health`

### Production Considerations

1. **Reverse Proxy**
   - nginx/Caddy in front of Docker container
   - SSL/TLS termination
   - Rate limiting (additional layer)

2. **Monitoring**
   - Health check endpoint
   - Docker logs
   - Rate limit metrics

3. **Scaling**
   - For high traffic, consider:
     - Redis for distributed caching
     - Multiple container instances (load balanced)
     - CDN for static assets

## GraphQL Queries

### Fetch Issues
```graphql
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
      state { name }
      labels { nodes { name color } }
      createdAt
      updatedAt
    }
  }
}
```

### Fetch Comments
```graphql
query GetIssueComments($issueId: String!) {
  issue(id: $issueId) {
    id
    comments {
      nodes {
        id
        body
        createdAt
        user { name email }
      }
    }
  }
}
```

### Add Comment
```graphql
mutation AddComment($issueId: String!, $body: String!) {
  commentCreate(input: {
    issueId: $issueId
    body: $body
  }) {
    success
    comment { id createdAt }
  }
}
```

## Performance Optimizations

1. **Caching**: Reduces Linear API calls
2. **Static Assets**: Next.js optimization
3. **Code Splitting**: Automatic route-based splitting
4. **Image Optimization**: Next.js Image component (if used)
5. **Standalone Build**: Minimal Docker image size

## Limitations & Trade-offs

| Limitation | Reason | Workaround |
|------------|--------|------------|
| In-memory cache | Simplicity, no external deps | Use Redis for production scale |
| Single instance | Docker setup | Load balancer + multiple containers |
| 5-min cache delay | Performance vs freshness | Reduce TTL or add manual refresh |
| IP-based rate limiting | Simple implementation | Use session tokens for better tracking |
| No real-time updates | Caching + polling | WebSockets or SSE for live data |

## Future Enhancements

1. **Redis Caching**: For multi-instance deployments
2. **WebSocket Updates**: Real-time issue/comment updates
3. **User Sessions**: Better rate limiting and user tracking
4. **Advanced Filtering**: Multiple teams, search, sorting
5. **Comment Editing**: Allow users to edit their comments
6. **Attachments**: Support file uploads in comments
7. **Analytics**: Track view counts, popular issues
8. **Notifications**: Email notifications for new comments

## Security Checklist

- [x] API key stored in environment variables
- [x] API key never exposed to frontend
- [x] Honeypot for bot detection
- [x] Rate limiting per IP
- [x] Input validation and sanitization
- [x] No write access to issue properties
- [x] HTTPS recommended for production
- [ ] CORS headers (configure for production domain)
- [ ] CSP headers (Content Security Policy)
- [ ] Rate limiting at reverse proxy level

## Monitoring & Logging

### Application Logs
- Linear API errors
- Unknown workflow states
- Rate limit violations
- Comment submission failures

### Recommended Monitoring
- Health check endpoint status
- Cache hit/miss ratio
- Rate limit triggers per IP
- Linear API response times
- Container resource usage

## Troubleshooting Guide

### High Memory Usage
- Check cache size
- Verify cleanup is running
- Consider Redis for external cache

### Slow Response Times
- Check Linear API latency
- Verify cache is working
- Increase cache TTL

### Missing Issues
- Verify filter configuration
- Check Linear API permissions
- Test GraphQL query directly

### Comment Failures
- Check Linear API write permissions
- Verify rate limiting isn't too strict
- Check for API key expiry

## Conclusion

This architecture balances simplicity, security, and performance for a public-facing Linear roadmap. The design prioritizes:
- **Security**: API key protection, spam prevention
- **Performance**: In-memory caching, static optimization
- **Simplicity**: No external dependencies, easy deployment
- **Scalability**: Docker-based, ready for load balancing
