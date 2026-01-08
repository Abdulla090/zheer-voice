import React, { useCallback, useState } from 'react';
import { Upload, Film, Link as LinkIcon } from 'lucide-react';
import { SUPPORTED_VIDEO_FORMATS, MAX_VIDEO_SIZE } from '../../constants';
import { validateVideoFile } from '../../services/videoService';

interface UploadZoneProps {
  onVideoSelect: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onVideoSelect, onUrlSubmit, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndSelectFile(file);
      }
    },
    [disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSelectFile(file);
      }
    },
    []
  );

  const validateAndSelectFile = (file: File) => {
    setError('');

    const validation = validateVideoFile(file, MAX_VIDEO_SIZE);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    onVideoSelect(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!urlInput.trim()) {
      setError('تکایە لینکی ڤیدیۆ بنووسە');
      return;
    }

    if (onUrlSubmit) {
      onUrlSubmit(urlInput);
    } else {
      setError('تێبینی: بەهۆی سنووردارکردنەکانی یوتیوب، ئێستا تەنها بارکردنی فایل پشتگیری دەکرێت. تکایە ڤیدیۆکە دابەزێنە و بیباربکە.');
    }
  };

  return (
    <div className="upload-zone-container">
      {/* Tab Switcher */}
      <div className="input-mode-tabs">
        <button
          className={`tab-btn ${inputMode === 'file' ? 'active' : ''}`}
          onClick={() => setInputMode('file')}
        >
          <Upload size={18} />
          <span>بارکردنی فایل</span>
        </button>
        <button
          className={`tab-btn ${inputMode === 'url' ? 'active' : ''}`}
          onClick={() => setInputMode('url')}
        >
          <LinkIcon size={18} />
          <span>لینکی یوتیوب</span>
        </button>
      </div>

      {inputMode === 'file' ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">
            <Film size={64} strokeWidth={1.5} />
          </div>

          <h3 className="upload-title">
            ڤیدیۆکە ڕاکێشە بۆ ئێرە
          </h3>

          <p className="upload-subtitle">
            یان کرتە بکە بۆ هەڵبژاردن
          </p>

          <input
            type="file"
            id="video-upload"
            accept={SUPPORTED_VIDEO_FORMATS.join(',')}
            onChange={handleFileInput}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          <label htmlFor="video-upload" className="upload-button">
            <Upload size={20} />
            <span>هەڵبژاردنی ڤیدیۆ</span>
          </label>

          <div className="upload-info">
            <p>فۆرماتی پشتگیریکراو: MP4, WebM, MOV, AVI</p>
            <p>گەورەترین قەبارە: {MAX_VIDEO_SIZE / (1024 * 1024)}MB</p>
          </div>

          {error && (
            <div className="upload-error">
              {error}
            </div>
          )}
        </div>
      ) : (
        <form className="url-input-zone" onSubmit={handleUrlSubmit}>
          <div className="url-icon">
            <LinkIcon size={48} />
          </div>

          <h3 className="url-title">
            لینکی یوتیوب لێرە دابنێ
          </h3>

          <p className="url-subtitle">
            لینکی ڤیدیۆکە لە یوتیوب کۆپی بکە و لێرە بیلکێنە
          </p>

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="url-input"
            disabled={disabled}
            dir="ltr"
          />

          <button type="submit" className="url-submit-btn" disabled={disabled || !urlInput.trim()}>
            <LinkIcon size={20} />
            <span>پرۆسەکردنی ڤیدیۆ</span>
          </button>

          <div className="url-info">
            <p className="info-note">⚠️ تێبینی: لەبەر سنووردارکردنەکانی یوتیوب، ئێستا تەنها بارکردنی فایل کاردەکات</p>
            <p className="info-note">دەتوانی ڤیدیۆکە دابەزێنیت و وەک فایل بیباربکەیت</p>
          </div>

          {error && (
            <div className="upload-error">
              {error}
            </div>
          )}
        </form>
      )}

      <style>{`
        .upload-zone-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .input-mode-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: center;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .tab-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
          color: #C4B5FD;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #3B82F6);
          border-color: transparent;
          color: white;
        }

        .upload-zone {
          border: 3px dashed rgba(139, 92, 246, 0.5);
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-zone:hover:not(.disabled) {
          border-color: rgba(139, 92, 246, 0.8);
          background: rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
        }

        .upload-zone.dragging {
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.2);
          transform: scale(1.02);
        }

        .upload-zone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-icon {
          color: #8B5CF6;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .upload-title {
          font-size: 24px;
          font-weight: 600;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .upload-subtitle {
          color: #94A3B8;
          margin-bottom: 24px;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: linear-gradient(135deg, #8B5CF6, #3B82F6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }

        .upload-info {
          color: #64748B;
          font-size: 14px;
          line-height: 1.8;
        }

        .upload-info p {
          margin: 4px 0;
        }

        .url-input-zone {
          text-align: center;
          padding: 40px;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .url-icon {
          color: #F59E0B;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .url-title {
          font-size: 24px;
          font-weight: 600;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .url-subtitle {
          color: #94A3B8;
          margin-bottom: 24px;
        }

        .url-input {
          width: 100%;
          max-width: 500px;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          color: #F8FAFC;
          font-size: 14px;
          margin-bottom: 16px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .url-input:focus {
          border-color: #8B5CF6;
        }

        .url-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }

        .url-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }

        .url-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .url-info {
          margin-top: 20px;
        }

        .info-note {
          color: #F59E0B;
          font-size: 13px;
          margin: 8px 0;
          line-height: 1.6;
        }

        .upload-error {
          margin-top: 16px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #FCA5A5;
          font-size: 14px;
        }

        @media (max-width: 640px) {
          .upload-zone {
            padding: 40px 20px;
          }

          .upload-title {
            font-size: 20px;
          }

          .upload-button {
            padding: 10px 24px;
            font-size: 14px;
          }

          .input-mode-tabs {
            flex-direction: column;
          }

          .tab-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadZone;
