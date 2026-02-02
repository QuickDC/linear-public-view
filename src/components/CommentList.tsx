'use client';

import type { NormalizedComment } from '@/lib/linear/types';
import { formatDate } from '@/lib/utils';

interface CommentListProps {
  comments: NormalizedComment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet. Be the first to share feedback!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{comment.author}</span>
              {comment.email && (
                <span className="text-xs text-gray-500">({comment.email})</span>
              )}
            </div>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
    </div>
  );
}
