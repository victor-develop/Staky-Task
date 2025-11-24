
import React from 'react';
import { ViewMode, InputMode } from '../types';

interface StatusFooterProps {
  mode: ViewMode;
  isCommandMode: boolean;
  onToggleCommandMode: () => void;
  inputMode: InputMode;
}

const StatusFooter: React.FC<StatusFooterProps> = ({ mode, isCommandMode, onToggleCommandMode, inputMode }) => {
  return (
    <div className="mt-auto pt-2 border-t border-gray-800 text-xs flex justify-between items-center uppercase tracking-wider select-none">
      
      {/* Left: Views */}
      <div className="flex space-x-3 text-gray-500">
        <span className={mode === 'HOME' ? 'text-term-fg font-bold' : ''}>[1] Home</span>
        <span className={mode === 'TREE' ? 'text-term-fg font-bold' : ''}>[2] Tree</span>
        <span className={mode === 'STASH' ? 'text-term-fg font-bold' : ''}>[3] Stash</span>
        <span className={mode === 'LOGS' ? 'text-term-fg font-bold' : ''}>[4] Logs</span>
        <span className={mode === 'ARCHIVE' ? 'text-term-fg font-bold' : ''}>[5] Archive</span>
      </div>

      {/* Center: Mode Toggle */}
      <div>
        <button 
            onClick={onToggleCommandMode}
            disabled={inputMode !== 'NONE'}
            className={`
                px-3 py-0.5 font-bold transition-all outline-none rounded-sm border
                ${inputMode !== 'NONE' 
                  ? 'bg-term-yellow text-black border-term-yellow cursor-default' 
                  : isCommandMode 
                    ? 'bg-term-green text-black border-term-green hover:bg-green-400' 
                    : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'}
            `}
        >
            {inputMode !== 'NONE' ? '-- INSERT --' : isCommandMode ? 'NORMAL' : 'OFF'}
        </button>
      </div>

      {/* Right: Shortcuts */}
      <div className="flex space-x-4 text-gray-600">
        {inputMode !== 'NONE' ? (
             <>
                <span><span className="text-term-fg font-bold">ENTER</span> Submit</span>
                <span><span className="text-term-fg font-bold">ESC</span> Cancel</span>
             </>
        ) : isCommandMode ? (
            <>
                <span><span className="text-term-green font-bold">N</span>ew</span>
                <span><span className="text-term-green font-bold">I</span>nsert</span>
                <span><span className="text-term-green font-bold">O</span>pen</span>
                <span><span className="text-term-green font-bold">A</span>ppend</span>
                <span><span className="text-term-green font-bold">S</span>tash</span>
                <span><span className="text-term-green font-bold">F</span>reeze</span>
                <span><span className="text-term-green font-bold">[ ]</span> Cycle</span>
                <span><span className="text-term-green font-bold">↵</span> Done</span>
            </>
        ) : (
            <span className="text-gray-700">Keys Disabled</span>
        )}
      </div>
    </div>
  );
};

export default StatusFooter;
