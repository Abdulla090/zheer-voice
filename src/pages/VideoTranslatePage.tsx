import React from 'react';
import { Film, Clock, Bell, Sparkles } from 'lucide-react';

const VideoTranslatePage: React.FC = () => {
  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '700px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      {/* Animated Icon */}
      <div style={{
        position: 'relative',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
          borderRadius: '24px',
          color: '#F59E0B',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <Film size={56} />
        </div>
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          borderRadius: '50%',
          padding: '8px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
        }}>
          <Clock size={20} color="white" />
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '42px',
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        بەم زووانە دێت
      </h1>

      <p style={{
        color: '#94A3B8',
        fontSize: '20px',
        marginBottom: '40px',
        lineHeight: '1.6'
      }}>
        وەرگێڕی ڤیدیۆی یوتیوب بەم زووانە ئامادە دەبێت
      </p>

      {/* Features Preview */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        width: '100%',
        marginBottom: '32px'
      }}>
        <h3 style={{
          color: '#F8FAFC',
          fontSize: '18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Sparkles size={20} color="#F59E0B" />
          تایبەتمەندییەکان
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            'وەرگێڕانی ئۆتۆماتیکی ڤیدیۆ بۆ کوردی سۆرانی',
            'گفتوگۆ لەگەڵ ناوەڕۆکی ڤیدیۆ',
            'داگرتنی ژێرنووس و وەرگێڕان',
            'پشتگیری زمانی جیاجیا'
          ].map((feature, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#F59E0B'
              }} />
              <span style={{ color: '#E2E8F0', fontSize: '15px' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        background: 'rgba(139, 92, 246, 0.15)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        color: '#C4B5FD'
      }}>
        <Bell size={20} />
        <span style={{ fontSize: '14px' }}>کارکردن لەسەر ئەم تایبەتمەندییە بەردەوامە</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default VideoTranslatePage;
