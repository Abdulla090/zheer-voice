import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles } from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string;
    subtitles?: string; // VTT format
    onTimeUpdate?: (currentTime: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, subtitles, onTimeUpdate }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = Number(e.target.value);
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="video-player-container">
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    crossOrigin="anonymous"
                >
                    {subtitles && showSubtitles && (
                        <track
                            kind="subtitles"
                            src={subtitles}
                            srcLang="ku"
                            label="کوردی"
                            default
                        />
                    )}
                </video>

                <div className="video-controls">
                    <div className="progress-bar">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="progress-slider"
                        />
                    </div>

                    <div className="controls-bottom">
                        <div className="controls-left">
                            <button onClick={togglePlay} className="control-btn">
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            <button onClick={toggleMute} className="control-btn">
                                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>

                            <span className="time-display">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="controls-right">
                            {subtitles && (
                                <button
                                    onClick={() => setShowSubtitles(!showSubtitles)}
                                    className={`control-btn ${showSubtitles ? 'active' : ''}`}
                                >
                                    <Subtitles size={24} />
                                </button>
                            )}

                            <button onClick={toggleFullscreen} className="control-btn">
                                <Maximize size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .video-player-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .video-wrapper {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .video-wrapper video {
          width: 100%;
          display: block;
        }

        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          padding: 16px;
          transition: opacity 0.3s ease;
        }

        .video-wrapper:hover .video-controls {
          opacity: 1;
        }

        .progress-bar {
          margin-bottom: 12px;
        }

        .progress-slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .progress-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
        }

        .controls-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .controls-left,
        .controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .control-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .control-btn.active {
          color: #8B5CF6;
        }

        .time-display {
          color: white;
          font-size: 14px;
          font-family: monospace;
        }

        @media (max-width: 640px) {
          .video-controls {
            padding: 12px;
          }

          .control-btn {
            padding: 6px;
          }

          .control-btn svg {
            width: 20px;
            height: 20px;
          }

          .time-display {
            font-size: 12px;
          }
        }
      `}</style>
        </div>
    );
};

export default VideoPlayer;
