'use client';

import { useState } from 'react';
import type { NormalizedIssue, PublicStatus } from '@/lib/linear/types';
import { getStatusLabel, getAllStatuses } from '@/lib/linear/status-mapper';
import IssueCard from './IssueCard';
import IssueModal from './IssueModal';

interface KanbanBoardProps {
  issues: NormalizedIssue[];
}

export default function KanbanBoard({ issues }: KanbanBoardProps) {
  const [selectedIssue, setSelectedIssue] = useState<NormalizedIssue | null>(null);

  const statuses = getAllStatuses();

  // Group issues by status
  const issuesByStatus = statuses.reduce((acc, status) => {
    acc[status] = issues.filter(issue => issue.status === status);
    return acc;
  }, {} as Record<PublicStatus, NormalizedIssue[]>);

  // Column colors
  const columnColors: Record<PublicStatus, string> = {
    'todo': 'bg-gray-100',
    'in-progress': 'bg-blue-50',
    'done': 'bg-green-50',
    'cancelled': 'bg-red-50',
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map(status => (
          <div key={status} className="flex flex-col">
            {/* Column Header */}
            <div className={`${columnColors[status]} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
              <h2 className="font-semibold text-gray-900">
                {getStatusLabel(status)}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {issuesByStatus[status].length} {issuesByStatus[status].length === 1 ? 'issue' : 'issues'}
              </p>
            </div>

            {/* Column Content */}
            <div className="bg-gray-50 rounded-b-lg p-4 space-y-3 min-h-[200px] flex-1">
              {issuesByStatus[status].length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-8">No issues</p>
              ) : (
                issuesByStatus[status].map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => setSelectedIssue(issue)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Issue Modal */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </>
  );
}
