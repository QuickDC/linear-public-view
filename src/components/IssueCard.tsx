'use client';

import type { NormalizedIssue } from '@/lib/linear/types';
import { truncate } from '@/lib/utils';

interface IssueCardProps {
  issue: NormalizedIssue;
  onClick: () => void;
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{issue.identifier}</span>
      </div>

      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {issue.title}
      </h3>

      {issue.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncate(issue.description, 150)}
        </p>
      )}

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.map((label, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
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
    </div>
  );
}
