import React, { useState } from 'react';
import { ParsedConversation, PersonaAnalysis } from '../types';
import { analyzePersonaLocal } from '../services/parser';
import { analyzePersonaWithGemini } from '../services/geminiService';
import { Sparkles, BrainCircuit, AlertCircle } from 'lucide-react';

interface Props {
  chat: ParsedConversation;
}

const PersonaAnalyzer: React.FC<Props> = ({ chat }) => {
  const [analysis, setAnalysis] = useState<PersonaAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBasicAnalysis = () => {
    const result = analyzePersonaLocal(chat.messages);
    setAnalysis(result ? { ...result, isAiGenerated: false } : null);
  };

  const runGeminiAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePersonaWithGemini(chat.messages);
      setAnalysis({
        tone: result.tone,
        keywords: result.keywords,
        suggestedPrompt: result.suggestedPrompt,
        isAiGenerated: true
      });
    } catch (e) {
      setError("Gemini analysis failed. Check API Key configuration or connection.");
      // Fallback to local
      runBasicAnalysis();
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          Persona Detection
        </h4>
        <div className="flex gap-3">
          <button 
            onClick={runBasicAnalysis}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          >
            Quick Scan (Local)
          </button>
          <button 
            onClick={runGeminiAnalysis}
            className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-900/70 border border-purple-700 rounded text-xs text-purple-200 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3 h-3" />
            Deep Analysis (Gemini)
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-purple-500/30 rounded-lg bg-gray-800/50 relative overflow-hidden">
        {loading && (
             <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
                <Sparkles className="w-6 h-6 text-purple-500 animate-spin" />
             </div>
        )}
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          {analysis?.isAiGenerated ? <Sparkles className="w-4 h-4" /> : <ActivityIcon />}
          {analysis?.isAiGenerated ? 'Gemini Insight' : 'Basic Analysis'}
        </h4>
        <button onClick={() => setAnalysis(null)} className="text-gray-500 hover:text-white text-xs">Reset</button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Detected Tone</span>
          <p className="text-sm text-gray-200">{analysis?.tone}</p>
        </div>
        
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Keywords</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {analysis?.keywords.map(k => (
              <span key={k} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Suggested System Prompt</span>
          <div className="mt-1 p-3 bg-black/40 rounded border border-gray-700 font-mono text-xs text-green-400 break-words whitespace-pre-wrap">
            {analysis?.suggestedPrompt}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default PersonaAnalyzer;