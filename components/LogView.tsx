import React from 'react';
import { LogEntry } from '../types';
import { formatTime, formatDate } from '../utils';

interface LogViewProps {
  logs: LogEntry[];
}

const LogView: React.FC<LogViewProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'add': return 'text-term-green';
      case 'modify': return 'text-term-blue';
      case 'status_change': return 'text-term-yellow';
      case 'stash': return 'text-purple-400';
      case 'freeze': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto font-mono">
      <h2 className="text-lg font-bold text-gray-400 mb-4 border-b border-gray-800 pb-2">System Logs</h2>
      <div className="space-y-1">
        {sortedLogs.length === 0 ? (
            <div className="text-gray-700 italic">No logs recorded yet.</div>
        ) : (
            sortedLogs.map(log => (
            <div key={log.id} className="flex text-sm hover:bg-gray-900 p-1 rounded">
                <div className="text-gray-600 w-32 shrink-0 select-none">
                {formatDate(log.timestamp)} <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                </div>
                <div className={`w-24 shrink-0 font-bold uppercase text-xs pt-0.5 ${getTypeColor(log.type)}`}>
                [{log.type}]
                </div>
                <div className="text-gray-300">
                {log.message}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LogView;