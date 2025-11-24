
import React, { useState, useEffect, useCallback } from 'react';
import TerminalWindow from './components/TerminalWindow';
import StatusFooter from './components/StatusFooter';
import InputModal from './components/InputModal';
import HomeView from './components/HomeView';
import TreeView from './components/TreeView';
import LogView from './components/LogView';
import StashView from './components/StashView';
import { ParentTask, SubStack, Task, LogEntry, ViewMode, StashItem, InputMode, TaskStatus, SubStackStatus } from './types';
import { generateId } from './utils';

// Initial State
const INITIAL_PARENT: ParentTask = {
  id: 'root',
  name: 'New Project',
  subStacks: []
};

const App: React.FC = () => {
  // --- STATE ---
  const [parentTask, setParentTask] = useState<ParentTask>(INITIAL_PARENT);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stash, setStash] = useState<StashItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('HOME');
  const [isCommandMode, setIsCommandMode] = useState(true);
  
  // Input Modal State
  const [inputMode, setInputMode] = useState<InputMode>('NONE');
  
  // Derived State: Active SubStack
  const getActiveSubStack = useCallback((): SubStack | undefined => {
    return parentTask.subStacks.find(s => s.status === 'active');
  }, [parentTask.subStacks]);

  const activeSubStack = getActiveSubStack();

  // --- ACTIONS ---

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: generateId(),
      timestamp: Date.now(),
      type,
      message
    }]);
  };

  const handleAddSubStack = (name: string) => {
    const newStack: SubStack = {
      id: generateId(),
      name,
      tasks: [],
      status: parentTask.subStacks.every(s => s.status === 'completed' || s.status === 'frozen') ? 'active' : 'pending',
      priority: parentTask.subStacks.length
    };
    
    setParentTask(prev => {
      const updated = { ...prev, subStacks: [...prev.subStacks, newStack] };
      // If we only have one incomplete stack, it should be active
      const incomplete = updated.subStacks.filter(s => s.status !== 'completed');
      if (incomplete.length === 1 && incomplete[0].id === newStack.id) {
         updated.subStacks = updated.subStacks.map(s => s.id === newStack.id ? {...s, status: 'active'} : s);
      }
      return updated;
    });
    addLog('add', `Added sub-stack: ${name}`);
  };

  const handlePushTask = (name: string) => {
    if (!activeSubStack) {
      if (parentTask.subStacks.length === 0) {
          alert("Please create a sub-stack first (press 'n')");
          return;
      }
      alert("No active stack to push to. Use '[' or ']' to select a stack.");
      return;
    }

    setParentTask(prev => {
      const newStacks = prev.subStacks.map(s => {
        if (s.id === activeSubStack.id) {
          return {
            ...s,
            tasks: [...s.tasks, { id: generateId(), name, status: 'pending' as TaskStatus, createdAt: Date.now() }]
          };
        }
        return s;
      });
      return { ...prev, subStacks: newStacks };
    });
    addLog('add', `Interrupted: Pushed "${name}" to top of "${activeSubStack.name}"`);
  };

  const handleQueueTask = (name: string) => {
    if (!activeSubStack) {
        if (parentTask.subStacks.length === 0) {
            alert("Please create a sub-stack first (press 'n')");
            return;
        }
        alert("No active stack to queue to. Use '[' or ']' to select a stack.");
        return;
    }

    setParentTask(prev => {
        const newStacks = prev.subStacks.map(s => {
            if (s.id === activeSubStack.id) {
                const newTask: Task = { id: generateId(), name, status: 'pending' as TaskStatus, createdAt: Date.now() };
                
                // If stack is empty, it behaves like push (becomes the first task)
                if (s.tasks.length === 0) {
                    return { ...s, tasks: [newTask] };
                }

                // Insert before the last element (which is current/top)
                // [Bottom, ..., New, Top]
                const lastTask = s.tasks[s.tasks.length - 1];
                const otherTasks = s.tasks.slice(0, s.tasks.length - 1);
                
                return {
                    ...s,
                    tasks: [...otherTasks, newTask, lastTask]
                };
            }
            return s;
        });
        return { ...prev, subStacks: newStacks };
    });
    addLog('add', `Queued "${name}" after current task in "${activeSubStack.name}"`);
  };

  const handleCompleteTask = () => {
    if (!activeSubStack) return;
    
    const currentTask = activeSubStack.tasks[activeSubStack.tasks.length - 1];
    if (!currentTask) return;

    setParentTask(prev => {
      const newStacks = prev.subStacks.map(s => {
        if (s.id === activeSubStack.id) {
          const remainingTasks = s.tasks.slice(0, -1);
          let newStatus: SubStack['status'] = s.status;
          
          if (remainingTasks.length === 0) {
            newStatus = 'completed';
            addLog('status_change', `Stack completed: ${s.name}`);
          }

          return {
            ...s,
            tasks: remainingTasks,
            status: newStatus
          };
        }
        return s;
      });
      
      const updatedStack = newStacks.find(s => s.id === activeSubStack.id);
      if (updatedStack?.status === 'completed') {
          const nextIdx = newStacks.findIndex(s => s.status === 'pending');
          if (nextIdx !== -1) {
              newStacks[nextIdx].status = 'active';
              addLog('status_change', `Activated next stack: ${newStacks[nextIdx].name}`);
          }
      }
      
      return { ...prev, subStacks: newStacks };
    });
    addLog('status_change', `Completed task: ${currentTask.name}`);
  };

  const handleStashTask = (name: string) => {
    const newItem: StashItem = {
        id: generateId(),
        name,
        timestamp: Date.now(),
        targetSubStackId: activeSubStack?.id
    };
    setStash(prev => [...prev, newItem]);
    addLog('stash', `Stashed task: ${name}`);
  };

  const handleRestoreStash = (id: string) => {
    const item = stash.find(i => i.id === id);
    if (!item) return;
    
    const targetStackId = item.targetSubStackId || activeSubStack?.id;
    if (!targetStackId && parentTask.subStacks.length === 0) return;

    setParentTask(prev => {
        // 1. Identify which stack will receive the task
        // 2. Identify which stack SHOULD be active (prefer target stack)
        
        // Find ID to activate
        let idToActivate = activeSubStack?.id;
        if (item.targetSubStackId) {
            const targetExists = prev.subStacks.some(s => s.id === item.targetSubStackId && s.status !== 'completed');
            if (targetExists) idToActivate = item.targetSubStackId;
        }

        const newStacks = prev.subStacks.map(s => {
            const isTargetForTask = s.id === targetStackId || (!item.targetSubStackId && s.id === idToActivate);
            const shouldBeActive = s.id === idToActivate;
            
            let updatedStack = { ...s };

            if (shouldBeActive) {
                updatedStack.status = 'active';
            } else if (s.status === 'active') {
                updatedStack.status = 'pending';
            }

            if (isTargetForTask) {
                updatedStack.tasks = [...updatedStack.tasks, { id: generateId(), name: item.name, status: 'pending' as TaskStatus, createdAt: Date.now() }];
            }

            return updatedStack;
        });

        return { ...prev, subStacks: newStacks };
    });

    setStash(prev => prev.filter(i => i.id !== id));
    addLog('add', `Restored stash "${item.name}"`);
    if (viewMode === 'STASH') setViewMode('HOME');
  };

  const handleToggleFreeze = (stackId: string) => {
      setParentTask(prev => {
          const newStacks = prev.subStacks.map(s => {
              if (s.id === stackId) {
                  const isFrozen = s.status === 'frozen';
                  const newStatus: SubStackStatus = isFrozen ? 'pending' : 'frozen';
                  addLog('freeze', `${isFrozen ? 'Unfroze' : 'Froze'} stack: ${s.name}`);
                  return { ...s, status: newStatus };
              }
              return s;
          });
          
          const currentActive = newStacks.find(s => s.status === 'active');
          if (!currentActive) {
              const next = newStacks.find(s => s.status === 'pending');
              if (next) next.status = 'active';
          }

          return { ...prev, subStacks: newStacks };
      });
  };

  const handleCycleStack = (direction: 1 | -1) => {
      const incomplete = parentTask.subStacks.filter(s => s.status !== 'completed');
      if (incomplete.length <= 1) return;

      const currentIdx = incomplete.findIndex(s => s.status === 'active');
      if (currentIdx === -1 && incomplete.length > 0) {
          // If none active, activate first
          handleActivateStack(incomplete[0].id);
          return;
      }

      let nextIdx = currentIdx + direction;
      if (nextIdx >= incomplete.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = incomplete.length - 1;

      handleActivateStack(incomplete[nextIdx].id);
  };

  const handleActivateStack = (stackId: string) => {
      setParentTask(prev => ({
          ...prev,
          subStacks: prev.subStacks.map(s => {
              if (s.id === stackId) return { ...s, status: 'active' };
              if (s.status === 'active') return { ...s, status: 'pending' };
              return s;
          })
      }));
  };

  // --- INPUT HANDLER ---

  const handleInputSubmit = (val: string) => {
    if (inputMode === 'ADD_SUBSTACK') handleAddSubStack(val);
    if (inputMode === 'PUSH_TASK') handlePushTask(val);
    if (inputMode === 'QUEUE_TASK') handleQueueTask(val);
    if (inputMode === 'STASH_TASK') handleStashTask(val);
    
    setInputMode('NONE');
  };

  // --- KEYBOARD SHORTCUTS ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If an Input Modal is open, ignore global shortcuts (let modal handle it)
      if (inputMode !== 'NONE') return;

      // 2. If Command Mode is disabled (User clicked "OFF"), ignore keys
      if (!isCommandMode) return;

      // 3. Ignore typing in inputs (though currently we only have the modal which is handled by #1)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // View Switching
      if (e.key === '1') setViewMode('HOME');
      if (e.key === '2') setViewMode('TREE');
      if (e.key === '3') setViewMode('STASH');
      if (e.key === '4') setViewMode('LOGS');

      // Vim-like Command Mode Shortcuts (No modifiers required)
      switch (e.key.toLowerCase()) {
        case 'n': // New Stack
          e.preventDefault();
          setInputMode('ADD_SUBSTACK');
          break;
        case 'i': // Insert/Push Task (Interrupt)
          e.preventDefault();
          setInputMode('PUSH_TASK');
          break;
        case 'a': // Append/Queue Task (After current)
          e.preventDefault();
          setInputMode('QUEUE_TASK');
          break;
        case 's': // Stash
          e.preventDefault();
          setInputMode('STASH_TASK');
          break;
        case 'f': // Freeze Active
          e.preventDefault();
          if (activeSubStack) handleToggleFreeze(activeSubStack.id);
          break;
        case 'enter': // Complete
          e.preventDefault();
          handleCompleteTask();
          break;
        case '[': // Prev Stack
          handleCycleStack(-1);
          break;
        case ']': // Next Stack
          handleCycleStack(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, activeSubStack, isCommandMode, parentTask.subStacks]); // Added dependencies

  // --- RENDER HELPERS ---

  const getPrompt = () => {
    switch (inputMode) {
      case 'ADD_SUBSTACK': return "NEW STACK >";
      case 'PUSH_TASK': return `INTERRUPT [${activeSubStack?.name || 'ROOT'}] >`;
      case 'QUEUE_TASK': return `QUEUE NEXT [${activeSubStack?.name || 'ROOT'}] >`;
      case 'STASH_TASK': return "STASH TASK >";
      default: return ">";
    }
  };

  return (
    <TerminalWindow title={parentTask.name}>
      <div className="flex flex-col h-full">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
           {viewMode === 'HOME' && <HomeView parentTask={parentTask} activeSubStack={activeSubStack} />}
           {viewMode === 'TREE' && (
                <TreeView 
                    parentTask={parentTask} 
                    onFreezeToggle={handleToggleFreeze} 
                    onActivateStack={handleActivateStack}
                />
            )}
           {viewMode === 'LOGS' && <LogView logs={logs} />}
           {viewMode === 'STASH' && (
             <StashView 
                items={stash} 
                onRestore={handleRestoreStash} 
                onDiscard={(id) => setStash(prev => prev.filter(i => i.id !== id))} 
             />
           )}
        </div>

        {/* Footer */}
        <StatusFooter 
          mode={viewMode} 
          isCommandMode={isCommandMode}
          onToggleCommandMode={() => setIsCommandMode(!isCommandMode)}
          inputMode={inputMode}
        />

        {/* Modal Overlay */}
        <InputModal 
          isOpen={inputMode !== 'NONE'}
          prompt={getPrompt()}
          onSubmit={handleInputSubmit}
          onCancel={() => setInputMode('NONE')}
        />
      </div>
    </TerminalWindow>
  );
};

export default App;
