import { RawConversation, ParsedConversation, ParsedMessage, RawMapping, TargetPlatform, MigrationChunk } from '../types';

/**
 * Traverses the mapping graph backwards from the leaf node to reconstruct
 * the linear conversation history.
 */
const reconstructConversation = (mapping: RawMapping, leafNodeId: string | null): ParsedMessage[] => {
  if (!leafNodeId) return [];

  const messages: ParsedMessage[] = [];
  let currentNodeId: string | null = leafNodeId;

  while (currentNodeId) {
    const node = mapping[currentNodeId];
    if (!node) break;

    // Only process if there is a message object (some nodes are purely structural/updates)
    if (node.message) {
      const { message } = node;
      const role = message.author.role;
      
      // We generally care about user and assistant. System messages in ChatGPT exports
      // often contain metadata we don't need, but we can keep them if content exists.
      if ((role === 'user' || role === 'assistant' || role === 'system') && message.content && message.content.parts) {
        const textContent = message.content.parts.filter((p: any) => typeof p === 'string').join('\n');
        
        if (textContent.trim()) {
          messages.push({
            id: message.id,
            role: role as 'user' | 'assistant' | 'system',
            content: textContent,
            timestamp: message.create_time,
          });
        }
      }
    }

    currentNodeId = node.parent || null;
  }

  // The loop traverses backwards, so we reverse to get chronological order
  return messages.reverse();
};

export const parseChatExport = (jsonData: any[]): ParsedConversation[] => {
  if (!Array.isArray(jsonData)) {
    throw new Error('Invalid JSON format. Expected an array of conversations.');
  }

  const parsedChats: ParsedConversation[] = [];

  for (const rawChat of jsonData) {
    // Validate basic structure
    if (!rawChat.mapping || !rawChat.id) continue;

    const rawConv = rawChat as RawConversation;
    const messages = reconstructConversation(rawConv.mapping, rawConv.current_node);

    if (messages.length > 0) {
      parsedChats.push({
        id: rawConv.id,
        title: rawConv.title || 'Untitled Conversation',
        createTime: rawConv.create_time,
        messages: messages,
        messageCount: messages.length,
      });
    }
  }

  // Sort by newest first
  return parsedChats.sort((a, b) => b.createTime - a.createTime);
};

export const generateMarkdown = (chat: ParsedConversation): string => {
  const header = `# ${chat.title}\n**Date:** ${new Date(chat.createTime * 1000).toLocaleString()}\n**Messages:** ${chat.messageCount}\n\n---\n\n`;
  const body = chat.messages.map(m => {
    const role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
    return `### **${role}**\n${m.content}\n`;
  }).join('\n');
  return header + body;
};

// --- Platform Specific Logic & Safety Chunker ---

const formatMessageForPlatform = (msg: ParsedMessage, platform: TargetPlatform): string => {
  switch (platform) {
    case 'Gemini':
      // Gemini likes structured Markdown headers
      const roleTitle = msg.role === 'user' ? 'USER' : 'MODEL';
      return `## ${roleTitle}\n${msg.content}`;
    
    case 'Claude':
      // Claude prefers XML-like tags
      return `<message role="${msg.role}">\n${msg.content}\n</message>`;
    
    case 'Grok':
    default:
      // Grok (and generic) prefers a clear narrative script format
      const roleName = msg.role === 'user' ? 'The User' : 'The Assistant';
      return `${roleName}: ${msg.content}`;
  }
};

const getPacketHeader = (platform: TargetPlatform, part: number): string => {
  const baseContext = `CONTEXT IMPORT (Part ${part}): The following is a transcript of a past conversation. Please ingest this history to understand the user's preferences, the assistant's established persona, and the current project state.`;
  
  if (platform === 'Claude') {
    return `<system_instruction>\n${baseContext}\n</system_instruction>\n<chat_history_part_${part}>`;
  }
  return `${baseContext}\n${part > 1 ? '[CONTINUATION OF PREVIOUS PART]\n' : ''}\nSTART TRANSCRIPT:\n\n`;
};

const getPacketFooter = (platform: TargetPlatform, isLast: boolean, nextPart?: number): string => {
  if (platform === 'Claude') {
    return `</chat_history_part_${isLast ? 'final' : nextPart ? nextPart - 1 : ''}>`;
  }
  return isLast ? `\n\nEND TRANSCRIPT` : `\n\n[CONTINUED IN PART ${nextPart}]`;
};

export const generateMigrationPackets = (chat: ParsedConversation, platform: TargetPlatform = 'Gemini'): MigrationChunk[] => {
  const CHUNK_LIMIT = 50000;
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const msg of chat.messages) {
    const formattedMsg = formatMessageForPlatform(msg, platform);
    
    // Check if adding this message exceeds limit
    if (currentChunk.length + formattedMsg.length > CHUNK_LIMIT && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = formattedMsg + '\n\n';
    } else {
      currentChunk += formattedMsg + '\n\n';
    }
  }
  
  // Push the remainder
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // Post-process chunks to add headers/footers
  return chunks.map((content, index) => {
    const partNum = index + 1;
    const isLast = index === chunks.length - 1;
    
    const header = getPacketHeader(platform, partNum);
    const footer = getPacketFooter(platform, isLast, partNum + 1);
    
    return {
      filename: `${chat.title.replace(/[^a-z0-9]/gi, '_')}_Part${partNum}_${platform}.txt`,
      content: header + '\n' + content + footer,
      partNumber: partNum,
      totalParts: chunks.length
    };
  });
};

// Basic heuristic analysis (Feature C - Fallback)
export const analyzePersonaLocal = (messages: ParsedMessage[]) => {
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  if (assistantMsgs.length === 0) return null;

  const totalWords = assistantMsgs.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
  const avgLength = totalWords / assistantMsgs.length;
  
  const hasCode = assistantMsgs.some(m => m.content.includes('```'));
  const isFormal = assistantMsgs.some(m => m.content.toLowerCase().includes('certainly') || m.content.toLowerCase().includes('however'));
  
  let tone = 'Neutral';
  if (hasCode) tone = 'Technical/Developer-focused';
  else if (isFormal && avgLength > 50) tone = 'Formal & Detailed';
  else if (!isFormal && avgLength < 30) tone = 'Concise & Casual';

  return {
    tone,
    keywords: hasCode ? ['Coding', 'Technical', 'Structured'] : ['General', 'Conversational'],
    suggestedPrompt: `Act as a ${tone.toLowerCase()} assistant. ${hasCode ? 'Prioritize clean code and explanation.' : 'Focus on clear, helpful dialogue.'}`,
    isAiGenerated: false
  };
};