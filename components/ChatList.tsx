import React, { useState, useMemo } from 'react';
import { ParsedConversation } from '../types';
import { Search, MessageSquare, Calendar } from 'lucide-react';

interface ChatListProps {
  chats: ParsedConversation[];
  onSelectChat: (chat: ParsedConversation) => void;
  selectedId: string | undefined;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat, selectedId }) => {
  const [filter, setFilter] = useState('');

  const filteredChats = useMemo(() => {
    return chats.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()));
  }, [chats, filter]);

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
        <p>No conversations loaded.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/50">
      <div className="p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map(chat => (
          <div 
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`
              p-4 border-b border-gray-800 cursor-pointer transition-colors hover:bg-gray-800/50
              ${selectedId === chat.id ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
            `}
          >
            <h3 className="text-sm font-medium text-gray-200 mb-1 truncate">{chat.title}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(chat.createTime * 1000).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {chat.messageCount} msgs
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;