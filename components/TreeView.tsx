import React from 'react';
import { ParentTask, SubStack, Task } from '../types';
import { Lock, Circle, Archive, Play, Check } from 'lucide-react';

interface TreeViewProps {
  parentTask: ParentTask;
  onFreezeToggle: (stackId: string) => void;
  onActivateStack: (stackId: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ parentTask, onFreezeToggle, onActivateStack }) => {
  
  const renderTaskNode = (task: Task, isTop: boolean, isLast: boolean) => {
    return (
      <div key={task.id} className="flex items-center group">
        <span className="text-gray-600 mr-2 font-mono">
          {isLast ? '└──' : '├──'}
        </span>
        <span className={`
          px-2 py-0.5 rounded text-sm font-mono flex items-center space-x-2
          ${isTop ? 'bg-term-green/10 text-term-green border border-term-green/30' : 'text-gray-500'}
        `}>
          <span>{task.name}</span>
          {isTop && <span className="text-[10px] uppercase border border-term-green px-1 rounded-sm">Active</span>}
        </span>
      </div>
    );
  };

  const renderSubStack = (stack: SubStack, index: number) => {
    const isActive = stack.status === 'active';
    const isFrozen = stack.status === 'frozen';
    const isCompleted = stack.status === 'completed';

    let statusColor = 'text-gray-500';
    if (isActive) statusColor = 'text-term-blue';
    if (isFrozen) statusColor = 'text-term-yellow';
    if (isCompleted) statusColor = 'text-term-green';

    // Stack tasks are reversed for display (Top of stack = first visual child)
    const displayTasks = [...stack.tasks].reverse();

    return (
      <div key={stack.id} className={`ml-4 mb-6 relative pl-4 border-l ${isActive ? 'border-term-blue' : 'border-gray-800'}`}>
        {/* Substack Header */}
        <div className="flex items-center mb-2 -ml-6 group">
          <button 
             onClick={() => !isCompleted && onActivateStack(stack.id)}
             disabled={isCompleted}
             className={`
                w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold mr-2 border bg-gray-900 transition-colors
                ${isActive ? 'border-term-blue text-term-blue' : 'border-gray-700 text-gray-600 hover:border-gray-500'}
                ${isCompleted ? 'border-term-green text-term-green cursor-default' : 'cursor-pointer'}
             `}
          >
             {isActive ? <Play size={10} fill="currentColor" /> : isCompleted ? <Check size={12} /> : index + 1}
          </button>
          
          <div className="flex-1 flex items-center justify-between pr-4">
            <span 
                onClick={() => !isCompleted && onActivateStack(stack.id)}
                className={`font-bold ${statusColor} text-lg ${!isCompleted ? 'cursor-pointer hover:underline' : ''}`}
            >
                {stack.name} {isActive && <span className="text-xs ml-2 bg-term-blue text-black px-1 rounded">CURRENT</span>}
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-600 font-mono">
                 {isCompleted ? 'DONE' : `${stack.tasks.length} tasks`}
              </span>
              {/* Controls */}
              {!isCompleted && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onFreezeToggle(stack.id); }}
                    className="hover:text-white text-gray-600"
                    title={isFrozen ? "Unfreeze" : "Freeze"}
                  >
                    {isFrozen ? <Archive size={14} /> : <Lock size={14} />}
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="pl-2">
          {displayTasks.length === 0 && !isCompleted && (
             <div className="text-gray-700 text-sm italic ml-6">Empty stack</div>
          )}
          {displayTasks.map((task, i) => 
             renderTaskNode(task, i === 0 && !isFrozen && !isCompleted, i === displayTasks.length - 1)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-2 font-mono select-none">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center">
           <span className="mr-2 text-term-green">ROOT:</span> {parentTask.name}
        </h2>
        <div className="text-gray-500 text-sm">Project Structure Mapping</div>
      </div>

      <div className="pb-20">
        {parentTask.subStacks.length === 0 ? (
            <div className="text-center text-gray-600 mt-20">
                No sub-stacks defined. Press 'n' to start planning.
            </div>
        ) : (
            parentTask.subStacks.map((stack, idx) => renderSubStack(stack, idx))
        )}
      </div>
    </div>
  );
};

export default TreeView;