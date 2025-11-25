
import localforage from 'localforage';
import { ParentTask, LogEntry, StashItem } from './types';

// Configure localforage
localforage.config({
  name: 'stack-tree-cli',
  storeName: 'app_state'
});

const KEYS = {
  PARENT_TASK: 'parentTask',
  LOGS: 'logs',
  STASH: 'stash'
};

export interface AppData {
  parentTask: ParentTask;
  logs: LogEntry[];
  stash: StashItem[];
}

export const saveAppData = async (data: AppData) => {
  try {
    await Promise.all([
      localforage.setItem(KEYS.PARENT_TASK, data.parentTask),
      localforage.setItem(KEYS.LOGS, data.logs),
      localforage.setItem(KEYS.STASH, data.stash)
    ]);
    console.log('[Storage] Saved state to localforage');
  } catch (err) {
    console.error('[Storage] Failed to save:', err);
  }
};

export const loadAppData = async (): Promise<AppData | null> => {
  try {
    const parentTask = await localforage.getItem<ParentTask>(KEYS.PARENT_TASK);
    const logs = await localforage.getItem<LogEntry[]>(KEYS.LOGS);
    const stash = await localforage.getItem<StashItem[]>(KEYS.STASH);

    if (parentTask && logs && stash) {
      return { parentTask, logs, stash };
    }
    return null;
  } catch (err) {
    console.error('[Storage] Failed to load:', err);
    return null;
  }
};

export const clearAppData = async () => {
  await localforage.clear();
};

// --- EXPORT / IMPORT HELPERS ---

export const exportDataFromStorage = async (): Promise<string> => {
    // Read directly from storage source of truth
    const data = await loadAppData();
    if (!data) throw new Error("No data to export");
    return JSON.stringify(data, null, 2);
};

export const importDataToStorage = async (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString) as AppData;
        // Basic validation
        if (!data.parentTask || !Array.isArray(data.parentTask.subStacks)) {
            throw new Error("Invalid data format");
        }
        await saveAppData(data);
        return data;
    } catch (e) {
        throw e;
    }
};

export const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
