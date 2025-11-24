import React, { useMemo } from 'react';
import { ParentTask, SubStack, Task } from '../types';
import { CornerDownRight, Layers } from 'lucide-react';

interface HomeViewProps {
  parentTask: ParentTask;
  activeSubStack?: SubStack;
  focusedTaskId: string | null;
  onTaskClick: (taskId: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ parentTask, activeSubStack, focusedTaskId, onTaskClick }) => {
  const tasks = activeSubStack ? activeSubStack.tasks : [];
  const currentTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  // Calculate Global Progress
  const totalStacks = parentTask.subStacks.length;
  const completedStacks = parentTask.subStacks.filter(s => s.status === 'completed').length;

  // --- DEPTH CALCULATION ---
  const taskDepths = useMemo(() => {
    const depthMap = new Map<string, number>();
    const taskMap = new Map<string, Task>();
    
    tasks.forEach(t => taskMap.set(t.id, t));

    const getDepth = (taskId: string | undefined): number => {
        if (!taskId) return 0;
        if (depthMap.has(taskId)) return depthMap.get(taskId)!;
        
        const task = taskMap.get(taskId);
        if (!task || !task.parentId) {
            depthMap.set(taskId, 0);
            return 0;
        }

        const parentDepth = getDepth(task.parentId);
        const myDepth = parentDepth + 1;
        depthMap.set(taskId, myDepth);
        return myDepth;
    };

    tasks.forEach(t => getDepth(t.id));
    return depthMap;
  }, [tasks]);

  // Reverse tasks for display: Top of Stack (Current) -> Bottom of Stack (Root)
  const displayTasks = [...tasks].reverse();

  return (
    <div className="flex flex-col h-full justify-between items-center py-8 animate-in fade-in duration-300 overflow-hidden">
      
      {/* 1. Header Area */}
      <div className="w-full max-w-3xl flex justify-between items-end border-b border-gray-800 pb-2 mb-4 px-4 shrink-0">
        <div className="text-term-gray uppercase tracking-widest text-xs flex items-center gap-2">
           <Layers size={14} className="text-term-blue"/>
           <span>Current Stack: <span className="text-term-blue font-bold">{activeSubStack ? activeSubStack.name : "IDLE"}</span></span>
        </div>
        <div className="text-xs text-gray-500 font-mono">
           {completedStacks}/{totalStacks} Stacks Done
        </div>
      </div>

      {/* 2. Unified Stack List */}
      <div className="flex-1 w-full max-w-4xl px-4 overflow-y-auto custom-scrollbar relative">
        
        {!currentTask && (
             <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-lg opacity-50">
                <h1 className="text-2xl font-bold text-gray-700 mb-2">STACK EMPTY</h1>
                <p className="text-gray-500 text-sm">Use <span className="text-term-green font-bold">'N'</span> to create stack<br/>Use <span className="text-term-green font-bold">'I'</span> to insert task</p>
             </div>
        )}

        <div className="flex flex-col items-start w-full space-y-1 pb-10">
            {displayTasks.map((t, idx) => {
                const isCurrent = idx === 0; // The actual running task
                const isFocused = t.id === focusedTaskId; // The user's cursor
                const depth = taskDepths.get(t.id) || 0;
                
                // Indentation: 2rem per depth level
                const indentStyle = { marginLeft: `${depth * 2.5}rem` };
                
                return (
                    <div 
                        key={t.id} 
                        style={indentStyle} 
                        onClick={() => onTaskClick(t.id)}
                        className="relative group w-full max-w-2xl transition-all duration-300 cursor-pointer"
                    >
                        
                        {/* Visual Branch Line for indented items */}
                        {depth > 0 && (
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-gray-800">
                                <CornerDownRight size={20} strokeWidth={1.5} />
                            </div>
                        )}

                        <div className={`
                            relative flex items-center p-3 rounded border transition-all duration-200
                            ${isCurrent 
                                ? 'bg-gray-900 py-5 my-2 scale-[1.02] origin-left' 
                                : 'bg-transparent hover:bg-gray-900/50'}
                            ${isFocused 
                                ? 'border-term-blue shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                : isCurrent 
                                    ? 'border-term-green shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                                    : 'border-transparent hover:border-gray-800 text-gray-500'}
                        `}>
                            {/* Status Indicator */}
                            <div className={`
                                w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-colors
                                ${isCurrent ? 'bg-term-green animate-pulse' : isFocused ? 'bg-term-blue' : 'bg-gray-700'}
                            `}></div>

                            <div className="flex-1">
                                {isCurrent ? (
                                    <h1 className="text-2xl md:text-3xl font-bold text-term-fg leading-none tracking-tight break-words">
                                        {t.name}
                                        {/* Blinking cursor only if it's also focused */}
                                        {isFocused && <span className="inline-block w-2 h-6 ml-2 bg-term-blue animate-blink align-middle"></span>}
                                    </h1>
                                ) : (
                                    <div className={`text-base font-mono font-medium flex items-center ${isFocused ? 'text-term-fg' : ''}`}>
                                        {t.name}
                                        {currentTask?.parentId === t.id && (
                                            <span className="ml-3 text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                                                Parent
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default HomeView;