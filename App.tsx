
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TerminalWindow from './components/TerminalWindow';
import StatusFooter from './components/StatusFooter';
import InputModal from './components/InputModal';
import HomeView from './components/HomeView';
import TreeView from './components/TreeView';
import LogView from './components/LogView';
import StashView from './components/StashView';
import ArchiveView from './components/ArchiveView';
import SystemView from './components/SystemView';
import { ParentTask, SubStack, Task, LogEntry, ViewMode, StashItem, InputMode, TaskStatus, SubStackStatus } from './types';
import { generateId } from './utils';
import { saveAppData, loadAppData, exportDataFromStorage, importDataToStorage, downloadFile, clearAppData } from './storage';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  
  // Navigation State
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  
  // Input Modal State
  const [inputMode, setInputMode] = useState<InputMode>('NONE');

  // --- PERSISTENCE ---

  // 1. Load on Mount
  useEffect(() => {
      const init = async () => {
          const data = await loadAppData();
          if (data) {
              setParentTask(data.parentTask);
              setLogs(data.logs);
              setStash(data.stash);
          }
          setIsLoaded(true);
      };
      init();
  }, []);

  // 2. Save on Change (Data Flow)
  useEffect(() => {
      if (!isLoaded) return;
      const save = async () => {
          await saveAppData({ parentTask, logs, stash });
          setLastSaveTime(Date.now());
      };
      // Debounce slightly to prevent thrashing
      const timer = setTimeout(save, 500);
      return () => clearTimeout(timer);
  }, [parentTask, logs, stash, isLoaded]);

  // --- EXPORT / IMPORT HANDLERS ---
  
  const handleSystemExport = async () => {
      const json = await exportDataFromStorage();
      const filename = `stacktree_backup_${new Date().toISOString().slice(0,10)}.json`;
      downloadFile(filename, json);
  };

  const handleSystemImport = async (file: File) => {
      return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const content = e.target?.result as string;
                  const data = await importDataToStorage(content);
                  
                  // Update State
                  setParentTask(data.parentTask);
                  setLogs(data.logs);
                  setStash(data.stash);
                  resolve();
              } catch (err) {
                  reject(err);
              }
          };
          reader.onerror = reject;
          reader.readAsText(file);
      });
  };

  const handleSystemReset = async () => {
      await clearAppData();
      setParentTask(INITIAL_PARENT);
      setLogs([]);
      setStash([]);
  };

  // --- LOGIC ---
  
  // Derived State: Active SubStack
  const getActiveSubStack = useCallback((): SubStack | undefined => {
    return parentTask.subStacks.find(s => s.status === 'active');
  }, [parentTask.subStacks]);

  const activeSubStack = getActiveSubStack();
  
  // Reset focus to top task when active stack changes
  useEffect(() => {
      if (activeSubStack && activeSubStack.tasks.length > 0) {
          // Only change focus if the currently focused task is not in this stack
          const taskExists = activeSubStack.tasks.some(t => t.id === focusedTaskId);
          if (!taskExists) {
             setFocusedTaskId(activeSubStack.tasks[activeSubStack.tasks.length - 1].id);
          }
      } else if (activeSubStack && activeSubStack.tasks.length === 0) {
          setFocusedTaskId(null);
      } else if (!activeSubStack) {
          setFocusedTaskId(null);
      }
  }, [activeSubStack?.id, activeSubStack?.tasks.length]);

  // --- HELPER: Find Insertion Index ---
  // Skips over descendants to ensure new task is placed ABOVE the entire subtree of the focused task.
  const findInsertionIndexForInterrupt = (tasks: Task[], focusIndex: number): number => {
      if (focusIndex === -1) return tasks.length;
      
      const focusTask = tasks[focusIndex];
      // We want to skip any task that is a descendant of the focused task
      // (Visual: They are "above" the focused task in the list, "after" in the array)
      
      // Build a quick map for parent lookup
      const taskMap = new Map<string, Task>();
      tasks.forEach(t => taskMap.set(t.id, t));

      const isDescendant = (childId: string, potentialAncestorId: string): boolean => {
          let curr = taskMap.get(childId);
          while (curr && curr.parentId) {
              if (curr.parentId === potentialAncestorId) return true;
              curr = taskMap.get(curr.parentId);
          }
          return false;
      };
      
      let i = focusIndex + 1;
      while (i < tasks.length) {
          const t = tasks[i];
          // If t is a child of focusTask (directly or indirectly), we skip it
          // so that we insert AFTER the whole family tree.
          // This makes the new task appear ABOVE the family tree in the LIFO visual list.
          if (t.parentId === focusTask.id || isDescendant(t.id, focusTask.id)) {
              i++;
          } else {
              // Found a task that is NOT a descendant (sibling or parent or unrelated)
              break;
          }
      }
      return i;
  };

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
    setParentTask(prev => {
      // If there is currently NO active stack, this new one becomes active immediately.
      const hasActive = prev.subStacks.some(s => s.status === 'active');
      const newStatus: SubStackStatus = hasActive ? 'pending' : 'active';

      const newStack: SubStack = {
        id: generateId(),
        name,
        tasks: [],
        status: newStatus,
        priority: prev.subStacks.length
      };

      return { ...prev, subStacks: [...prev.subStacks, newStack] };
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
          const tasks = s.tasks;
          const focusIndex = tasks.findIndex(t => t.id === focusedTaskId);
          
          // Insert Logic: "Interrupt" -> Insert ABOVE the focused task AND its visual children.
          // This prevents the new task from getting "stuck" under the subtasks visually.
          const insertIndex = findInsertionIndexForInterrupt(tasks, focusIndex);

          // Context Logic: Inherit parent from focused task (Sibling)
          const focusTask = focusIndex !== -1 ? tasks[focusIndex] : null;
          const topTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;
          
          // If we have focus, we inherit its parent (Sibling). If no focus, top task's parent.
          const inheritedParentId = focusTask ? focusTask.parentId : (topTask ? topTask.parentId : undefined);

          const newTask = { 
              id: generateId(), 
              name, 
              parentId: inheritedParentId,
              status: 'pending' as TaskStatus, 
              createdAt: Date.now() 
          };
          
          // Auto-focus the new task
          setTimeout(() => setFocusedTaskId(newTask.id), 0);

          const newTasks = [...tasks];
          newTasks.splice(insertIndex, 0, newTask);

          return { ...s, tasks: newTasks };
        }
        return s;
      });
      return { ...prev, subStacks: newStacks };
    });
    addLog('add', `Interrupted: Pushed "${name}"`);
  };

  const handleBreakdownTask = (name: string) => {
    if (!activeSubStack) return;
    
    setParentTask(prev => {
      const newStacks = prev.subStacks.map(s => {
        if (s.id === activeSubStack.id) {
          const tasks = s.tasks;
          const focusIndex = tasks.findIndex(t => t.id === focusedTaskId);
          
          // Breakdown Logic: Insert ABOVE focused task branch (it becomes a prerequisite/child)
          const insertIndex = findInsertionIndexForInterrupt(tasks, focusIndex);
          
          // Parent is the FOCUSED task (or top if none)
          const targetTask = focusIndex !== -1 ? tasks[focusIndex] : (tasks.length > 0 ? tasks[tasks.length - 1] : null);

          const newTask = { 
              id: generateId(), 
              name, 
              parentId: targetTask ? targetTask.id : undefined,
              status: 'pending' as TaskStatus, 
              createdAt: Date.now() 
          };
          
          setTimeout(() => setFocusedTaskId(newTask.id), 0);

          const newTasks = [...tasks];
          newTasks.splice(insertIndex, 0, newTask);

          return { ...s, tasks: newTasks };
        }
        return s;
      });
      return { ...prev, subStacks: newStacks };
    });
    addLog('add', `Breakdown: Opened "${name}"`);
  };

  const handleQueueTask = (name: string) => {
    if (!activeSubStack) return;

    setParentTask(prev => {
        const newStacks = prev.subStacks.map(s => {
            if (s.id === activeSubStack.id) {
                const tasks = s.tasks;
                const focusIndex = tasks.findIndex(t => t.id === focusedTaskId);
                
                // Queue Logic: Insert BELOW focused task (Before it in array index)
                const effectiveFocusIndex = focusIndex !== -1 ? focusIndex : Math.max(0, tasks.length - 1);
                
                // If array is empty, index 0.
                const insertIndex = tasks.length === 0 ? 0 : effectiveFocusIndex;

                // Inherit parent from focused task (Sibling)
                const focusTask = effectiveFocusIndex >= 0 ? tasks[effectiveFocusIndex] : null;
                const inheritedParentId = focusTask ? focusTask.parentId : undefined;

                const newTask: Task = { 
                    id: generateId(), 
                    name, 
                    parentId: inheritedParentId,
                    status: 'pending' as TaskStatus, 
                    createdAt: Date.now() 
                };
                
                setTimeout(() => setFocusedTaskId(newTask.id), 0);

                const newTasks = [...tasks];
                newTasks.splice(insertIndex, 0, newTask);

                return { ...s, tasks: newTasks };
            }
            return s;
        });
        return { ...prev, subStacks: newStacks };
    });
    addLog('add', `Queued "${name}"`);
  };

  const handleCompleteTask = () => {
    if (!activeSubStack) return;
    
    // Modification: If focused task is NOT the top task, user probably wants to complete THAT specific task.
    // Standard stack behavior is pop top. But UI allows selection. 
    // To respect "newly focused one should be the running one", we allow completing the focus.
    
    // Default to Top
    let taskToCompleteId = activeSubStack.tasks[activeSubStack.tasks.length - 1]?.id;

    // If focus is valid and in this stack, use focus
    if (focusedTaskId && activeSubStack.tasks.some(t => t.id === focusedTaskId)) {
        taskToCompleteId = focusedTaskId;
    }

    if (!taskToCompleteId) return;
    const taskName = activeSubStack.tasks.find(t => t.id === taskToCompleteId)?.name;

    setParentTask(prev => {
      const newStacks = prev.subStacks.map(s => {
        if (s.id === activeSubStack.id) {
          // Remove the task by ID
          const newTasks = s.tasks.filter(t => t.id !== taskToCompleteId);
          let newStatus: SubStackStatus = s.status;
          
          if (newTasks.length === 0) {
            newStatus = 'completed';
            addLog('status_change', `Stack completed: ${s.name}`);
          }

          return {
            ...s,
            tasks: newTasks,
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
    if (taskName) addLog('status_change', `Completed task: ${taskName}`);
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
    
    setParentTask(prev => {
        // Find best candidate for activation if strictly needed
        let idToActivate = activeSubStack?.id;
        
        // If we are currently idle/complete, or switching context
        if (!idToActivate || (targetStackId && targetStackId !== idToActivate)) {
             if (targetStackId && prev.subStacks.some(s => s.id === targetStackId)) {
                 idToActivate = targetStackId;
             } else {
                 const firstAvailable = prev.subStacks.find(s => s.status !== 'completed' && s.status !== 'archived');
                 if (firstAvailable) idToActivate = firstAvailable.id;
             }
        }

        const newStacks = prev.subStacks.map(s => {
            const isTargetStack = s.id === (targetStackId || idToActivate);
            const shouldBeActive = s.id === idToActivate;
            
            let updatedStack = { ...s };

            // Manage Activation
            if (shouldBeActive && s.status !== 'completed' && s.status !== 'active' && s.status !== 'archived') {
                updatedStack.status = 'active';
            } else if (s.status === 'active' && !shouldBeActive) {
                updatedStack.status = 'pending';
            }

            // Restore Task Logic
            if (isTargetStack) {
                updatedStack.tasks = [...updatedStack.tasks, { 
                    id: generateId(), 
                    name: item.name, 
                    status: 'pending' as TaskStatus, 
                    createdAt: Date.now() 
                }];
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
          const stackToToggle = prev.subStacks.find(s => s.id === stackId);
          if (!stackToToggle) return prev;
          
          const isFrozen = stackToToggle.status === 'frozen';
          
          if (isFrozen) {
              // UNFREEZE -> ACTIVATE
              const newStacks = prev.subStacks.map(s => {
                  if (s.id === stackId) return { ...s, status: 'active' as SubStackStatus };
                  if (s.status === 'active') return { ...s, status: 'pending' as SubStackStatus };
                  return s;
              });
              addLog('freeze', `Unfroze and activated stack: ${stackToToggle.name}`);
              return { ...prev, subStacks: newStacks };
          } else {
              // FREEZE
              const newStacks = prev.subStacks.map(s => {
                  if (s.id === stackId) return { ...s, status: 'frozen' as SubStackStatus };
                  return s;
              });

              // If we froze the active one, auto-activate next pending
              if (stackToToggle.status === 'active') {
                  const nextCandidate = newStacks.find(s => s.status === 'pending');
                  if (nextCandidate) {
                      nextCandidate.status = 'active';
                      addLog('status_change', `Auto-activated next stack: ${nextCandidate.name}`);
                  }
              }
              
              addLog('freeze', `Froze stack: ${stackToToggle.name}`);
              return { ...prev, subStacks: newStacks };
          }
      });
      if (viewMode === 'STASH') setViewMode('HOME');
  };

  const handleArchiveStack = (stackId: string) => {
      setParentTask(prev => ({
          ...prev,
          subStacks: prev.subStacks.map(s => 
              s.id === stackId ? { ...s, status: 'archived' as SubStackStatus } : s
          )
      }));
      addLog('archive', 'Archived stack');
  };

  const handleRestoreArchive = (stackId: string) => {
      setParentTask(prev => ({
          ...prev,
          subStacks: prev.subStacks.map(s => 
              s.id === stackId ? { ...s, status: 'completed' as SubStackStatus } : s
          )
      }));
      addLog('archive', 'Restored stack from archive');
  };

  const handleCycleStack = (direction: 1 | -1) => {
      const incomplete = parentTask.subStacks.filter(s => s.status !== 'completed' && s.status !== 'archived');
      if (incomplete.length === 0) return;

      const currentIdx = incomplete.findIndex(s => s.status === 'active');
      
      if (currentIdx === -1) {
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
      setViewMode('HOME');
  };

  const handleArrowNavigation = (key: string) => {
      if (!activeSubStack || viewMode !== 'HOME') return;
      
      const displayTasks = [...activeSubStack.tasks].reverse();
      const currentIndex = displayTasks.findIndex(t => t.id === focusedTaskId);
      
      if (key === 'ArrowDown') {
          if (currentIndex < displayTasks.length - 1) {
              setFocusedTaskId(displayTasks[currentIndex + 1].id);
          }
      } else if (key === 'ArrowUp') {
          if (currentIndex > 0) {
              setFocusedTaskId(displayTasks[currentIndex - 1].id);
          }
      } else if (key === 'ArrowLeft') {
          const currentTask = displayTasks[currentIndex];
          if (currentTask && currentTask.parentId) {
              setFocusedTaskId(currentTask.parentId);
          } else {
              setViewMode('TREE');
          }
      }
  };

  // --- INPUT HANDLER ---

  const handleInputSubmit = (val: string) => {
    if (inputMode === 'ADD_SUBSTACK') handleAddSubStack(val);
    if (inputMode === 'PUSH_TASK') handlePushTask(val);
    if (inputMode === 'BREAKDOWN_TASK') handleBreakdownTask(val);
    if (inputMode === 'QUEUE_TASK') handleQueueTask(val);
    if (inputMode === 'STASH_TASK') handleStashTask(val);
    
    setInputMode('NONE');
  };

  // --- KEYBOARD SHORTCUTS ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inputMode !== 'NONE') return;
      if (!isCommandMode) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          handleArrowNavigation(e.key);
          return;
      }

      if (e.key === '1') setViewMode('HOME');
      if (e.key === '2') setViewMode('TREE');
      if (e.key === '3') setViewMode('STASH');
      if (e.key === '4') setViewMode('LOGS');
      if (e.key === '5') setViewMode('ARCHIVE');
      if (e.key === '6') setViewMode('SYSTEM');

      switch (e.key.toLowerCase()) {
        case 'n': 
          e.preventDefault();
          setInputMode('ADD_SUBSTACK');
          break;
        case 'i': 
          e.preventDefault();
          setInputMode('PUSH_TASK');
          break;
        case 'o': 
          e.preventDefault();
          setInputMode('BREAKDOWN_TASK');
          break;
        case 'a': 
          e.preventDefault();
          setInputMode('QUEUE_TASK');
          break;
        case 's': 
          e.preventDefault();
          setInputMode('STASH_TASK');
          break;
        case 'f': 
          e.preventDefault();
          if (activeSubStack) handleToggleFreeze(activeSubStack.id);
          break;
        case 'enter': 
          e.preventDefault();
          handleCompleteTask();
          break;
        case '[': 
          handleCycleStack(-1);
          break;
        case ']': 
          handleCycleStack(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputMode, activeSubStack, isCommandMode, parentTask.subStacks, focusedTaskId, viewMode]);

  const getPrompt = () => {
    // Helper to get focus name
    const focusTask = activeSubStack?.tasks.find(t => t.id === focusedTaskId);
    const focusName = focusTask ? focusTask.name : 'TOP';

    switch (inputMode) {
      case 'ADD_SUBSTACK': return "NEW STACK >";
      case 'PUSH_TASK': return `INSERT (SIBLING OF ${focusName}) >`;
      case 'BREAKDOWN_TASK': return `BREAKDOWN (CHILD OF ${focusName}) >`;
      case 'QUEUE_TASK': return `QUEUE (AFTER ${focusName}) >`;
      case 'STASH_TASK': return "STASH TASK >";
      default: return ">";
    }
  };

  return (
    <TerminalWindow title={parentTask.name}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden relative">
           {viewMode === 'HOME' && (
             <HomeView 
                parentTask={parentTask} 
                activeSubStack={activeSubStack} 
                focusedTaskId={focusedTaskId}
                onTaskClick={setFocusedTaskId}
             />
           )}
           {viewMode === 'TREE' && (
                <TreeView 
                    parentTask={parentTask} 
                    onFreezeToggle={handleToggleFreeze} 
                    onActivateStack={handleActivateStack}
                    onArchiveStack={handleArchiveStack}
                />
            )}
           {viewMode === 'LOGS' && <LogView logs={logs} />}
           {viewMode === 'STASH' && (
             <StashView 
                items={stash} 
                frozenStacks={parentTask.subStacks.filter(s => s.status === 'frozen')}
                onRestore={handleRestoreStash} 
                onDiscard={(id) => setStash(prev => prev.filter(i => i.id !== id))} 
                onUnfreeze={handleToggleFreeze}
             />
           )}
           {viewMode === 'ARCHIVE' && (
             <ArchiveView 
                archivedStacks={parentTask.subStacks.filter(s => s.status === 'archived')}
                onRestore={handleRestoreArchive}
             />
           )}
           {viewMode === 'SYSTEM' && (
              <SystemView 
                 onExport={handleSystemExport}
                 onImport={handleSystemImport}
                 onReset={handleSystemReset}
                 lastSaveTime={lastSaveTime}
              />
           )}
        </div>

        <StatusFooter 
          mode={viewMode} 
          isCommandMode={isCommandMode}
          onToggleCommandMode={() => setIsCommandMode(!isCommandMode)}
          inputMode={inputMode}
        />

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
