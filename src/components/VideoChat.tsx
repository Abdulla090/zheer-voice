import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader } from 'lucide-react';
import { ChatMessage, VideoContext } from '../../types';
import { chatWithVideo, suggestQuestions } from '../../services/videoChatService';

interface VideoChatProps {
    videoContext: VideoContext | null;
    apiKey: string;
}

const VideoChat: React.FC<VideoChatProps> = ({ videoContext, apiKey }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText?: string) => {
        const textToSend = messageText || input.trim();
        if (!textToSend || !videoContext || !apiKey) return;

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: textToSend,
            timestamp: Date.now()
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatWithVideo(apiKey, videoContext, textToSend, messages);

            const aiMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'assistant',
                content: `هەڵە: ${error.message}`,
                timestamp: Date.now()
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const quickQuestions = videoContext ? suggestQuestions(videoContext) : [];

    return (
        <div className="video-chat-container">
            <div className="chat-header">
                <Sparkles size={24} />
                <h3>گفتوگۆ لەگەڵ ڤیدیۆ</h3>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && videoContext && (
                    <div className="chat-welcome">
                        <p>سڵاو! من دەتوانم یارمەتیت بدەم لە تێگەیشتنی ئەم ڤیدیۆیە.</p>
                        <div className="quick-questions">
                            {quickQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => sendMessage(question)}
                                    className="quick-question-btn"
                                    disabled={isLoading}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                    >
                        <div className="message-content">
                            {message.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message ai-message">
                        <div className="message-content typing">
                            <Loader className="spinner" size={20} />
                            <span>لە نووسینداە...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="پرسیارێک بکە دەربارەی ڤیدیۆکە..."
                    disabled={isLoading || !videoContext}
                    className="chat-input"
                    dir="rtl"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading || !videoContext}
                    className="send-btn"
                >
                    <Send size={20} />
                </button>
            </form>

            <style>{`
        .video-chat-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 500px;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(139, 92, 246, 0.1);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          color: #F8FAFC;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }

        .chat-welcome {
          text-align: center;
          color: #94A3B8;
          padding: 20px;
        }

        .chat-welcome p {
          margin-bottom: 20px;
          font-size: 16px;
        }

        .quick-questions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .quick-question-btn {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: #C4B5FD;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          max-width: 80%;
        }

        .quick-question-btn:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
        }

        .quick-question-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message {
          display: flex;
          margin-bottom: 8px;
        }

        .user-message {
          justify-content: flex-end;
        }

        .ai-message {
          justify-content: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
          line-height: 1.6;
        }

        .user-message .message-content {
          background: linear-gradient(135deg, #06B6D4, #0891B2);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .ai-message .message-content {
          background: rgba(139, 92, 246, 0.2);
          color: #F8FAFC;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .message-content.typing {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .chat-input-form {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          color: #F8FAFC;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .chat-input:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .chat-input::placeholder {
          color: #64748B;
        }

        .send-btn {
          padding: 12px 16px;
          background: linear-gradient(135deg, #8B5CF6, #3B82F6);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .video-chat-container {
            height: 400px;
          }

          .message-content {
            max-width: 90%;
            font-size: 14px;
          }

          .quick-question-btn {
            max-width: 95%;
          }
        }
      `}</style>
        </div>
    );
};

export default VideoChat;
