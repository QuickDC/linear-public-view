'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { NormalizedIssue, NormalizedComment } from '@/lib/linear/types';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface IssueModalProps {
  issue: NormalizedIssue;
  onClose: () => void;
}

export default function IssueModal({ issue, onClose }: IssueModalProps) {
  const [comments, setComments] = useState<NormalizedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [issue.id]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/issues/${issue.id}/comments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load comments');
      }

      setComments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSuccess = () => {
    // Refresh comments after successful post
    fetchComments();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-mono text-gray-500">{issue.identifier}</span>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{issue.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="px-6 py-4">
                {/* Labels */}
                {issue.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {issue.labels.map((label, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {issue.description && (
                  <div className="prose prose-sm max-w-none mb-8">
                    <ReactMarkdown>{issue.description}</ReactMarkdown>
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>

                  {loading && (
                    <div className="text-center py-8 text-gray-500">Loading comments...</div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {!loading && !error && (
                    <>
                      <CommentList comments={comments} />

                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                          Add Your Feedback
                        </h4>
                        <CommentForm issueId={issue.id} onSuccess={handleCommentSuccess} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
