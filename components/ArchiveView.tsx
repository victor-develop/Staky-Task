import React from 'react';
import { SubStack } from '../types';
import { ArchiveRestore, Layers, CheckCircle } from 'lucide-react';

interface ArchiveViewProps {
  archivedStacks: SubStack[];
  onRestore: (stackId: string) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ archivedStacks, onRestore }) => {
  return (
    <div className="h-full overflow-y-auto font-mono p-2">
      <div className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-500 mb-1 flex items-center">
           <span className="mr-2 text-gray-600">ARCHIVE</span>
        </h2>
        <span className="text-gray-600 text-sm">{archivedStacks.length} stacks archived</span>
      </div>

      {archivedStacks.length === 0 ? (
          <div className="text-center text-gray-700 mt-20 border-2 border-dashed border-gray-800 py-10 rounded">
              <Layers className="mx-auto mb-4 text-gray-800" size={48} />
              No archived stacks found.
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedStacks.map(stack => (
                  <div key={stack.id} className="bg-gray-900 border border-gray-800 p-4 rounded hover:border-gray-600 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-gray-500 text-xs font-bold uppercase flex items-center">
                              <CheckCircle size={10} className="mr-1" /> Completed
                          </span>
                          <span className="text-xs text-gray-600">{stack.tasks.length} tasks</span>
                      </div>
                      
                      <h3 className="text-gray-400 font-bold text-lg mb-6 truncate" title={stack.name}>
                          {stack.name}
                      </h3>

                      <button 
                        onClick={() => onRestore(stack.id)}
                        className="w-full flex items-center justify-center bg-gray-800 text-gray-400 py-2 text-xs hover:bg-gray-700 hover:text-white rounded transition-colors"
                      >
                        <ArchiveRestore size={14} className="mr-2" /> Restore to Tree
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default ArchiveView;
