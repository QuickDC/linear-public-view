'use client';

import { useEffect, useState } from 'react';
import type { NormalizedIssue } from '@/lib/linear/types';
import KanbanBoard from '@/components/KanbanBoard';

export default function RoadmapPage() {
  const [issues, setIssues] = useState<NormalizedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Roadmap</h1>
          <p className="mt-2 text-gray-600">
            View our current roadmap and share your feedback on upcoming features
          </p>
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

        {!loading && !error && <KanbanBoard issues={issues} />}
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
