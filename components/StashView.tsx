import React from 'react';
import { StashItem } from '../types';
import { formatTime } from '../utils';
import { ArrowUpRight, Trash2 } from 'lucide-react';

interface StashViewProps {
  items: StashItem[];
  onRestore: (id: string) => void;
  onDiscard: (id: string) => void;
}

const StashView: React.FC<StashViewProps> = ({ items, onRestore, onDiscard }) => {
  return (
    <div className="h-full font-mono">
      <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-2">
         <h2 className="text-lg font-bold text-gray-400">Stash Pool</h2>
         <span className="text-xs text-gray-600">{items.length} items buffered</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && (
            <div className="col-span-full text-center text-gray-700 py-10 border border-gray-800 border-dashed rounded">
                Stash is empty. Use CMD+S to stash tasks for later.
            </div>
        )}
        {items.map(item => (
          <div key={item.id} className="bg-gray-900 border border-gray-700 p-3 rounded hover:border-term-blue transition-colors group relative">
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-xs">Buffered at {formatTime(item.timestamp)}</span>
                <span className="text-xs bg-gray-800 px-1 text-gray-400 rounded">
                    Target: {item.targetSubStackId ? 'Specific Stack' : 'General'}
                </span>
            </div>
            <h3 className="text-term-fg font-bold text-lg mb-4">{item.name}</h3>
            
            <div className="flex space-x-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onRestore(item.id)}
                    className="flex-1 flex items-center justify-center bg-term-green/10 text-term-green py-1 text-xs hover:bg-term-green/20 border border-transparent hover:border-term-green rounded"
                >
                    <ArrowUpRight size={12} className="mr-1" /> Activate
                </button>
                <button 
                    onClick={() => onDiscard(item.id)}
                    className="px-3 bg-red-900/10 text-red-500 hover:bg-red-900/20 rounded flex items-center justify-center"
                >
                    <Trash2 size={12} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StashView;