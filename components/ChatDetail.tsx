import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ParsedConversation, TargetPlatform, MigrationChunk } from '../types';
import { Download, Copy, Check, FileDown, Layers } from 'lucide-react';
import { generateMarkdown, generateMigrationPackets } from '../services/parser';
import PersonaAnalyzer from './PersonaAnalyzer';

interface ChatDetailProps {
  chat: ParsedConversation;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ chat }) => {
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<TargetPlatform>('Gemini');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Recalculate chunks whenever chat or platform changes
  const packets: MigrationChunk[] = useMemo(() => {
    return generateMigrationPackets(chat, platform);
  }, [chat, platform]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
    setCopied(false);
  }, [chat.id]);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(chat);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPacket = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPacket = (chunk: MigrationChunk) => {
    const blob = new Blob([chunk.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = chunk.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      {/* Header Actions */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 shadow-md z-20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white truncate" title={chat.title}>{chat.title}</h2>
          <p className="text-xs text-gray-500">{new Date(chat.createTime * 1000).toLocaleString()} • {chat.messageCount} messages</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
           {/* Platform Selector */}
           <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 px-3 py-1.5">
              <span className="text-xs text-gray-500 mr-2 uppercase font-bold tracking-wider">Format:</span>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TargetPlatform)}
                className="bg-transparent text-sm text-blue-400 font-medium focus:outline-none cursor-pointer"
              >
                <option value="Gemini">Gemini (Structured)</option>
                <option value="Grok">Grok (Narrative)</option>
                <option value="Claude">Claude (XML)</option>
              </select>
           </div>

          <div className="flex gap-2">
            <button 
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg border border-gray-700 transition-all whitespace-nowrap"
            >
                <Download className="w-3.5 h-3.5" />
                Archive .md
            </button>

            {/* Smart Action Buttons based on Chunks */}
            {packets.length === 1 ? (
               <button 
                onClick={() => handleCopyPacket(packets[0].content)}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg font-medium transition-all shadow-lg whitespace-nowrap min-w-[140px] ${
                    copied 
                    ? 'bg-green-600 text-white border border-green-500' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Packet'}
              </button>
            ) : (
                <div className="flex gap-1">
                    {packets.map((chunk) => (
                         <button 
                            key={chunk.partNumber}
                            onClick={() => handleDownloadPacket(chunk)}
                            className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg border border-purple-500 transition-all whitespace-nowrap"
                            title={`Download Part ${chunk.partNumber} of ${chunk.totalParts}`}
                        >
                            <FileDown className="w-3.5 h-3.5" />
                            Pt {chunk.partNumber}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
      
      {packets.length > 1 && (
        <div className="bg-purple-900/20 border-b border-purple-900/50 px-4 py-2 flex items-center gap-2 text-xs text-purple-300">
            <Layers className="w-3 h-3" />
            <span>Large Chat Detected: Split into {packets.length} parts for safe ingestion. Download parts individually.</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        
        {/* Persona Card */}
        <PersonaAnalyzer chat={chat} />

        {/* Messages */}
        <div className="space-y-6 max-w-4xl mx-auto">
            {chat.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-gray-900/40' : ''} p-4 rounded-lg`}>
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${msg.role === 'user' ? 'bg-gray-700 text-gray-300' : 'bg-green-700 text-white'}
                    `}>
                        {msg.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="font-semibold text-sm text-gray-300 capitalize">{msg.role}</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-gray-400 whitespace-pre-wrap font-sans">
                            {msg.content}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;