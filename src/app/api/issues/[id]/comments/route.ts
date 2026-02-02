import { NextRequest, NextResponse } from 'next/server';
import { fetchIssueComments, addComment } from '@/lib/linear/client';
import cache, { CacheKeys } from '@/lib/cache/in-memory';
import { validateHoneypot } from '@/lib/security/honeypot';
import { checkRateLimit } from '@/lib/security/rate-limiter';

const CACHE_TTL = parseInt(process.env.CACHE_TTL_COMMENTS || '120000', 10); // 2 minutes default

/**
 * GET /api/issues/[id]/comments
 * Fetch comments for a specific issue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;

    // Try to get from cache first
    const cacheKey = CacheKeys.issueComments(issueId);
    const cachedComments = cache.get(cacheKey);

    if (cachedComments) {
      return NextResponse.json({
        data: cachedComments,
        cached: true,
      });
    }

    // Fetch from Linear API
    const comments = await fetchIssueComments(issueId);

    // Cache the results
    cache.set(cacheKey, comments, CACHE_TTL);

    return NextResponse.json({
      data: comments,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch comments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues/[id]/comments
 * Add a new comment to an issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;
    const body = await request.json();

    // Validate honeypot field
    if (!validateHoneypot(body.honeypot)) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Maximum ${rateLimitResult.limit} comments per hour. Try again later.`,
          retryAfter: rateLimitResult.resetIn,
        },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!body.name || !body.comment) {
      return NextResponse.json(
        { error: 'Name and comment are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic validation)
    const name = String(body.name).trim().slice(0, 100);
    const email = body.email ? String(body.email).trim().slice(0, 100) : undefined;
    const comment = String(body.comment).trim().slice(0, 5000);

    if (name.length === 0 || comment.length === 0) {
      return NextResponse.json(
        { error: 'Name and comment cannot be empty' },
        { status: 400 }
      );
    }

    // Add comment to Linear
    await addComment(issueId, { name, email, comment });

    // Invalidate cache for this issue's comments
    cache.invalidate(CacheKeys.issueComments(issueId));

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error adding comment:', error);

    return NextResponse.json(
      {
        error: 'Failed to add comment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
