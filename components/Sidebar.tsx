import React, { useRef } from 'react';
import { Upload, FileJson, Activity, Database } from 'lucide-react';
import { ParsedConversation } from '../types';

interface SidebarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  chats: ParsedConversation[];
  isLoading: boolean;
  error: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileUpload, chats, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalMessages = chats.reduce((acc, chat) => acc + chat.messageCount, 0);

  return (
    <aside className="w-full md:w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="text-blue-500" />
          Exodus Bridge
        </h1>
        <p className="text-xs text-gray-400 mt-1">Migrate your history anywhere.</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">Import Data</label>
          <div 
            className="border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-blue-500 hover:bg-gray-800 transition-all cursor-pointer group text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={onFileUpload}
            />
            <div className="flex justify-center mb-3">
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 group-hover:text-gray-200">
              Click to upload <br/> <span className="font-mono text-xs">conversations.json</span>
            </p>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-400">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="mt-3 text-xs text-blue-400 flex items-center gap-2 animate-pulse">
              <FileJson className="w-4 h-4" /> Parsing structure...
            </div>
          )}
        </div>

        {chats.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dataset Stats</h3>
            <div className="bg-gray-800 rounded p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Conversations</span>
                <span className="text-white font-mono">{chats.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Messages</span>
                <span className="text-white font-mono">{totalMessages.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-[10px] text-gray-600">
          Runs locally in browser. No data leaves your device unless you use Gemini Analysis.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;