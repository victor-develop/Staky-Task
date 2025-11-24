
export type TaskStatus = 'pending' | 'completed';
export type SubStackStatus = 'active' | 'frozen' | 'completed' | 'pending';
export type ViewMode = 'HOME' | 'TREE' | 'STASH' | 'LOGS';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
}

export interface SubStack {
  id: string;
  name: string;
  tasks: Task[]; // Stack: LIFO (visualized top to bottom, index 0 is bottom)
  status: SubStackStatus;
  priority: number; // 0 is highest priority
}

export interface ParentTask {
  id: string;
  name: string;
  subStacks: SubStack[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'add' | 'modify' | 'status_change' | 'stash' | 'freeze';
  message: string;
}

export interface StashItem {
  id: string;
  name: string;
  targetSubStackId?: string; // Optional preferred stack
  timestamp: number;
}

// Helper type for our Input Modal
export type InputMode = 'NONE' | 'ADD_SUBSTACK' | 'PUSH_TASK' | 'QUEUE_TASK' | 'STASH_TASK' | 'RENAME_PARENT';
