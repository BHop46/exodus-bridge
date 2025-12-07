import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatDetail from './components/ChatDetail';
import { ParsedConversation } from './types';
import { parseChatExport } from './services/parser';
import { UploadCloud, ShieldCheck, Heart } from 'lucide-react';

const App: React.FC = () => {
  const [chats, setChats] = useState<ParsedConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ParsedConversation | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setChats([]);
    setSelectedChat(undefined);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const parsed = parseChatExport(json);
        setChats(parsed);
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Ensure it is a valid 'conversations.json' from ChatGPT.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
        setError("Error reading file.");
        setLoading(false);
    }
    reader.readAsText(file);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-200 font-sans">
      
      {/* Privacy Shield Banner */}
      <div className="bg-green-900/20 border-b border-green-900/50 py-2 px-4 flex items-center justify-center gap-2 text-green-400 text-xs font-medium shrink-0">
        <ShieldCheck className="w-4 h-4" />
        <span>Client-Side Secure: Your data is processed locally in your browser and never uploaded to any server.</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Navigation & Upload */}
        <Sidebar 
          onFileUpload={handleFileUpload} 
          chats={chats}
          isLoading={loading}
          error={error}
        />

        {/* Main Content Area split into List and Detail */}
        <main className="flex-1 flex overflow-hidden">
          {/* Chat List (Sidebar 2) */}
          {chats.length > 0 && (
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-800 bg-gray-900 shrink-0`}>
              <div className="p-4 border-b border-gray-800 bg-gray-900 font-semibold text-gray-400 text-sm uppercase tracking-wider">
                  History
              </div>
              <ChatList 
                  chats={chats} 
                  onSelectChat={setSelectedChat}
                  selectedId={selectedChat?.id}
              />
            </div>
          )}

          {/* Chat Detail View */}
          <div className={`flex-1 flex flex-col bg-gray-950 relative ${!selectedChat && chats.length > 0 ? 'hidden md:flex' : 'flex'}`}>
              {!selectedChat && chats.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                          <UploadCloud className="w-10 h-10 text-blue-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Ready to Migrate?</h2>
                      <p className="text-gray-400 max-w-md">
                          Upload your <code>conversations.json</code> file to parse, analyze, and convert your chat history for other LLMs.
                      </p>
                  </div>
              ) : !selectedChat ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                      Select a conversation to view details.
                  </div>
              ) : (
                  <>
                      {/* Mobile Back Button Overlay */}
                      <div className="md:hidden p-2 bg-gray-900 border-b border-gray-800">
                          <button onClick={() => setSelectedChat(undefined)} className="text-sm text-blue-400">
                              ← Back to List
                          </button>
                      </div>
                      <ChatDetail chat={selectedChat} />
                  </>
              )}
          </div>
        </main>
      </div>

      {/* Brother Michaels Footer */}
      <footer className="bg-gray-950 border-t border-gray-900 py-3 text-center shrink-0 z-10">
        <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
          <span>Forged for the Resistance by</span>
          <a href="#" className="text-gray-500 hover:text-blue-400 underline decoration-dotted">Brother Michaels</a>
        </p>
      </footer>
    </div>
  );
};

export default App;