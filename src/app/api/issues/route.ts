import { NextResponse } from 'next/server';
import { fetchIssues } from '@/lib/linear/client';
import cache, { CacheKeys } from '@/lib/cache/in-memory';

const CACHE_TTL = parseInt(process.env.CACHE_TTL_ISSUES || '300000', 10); // 5 minutes default

export async function GET() {
  try {
    // Try to get from cache first
    const cacheKey = CacheKeys.issues();
    const cachedIssues = cache.get(cacheKey);

    if (cachedIssues) {
      return NextResponse.json({
        data: cachedIssues,
        cached: true,
      });
    }

    // Fetch from Linear API
    const issues = await fetchIssues();

    // Cache the results
    cache.set(cacheKey, issues, CACHE_TTL);

    return NextResponse.json({
      data: issues,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch issues',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
