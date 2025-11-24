import React from 'react';
import { ParentTask, SubStack } from '../types';
import { renderProgressBar } from '../utils';
import { ArrowRight, Layers } from 'lucide-react';

interface HomeViewProps {
  parentTask: ParentTask;
  activeSubStack?: SubStack;
}

const HomeView: React.FC<HomeViewProps> = ({ parentTask, activeSubStack }) => {
  // Get current top task (last in array is top of stack)
  const tasks = activeSubStack ? activeSubStack.tasks : [];
  const currentTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  // Get next few tasks in the stack (LIFO: tasks[length-2], tasks[length-3]...)
  const upcomingTasks = tasks.length > 1 
    ? [...tasks].slice(0, tasks.length - 1).reverse().slice(0, 3) 
    : [];

  // Calculate global progress
  const totalStacks = parentTask.subStacks.length;
  const completedStacks = parentTask.subStacks.filter(s => s.status === 'completed').length;
  
  return (
    <div className="flex flex-col h-full justify-center items-center space-y-10 animate-in fade-in duration-300">
      
      {/* Main Task Display */}
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="text-term-gray uppercase tracking-widest text-sm mb-2 flex items-center justify-center space-x-2">
          <span>Current Focus</span>
          <span className="text-gray-600">//</span>
          <span className="text-term-blue font-bold">{activeSubStack ? activeSubStack.name : "IDLE"}</span>
        </div>
        
        {currentTask ? (
          <div className="relative group">
             <h1 className="text-4xl md:text-6xl font-bold text-term-fg border-l-4 border-term-green pl-6 py-2 text-left">
              {currentTask.name}
              <span className="inline-block w-3 h-10 ml-2 bg-term-green animate-blink align-middle"></span>
            </h1>
          </div>
        ) : (
          <div className="text-4xl font-bold text-gray-600 py-10 border-2 border-dashed border-gray-800 rounded-lg">
            NO ACTIVE TASKS
            <div className="text-sm font-normal mt-2 text-gray-500">Press 'n' to create a stack or 'i' to push a task</div>
          </div>
        )}

        {/* Stack Peek / "Next Up" */}
        {upcomingTasks.length > 0 && (
          <div className="w-full text-left pl-7 pt-4">
             <div className="text-xs text-gray-600 uppercase mb-2 flex items-center">
                <Layers size={12} className="mr-1" /> In Stack
             </div>
             <div className="space-y-1">
                {upcomingTasks.map((t, idx) => (
                    <div key={t.id} className="text-gray-500 text-sm flex items-center">
                        <ArrowRight size={12} className="mr-2 opacity-50" />
                        <span className={idx === 0 ? "text-gray-400" : ""}>{t.name}</span>
                    </div>
                ))}
                {tasks.length > 4 && (
                    <div className="text-gray-700 text-xs pl-5">... {tasks.length - 4} more</div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Progress Dashboard */}
      <div className="w-full max-w-2xl bg-gray-900/50 border border-gray-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs text-term-gray uppercase mb-1">Active Sub-Stack Load</div>
          <div className="text-xl font-mono text-term-blue">
             {activeSubStack ? `${tasks.length} tasks pending` : 'N/A'}
          </div>
          {activeSubStack && (
             <div className="text-xs text-gray-600 mt-2 font-mono">
                Stack ID: {activeSubStack.id.substring(0, 6)}
             </div>
          )}
        </div>
        
        <div>
           <div className="text-xs text-term-gray uppercase mb-1">Parent Progress</div>
           <div className="font-mono text-term-green mb-1">
              {renderProgressBar(completedStacks, totalStacks, 15)}
           </div>
           <div className="text-xs text-gray-500">
              {completedStacks}/{totalStacks} Parallel Stacks Completed
           </div>
        </div>
      </div>

      {/* Context Info */}
      <div className="text-center text-gray-600 text-sm font-mono">
        Parent Goal: <span className="text-gray-400">{parentTask.name}</span>
      </div>

    </div>
  );
};

export default HomeView;