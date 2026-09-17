import React, { useState, useEffect, useRef } from 'react';
import { generateDiagnosticResponse } from '../../lib/churnKnowledgeBase';

const STARTER_PROMPTS = [
  "🔍 How does the XGBoost model calculate risk?",
  "💡 Why is month-to-month contract high risk?",
  "⚡ How does the What-If Simulator calculate saved ARR?",
  "📊 Explain the 6 Account Health Radar pillars"
];

export default function ChurnAdvisorChat({ 
  currentPage = 'single', 
  activeProfile = null, 
  currentProb = null, 
  inspectedId = null,
  cohortStats = null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "### ✦ Hello! I'm ChurnPred AI\nYour resident **XGBoost & Retention Strategy Expert**. Ask me anything about our machine learning models, customer risk drivers, or live retention strategies!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    if (!query || isLoading) return;

    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const chatContext = {
      page: currentPage,
      profile: activeProfile,
      prob: currentProb,
      inspectedId,
      cohortStats
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newMessages.slice(-5),
          context: chatContext
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Non-JSON or status ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply || 'No response generated.' }]);
    } catch (err) {
      console.warn('Backend chat offline, using client-side diagnostic knowledge engine:', err);
      // Client-side intelligent fallback using domain knowledge engine
      const diagnosticReply = generateDiagnosticResponse(query, chatContext);
      setMessages(prev => [...prev, { sender: 'ai', text: diagnosticReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: 'ai',
        text: "### ✦ Conversation Cleared\nHow can I assist you with your churn analysis or XGBoost model predictions?"
      }
    ]);
  };

  // Render markdown-like simple formatting (bold, headers, bullets, tags)
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-[13px]">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <div key={idx} className="font-bold text-white text-sm font-mono mt-1 mb-1 flex items-center gap-1.5 text-cyan-300">
                <span>✦</span>
                <span>{line.replace('### ', '')}</span>
              </div>
            );
          }
          if (line.startsWith('---')) {
            return <div key={idx} className="border-t border-white/10 my-2" />;
          }
          if (line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#00f298] text-xs leading-5">•</span>
                <span className="text-gray-200" dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)[1];
            const content = line.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-cyan-400 font-mono font-bold text-xs">{num}.</span>
                <span className="text-gray-200" dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-gray-300" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-white/10 font-mono text-cyan-300 text-[11px]">$1</code>');
  };

  // Determine active context badge label
  let contextLabel = "Platform Guide";
  if (currentPage === 'single') {
    contextLabel = currentProb !== null 
      ? `Active Profile: ${Math.round(currentProb * 100)}% Churn Risk` 
      : `Single Profile Workspace`;
  } else if (currentPage === 'batch') {
    contextLabel = cohortStats && cohortStats.totalCount > 0 
      ? `Cohort: ${cohortStats.totalCount} Scored Accts` 
      : `Batch CSV Workspace`;
  }

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      <button
        id="churn-ai-launcher"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full text-xs sm:text-sm font-semibold text-white shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 24, 38, 0.95), rgba(8, 12, 20, 0.95))',
          border: '1px solid rgba(0, 242, 152, 0.45)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 152, 0.25)',
          backdropFilter: 'blur(16px)'
        }}
        title="Open ChurnPred AI Advisor"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f298] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00f298]"></span>
        </span>
        <span className="font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00f298] to-cyan-300">
          ✦ Ask Churn AI
        </span>
      </button>

      {/* CHAT WINDOW DRAWER */}
      {isOpen && (
        <div 
          id="churn-ai-window"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[590px] max-h-[82vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-all duration-300"
          style={{
            background: 'rgba(11, 15, 22, 0.95)',
            borderColor: 'rgba(0, 242, 152, 0.25)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 152, 0.12)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* HEADER */}
          <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f298]/20 to-cyan-500/20 border border-[#00f298]/40 flex items-center justify-center text-sm">
                ✦
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  ChurnPred AI
                  <span className="text-[10px] text-[#00f298] bg-[#00f298]/10 px-1.5 py-0.2 rounded border border-[#00f298]/20">
                    XGBoost Expert
                  </span>
                </div>
                <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f298]"></span>
                  <span>{contextLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button" 
                onClick={handleClear}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors text-xs"
              >
                ↺
              </button>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MESSAGE STREAM */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`p-3.5 rounded-2xl max-w-[88%] text-xs shadow-md ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border border-cyan-400/40 text-white rounded-br-none'
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none'
                  }`}
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  {m.sender === 'user' ? (
                    <p className="font-medium text-white">{m.text}</p>
                  ) : (
                    renderMessageContent(m.text)
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-text-muted p-2">
                <span className="animate-spin text-sm">✦</span>
                <span className="font-mono text-[11px]">Analyzing XGBoost telemetry...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT STARTERS */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto no-scrollbar">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="quick-starter-chip px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
            <input 
              id="churn-ai-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about XGBoost, features, or retention..."
              className="flex-1 bg-white/5 border border-white/15 focus:border-[#00f298] text-white placeholder:text-gray-500 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-sans"
            />
            <button
              id="churn-ai-send"
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f298] to-cyan-400 text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,242,152,0.3)]"
            >
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
