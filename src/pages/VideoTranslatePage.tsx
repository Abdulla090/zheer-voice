import React, { useState, useRef, useEffect } from 'react';
import { Film, Link as LinkIcon, Loader2, CheckCircle2, MessageSquare, Languages, Zap, BrainCircuit, Bot, Send, Globe, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { processYouTubeVideo, translateToKurdish, chatWithVideoContext, chatWithWebGrounding } from '../../services/geminiVideoService';

const VideoTranslatePage: React.FC = () => {
  const [mode, setMode] = useState<'translate' | 'chat'>('translate');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState<'fast' | 'accurate'>('fast');
  const [error, setError] = useState('');

  // Translate mode states
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');

  // Chat mode states
  const [chatReady, setChatReady] = useState(false);
  const [chatTranscript, setChatTranscript] = useState(''); // Store transcript for context
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system', text: string, needsSearch?: boolean }[]>([]);
  const [question, setQuestion] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = localStorage.getItem('gemini_api_key') || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Translate Mode Handler
  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('تکایە کلیلی API لە ڕێکخستنەکان زیاد بکە');
      return;
    }
    if (!youtubeUrl.trim()) {
      setError('تکایە لینکی یوتیوب بنووسە');
      return;
    }

    setLoading(true);
    setError('');
    setTranscription('');
    setTranslation('');

    try {
      const transcript = await processYouTubeVideo(apiKey, youtubeUrl, speed);
      setTranscription(transcript);

      const kurdishText = await translateToKurdish(apiKey, transcript, speed);
      setTranslation(kurdishText);
    } catch (err: any) {
      setError(err.message || 'هەڵەیەک ڕوویدا');
    } finally {
      setLoading(false);
    }
  };

  // Chat Mode - Load Video & Transcribe First
  const handleLoadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setError('تکایە کلیلی API لە ڕێکخستنەکان زیاد بکە');
      return;
    }
    if (!youtubeUrl.trim()) {
      setError('تکایە لینکی یوتیوب بنووسە');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Get transcript first (Processing animation)
      const transcript = await processYouTubeVideo(apiKey, youtubeUrl, speed);
      setChatTranscript(transcript);
      setChatReady(true);
      setMessages([{
        role: 'assistant',
        text: 'ڤیدیۆکە شیکار کرا! ئێستا دەتوانی هەر پرسیارێک لەسەر ناوەرۆکی ڤیدیۆکە بکەیت.'
      }]);
    } catch (err: any) {
      setError(err.message || 'هەڵەیەک ڕوویدا');
    } finally {
      setLoading(false);
    }
  };

  // Chat Mode - Send Question
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setMessages(prev => [...prev, { role: 'user', text: currentQuestion }]);
    setQuestion('');
    setLoading(true);

    try {
      // Ask specific question about the video transcript
      const answer = await chatWithVideoContext(apiKey, chatTranscript, currentQuestion, speed);

      if (answer.includes('[SEARCH_NEEDED]')) {
        setMessages(prev => [...prev, {
          role: 'system',
          text: 'ئەم زانیارییە لە ڤیدیۆکەدا نەدۆزرایەوە. دەتەوێت لە ئینتەرنێت بۆت بگەڕێم؟',
          needsSearch: true
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
      }
    } catch (err: any) {
      setError(err.message || 'هەڵەیەک ڕوویدا');
    } finally {
      setLoading(false);
    }
  };

  // Handle Web Search Confirmation
  const handleWebSearch = async () => {
    // Find the last user question
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setLoading(true);
    // Remove the system message prompt
    setMessages(prev => prev.filter(m => !m.needsSearch));

    // Add searching indicator
    setMessages(prev => [...prev, { role: 'assistant', text: '🔍 دەگەڕێم لە ئینتەرنێت...' }]);

    try {
      const webAnswer = await chatWithWebGrounding(apiKey, lastUserMessage.text);
      // Remove "searching" message and add real answer
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // Remove "searching..."
        return [...newMsgs, { role: 'assistant', text: webAnswer }];
      });
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'ببورە، نەمتوانی لە ئینتەرنێت بگەڕێم.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Markdown Render Components
  const markdownComponents = {
    p: ({ node, ...props }: any) => <p style={{ marginBottom: '16px', lineHeight: '1.8' }} {...props} />,
    ul: ({ node, ...props }: any) => <ul style={{ listStyle: 'disc', marginRight: '24px', marginBottom: '16px' }} {...props} />,
    ol: ({ node, ...props }: any) => <ol style={{ listStyle: 'decimal', marginRight: '24px', marginBottom: '16px' }} {...props} />,
    li: ({ node, ...props }: any) => <li style={{ marginBottom: '8px' }} {...props} />,
    h1: ({ node, ...props }: any) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '16px' }} {...props} />,
    h2: ({ node, ...props }: any) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', marginBottom: '14px' }} {...props} />,
    h3: ({ node, ...props }: any) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '12px' }} {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote style={{ borderRight: '4px solid #F59E0B', paddingRight: '16px', margin: '16px 0', color: '#CBD5E1' }} {...props} />,
    code: ({ node, inline, ...props }: any) =>
      inline
        ? <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }} {...props} />
        : <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginBottom: '16px' }}><code {...props} /></pre>,
    strong: ({ node, ...props }: any) => <strong style={{ color: '#F8FAFC', fontWeight: '700' }} {...props} />
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          padding: '20px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          borderRadius: '20px',
          color: 'white',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)'
        }}>
          <Film size={48} />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#F8FAFC', marginBottom: '12px' }}>
          وەرگێڕی ڤیدیۆ
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '18px' }}>
          ڤیدیۆکانی یوتیوب بۆ کوردی سۆرانی وەربگێڕە یان گفتوگۆی لەگەڵدا بکە
        </p>
      </div>

      {/* Mode Selector */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => setMode('translate')}
          style={{
            padding: '12px 32px',
            background: mode === 'translate' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(15, 23, 42, 0.8)',
            border: mode === 'translate' ? '1px solid #F59E0B' : '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '12px',
            color: '#F8FAFC',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Languages size={20} />
          <span>وەرگێڕان</span>
        </button>
        <button
          onClick={() => setMode('chat')}
          style={{
            padding: '12px 32px',
            background: mode === 'chat' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(15, 23, 42, 0.8)',
            border: mode === 'chat' ? '1px solid #8B5CF6' : '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '12px',
            color: '#F8FAFC',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={20} />
          <span>گفتوگۆ</span>
        </button>
      </div>

      {/* Translate Mode */}
      {mode === 'translate' && (
        <>
          <form onSubmit={handleTranslate} style={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '32px'
          }}>
            {/* Speed selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#F8FAFC', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                خێرایی پرۆسەکردن
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSpeed('fast')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: speed === 'fast' ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(15, 23, 42, 0.8)',
                    border: speed === 'fast' ? '1px solid #10B981' : '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Zap size={18} />
                  <span>خێرا</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed('accurate')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: speed === 'accurate' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(15, 23, 42, 0.8)',
                    border: speed === 'accurate' ? '1px solid #8B5CF6' : '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <BrainCircuit size={18} />
                  <span>وردیبن</span>
                </button>
              </div>
            </div>

            {/* URL input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#F8FAFC', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                لینکی یوتیوب
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={loading}
                  dir="ltr"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !youtubeUrl.trim()}
                  style={{
                    padding: '12px 32px',
                    background: loading ? '#64748B' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>پرۆسەکردن...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={20} />
                      <span>وەرگێڕان</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#FCA5A5',
                fontSize: '14px',
                textAlign: 'right'
              }}>
                {error}
              </div>
            )}
          </form>

          {/* Translation Results */}
          {(transcription || translation) && (
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
              {transcription && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  height: 'fit-content'
                }}>
                  <h3 style={{ color: '#8B5CF6', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} />
                    نووسینەوەی ڕەسەن
                  </h3>
                  <div style={{ color: '#E2E8F0', fontSize: '15px' }}>
                    <ReactMarkdown components={markdownComponents}>
                      {transcription}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {translation && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  height: 'fit-content'
                }}>
                  <h3 style={{ color: '#F59E0B', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
                    <CheckCircle2 size={20} />
                    وەرگێڕانی کوردی
                  </h3>
                  <div style={{ color: '#E2E8F0', fontSize: '15px', direction: 'rtl', textAlign: 'right' }}>
                    <ReactMarkdown components={markdownComponents}>
                      {translation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Chat Mode */}
      {mode === 'chat' && (
        <>
          {!chatReady ? (
            <form onSubmit={handleLoadVideo} style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '32px'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#F8FAFC', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                  لینکی یوتیوب
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={loading}
                    dir="ltr"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !youtubeUrl.trim()}
                    style={{
                      padding: '12px 32px',
                      background: loading ? '#64748B' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>شیکارکردنی ڤیدیۆ...</span>
                      </>
                    ) : (
                      <>
                        <Bot size={20} />
                        <span>دەستپێکردن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#FCA5A5',
                  fontSize: '14px',
                  textAlign: 'right'
                }}>
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              {/* Chat Messages */}
              <div style={{
                height: '400px',
                overflowY: 'auto',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px'
              }}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: '16px',
                    textAlign: msg.role === 'user' ? 'left' : 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end',
                    width: '100%'
                  }}>
                    {msg.role === 'system' ? (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid #F59E0B',
                        padding: '16px',
                        borderRadius: '12px',
                        maxWidth: '80%',
                        color: '#F8FAFC',
                        textAlign: 'right'
                      }}>
                        <p style={{ marginBottom: '12px' }}>{msg.text}</p>
                        <button
                          onClick={handleWebSearch}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginRight: 'auto'
                          }}
                        >
                          <Globe size={16} />
                          گەڕان لە ئینتەرنێت
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-block',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                          : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        color: '#F8FAFC',
                        maxWidth: '80%',
                        wordBreak: 'break-word'
                      }}>
                        <div dir="rtl" style={{ textAlign: msg.role === 'user' ? 'left' : 'right' }}>
                          <ReactMarkdown components={markdownComponents}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendQuestion} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="پرسیارێک لەبارەی ڤیدیۆکە بکە..."
                  disabled={loading}
                  dir="rtl"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  style={{
                    padding: '12px 24px',
                    background: loading ? '#64748B' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Custom scrollbar for chat */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4); 
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3); 
          borderRadius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5); 
        }
      `}</style>
    </div>
  );
};

export default VideoTranslatePage;
