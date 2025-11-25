import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, HardDrive, RefreshCw } from 'lucide-react';

interface SystemViewProps {
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  onReset: () => Promise<void>;
  lastSaveTime?: number;
}

const SystemView: React.FC<SystemViewProps> = ({ onExport, onImport, onReset, lastSaveTime }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [msg, setMsg] = useState('');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('LOADING');
    setMsg('Importing data...');
    try {
        await onImport(file);
        setStatus('SUCCESS');
        setMsg('Data imported successfully. App refreshed.');
    } catch (err) {
        setStatus('ERROR');
        setMsg('Failed to import data. Invalid file.');
        console.error(err);
    }
  };

  const handleExportClick = async () => {
      setStatus('LOADING');
      setMsg('Generating export...');
      try {
          await onExport();
          setStatus('SUCCESS');
          setMsg('Export downloaded.');
      } catch (err) {
          setStatus('ERROR');
          setMsg('Export failed.');
      }
  };

  const handleResetClick = async () => {
      // Logic delegated to App.tsx via onReset prop to show custom modal
      try {
          await onReset();
          // We might not reach here if app resets completely
      } catch (err) {
          console.error("Reset request failed:", err);
      }
  };

  return (
    <div className="h-full overflow-y-auto font-mono p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg border border-gray-800 bg-gray-900/50 p-8 rounded-lg shadow-2xl relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-term-blue via-term-green to-term-yellow"></div>

        <div className="flex items-center justify-center mb-8">
            <HardDrive className="text-gray-500 mr-3" size={32} />
            <h1 className="text-2xl font-bold text-gray-200 tracking-wider">SYSTEM CONTROL</h1>
        </div>

        {lastSaveTime && (
            <div className="text-center mb-8 text-xs text-gray-600 font-mono">
                Last Synced to Local Storage: {new Date(lastSaveTime).toLocaleTimeString()}
            </div>
        )}

        <div className="space-y-4">
            {/* EXPORT */}
            <button 
                onClick={handleExportClick}
                disabled={status === 'LOADING'}
                className="w-full flex items-center justify-between p-4 border border-gray-700 hover:border-term-green hover:bg-gray-800 transition-all group"
            >
                <div className="flex items-center">
                    <Download className="mr-4 text-term-green" />
                    <div className="text-left">
                        <div className="text-gray-200 font-bold group-hover:text-term-green">EXPORT DATA</div>
                        <div className="text-gray-600 text-xs">Download JSON backup</div>
                    </div>
                </div>
                <div className="text-gray-700 text-xs">.JSON</div>
            </button>

            {/* IMPORT */}
            <button 
                onClick={handleImportClick}
                disabled={status === 'LOADING'}
                className="w-full flex items-center justify-between p-4 border border-gray-700 hover:border-term-blue hover:bg-gray-800 transition-all group"
            >
                 <div className="flex items-center">
                    <Upload className="mr-4 text-term-blue" />
                    <div className="text-left">
                        <div className="text-gray-200 font-bold group-hover:text-term-blue">IMPORT DATA</div>
                        <div className="text-gray-600 text-xs">Restore from JSON backup</div>
                    </div>
                </div>
                <div className="text-gray-700 text-xs">UPLOAD</div>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
            />

            {/* RESET */}
            <div className="pt-8 border-t border-gray-800 mt-8">
                 <button 
                    onClick={handleResetClick}
                    disabled={status === 'LOADING'}
                    className="w-full flex items-center justify-center p-3 border border-red-900/30 bg-red-900/5 hover:bg-red-900/20 text-red-700 hover:text-red-500 transition-all text-xs font-bold tracking-widest"
                >
                    <Trash2 className="mr-2" size={14} /> FACTORY RESET SYSTEM
                </button>
            </div>
        </div>

        {/* Status Message Overlay */}
        {status !== 'IDLE' && (
            <div className={`mt-6 text-center text-sm font-bold p-2 rounded 
                ${status === 'LOADING' ? 'text-term-yellow animate-pulse' : ''}
                ${status === 'SUCCESS' ? 'text-term-green bg-term-green/10' : ''}
                ${status === 'ERROR' ? 'text-term-red bg-term-red/10' : ''}
            `}>
                {status === 'LOADING' && <RefreshCw className="inline-block mr-2 animate-spin" size={14} />}
                {msg}
            </div>
        )}

      </div>
    </div>
  );
};

export default SystemView;