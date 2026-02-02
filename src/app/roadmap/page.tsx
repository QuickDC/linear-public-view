'use client';

import { useEffect, useState, useMemo } from 'react';
import type { NormalizedIssue } from '@/lib/linear/types';
import KanbanBoard from '@/components/KanbanBoard';

export default function RoadmapPage() {
  const [issues, setIssues] = useState<NormalizedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/issues');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load roadmap');
      }

      setIssues(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) {
      return issues;
    }

    const query = searchQuery.toLowerCase();
    return issues.filter(issue => {
      const titleMatch = issue.title.toLowerCase().includes(query);
      const identifierMatch = issue.identifier.toLowerCase().includes(query);
      const descriptionMatch = issue.description?.toLowerCase().includes(query) || false;
      const labelMatch = issue.labels.some(label => label.name.toLowerCase().includes(query));

      return titleMatch || identifierMatch || descriptionMatch || labelMatch;
    });
  }, [issues, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Roadmap</h1>
          <p className="mt-2 text-gray-600">
            View our current roadmap and share your feedback on upcoming features
          </p>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title, identifier, description, or labels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Found {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading roadmap...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <h3 className="font-semibold mb-2">Error loading roadmap</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && <KanbanBoard issues={filteredIssues} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          Have questions? Feel free to leave a comment on any issue.
        </div>
      </footer>
    </div>
  );
}
