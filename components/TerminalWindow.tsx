import React from 'react';

interface TerminalWindowProps {
  children: React.ReactNode;
  title?: string;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ children, title = "stack-tree-cli" }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900 p-4 font-mono text-term-fg selection:bg-term-green selection:text-black">
      <div className="w-full max-w-5xl h-full max-h-[900px] flex flex-col bg-term-bg border border-gray-700 shadow-2xl rounded-md overflow-hidden relative">
        {/* Window Title Bar */}
        <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3 space-x-2 shrink-0">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-xs text-gray-400 font-semibold tracking-wide">
            usr@{title}:~
          </div>
          <div className="w-10"></div>
        </div>
        
        {/* Terminal Content Area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default TerminalWindow;