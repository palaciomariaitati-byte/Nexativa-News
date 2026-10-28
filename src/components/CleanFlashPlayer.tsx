"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, ShieldCheck, Radio, Layers, ExternalLink, FastForward } from "lucide-react";

type Segment = {
  clip_id?: number;
  video_url?: string;
  youtube_id?: string;
  start_time_seconds: number;
  end_time_seconds: number;
  title: string;
  summary?: string;
  source_title?: string;
};

type CleanFlashPlayerProps = {
  videoUrl: string;
  segments?: Segment[];
  totalDurationSeconds?: number;
  title: string;
  partnerName?: string;
};

export default function CleanFlashPlayer({
  videoUrl,
  segments = [],
  totalDurationSeconds,
  title,
  partnerName = "Cadena 4"
}: CleanFlashPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [currentFlashTime, setCurrentFlashTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [allowContinuousPlay, setAllowContinuousPlay] = useState(false);

  // Helper to extract YouTube Video ID
  const getYouTubeId = useCallback((url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const defaultYtId = getYouTubeId(videoUrl);

  // Normalize segments with YouTube ID fallback
  const activeSegments: Segment[] = (segments && segments.length > 0)
    ? segments.map(s => ({
        ...s,
        youtube_id: s.youtube_id || getYouTubeId(s.video_url || "") || defaultYtId || undefined
      }))
    : [{
        start_time_seconds: 0,
        end_time_seconds: totalDurationSeconds || 180,
        title: title,
        youtube_id: defaultYtId || undefined
      }];

  const calculatedTotalDuration = totalDurationSeconds || activeSegments.reduce(
    (acc, s) => acc + Math.max(0, s.end_time_seconds - s.start_time_seconds),
    0
  );

  const currentSeg = activeSegments[currentSegmentIdx] || activeSegments[0];
  const activeYtId = currentSeg.youtube_id || defaultYtId;

  const stopPlaybackMonitor = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSegmentEnded = useCallback(() => {
    if (currentSegmentIdx < activeSegments.length - 1) {
      const nextIdx = currentSegmentIdx + 1;
      const nextSeg = activeSegments[nextIdx];
      const prevSeg = activeSegments[currentSegmentIdx];
      setCurrentSegmentIdx(nextIdx);

      if (playerRef.current) {
        const nextYtId = nextSeg.youtube_id || defaultYtId;
        const prevYtId = prevSeg.youtube_id || defaultYtId;

        if (nextYtId !== prevYtId && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById({
            videoId: nextYtId,
            startSeconds: nextSeg.start_time_seconds
          });
        } else if (playerRef.current.seekTo) {
          playerRef.current.seekTo(nextSeg.start_time_seconds, true);
          playerRef.current.playVideo();
        }
      }
    } else {
      // Reached end of the clip / Flash - Stop timer to avoid infinite loops!
      stopPlaybackMonitor();
      setIsPlaying(false);
      setIsCompleted(true);
      setCurrentFlashTime(calculatedTotalDuration);
      if (playerRef.current && playerRef.current.pauseVideo) {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }
    }
  }, [activeSegments, currentSegmentIdx, defaultYtId, calculatedTotalDuration, stopPlaybackMonitor]);

  const startPlaybackMonitor = useCallback(() => {
    stopPlaybackMonitor();

    timerRef.current = setInterval(() => {
      if (!playerRef.current || !playerRef.current.getCurrentTime) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const seg = activeSegments[currentSegmentIdx] || activeSegments[0];

        // If continuous playback is enabled by user, don't stop at end_time_seconds
        if (!allowContinuousPlay && seg.end_time_seconds && currentTime >= seg.end_time_seconds) {
          handleSegmentEnded();
        } else {
          let accumulatedPrev = 0;
          for (let i = 0; i < currentSegmentIdx; i++) {
            accumulatedPrev += Math.max(0, activeSegments[i].end_time_seconds - activeSegments[i].start_time_seconds);
          }
          const elapsedInSeg = Math.max(0, currentTime - seg.start_time_seconds);
          setCurrentFlashTime(Math.min(calculatedTotalDuration, accumulatedPrev + elapsedInSeg));
        }
      } catch (e) {}
    }, 250);
  }, [activeSegments, currentSegmentIdx, calculatedTotalDuration, allowContinuousPlay, handleSegmentEnded, stopPlaybackMonitor]);

  // Initialize YouTube API Player
  useEffect(() => {
    if (!activeYtId) return;

    let isSubscribed = true;

    const initPlayer = () => {
      if (playerRef.current) return;

      const firstSeg = activeSegments[0];
      const initialYtId = firstSeg.youtube_id || activeYtId;
      const elementId = `clean-player-${Math.random().toString(36).substring(2, 8)}`;
      
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div id="${elementId}" class="w-full h-full"></div>`;
      }

      playerRef.current = new (window as any).YT.Player(elementId, {
        videoId: initialYtId,
        playerVars: {
          autoplay: 1,
          controls: 1, // Permite controles nativos para evitar trabas y bucles
          modestbranding: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
          start: firstSeg.start_time_seconds || 0
        },
        events: {
          onReady: () => {
            if (isSubscribed) {
              setIsReady(true);
              setIsPlaying(true);
              startPlaybackMonitor();
            }
          },
          onStateChange: (event: any) => {
            if (!isSubscribed) return;
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsCompleted(false);
              startPlaybackMonitor();
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === (window as any).YT.PlayerState.ENDED) {
              handleSegmentEnded();
            }
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = () => {
        if (isSubscribed) initPlayer();
      };
    }

    return () => {
      isSubscribed = false;
      stopPlaybackMonitor();
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
      }
      playerRef.current = null;
    };
  }, [activeYtId]);

  // When segment changes or clip updates, seek to new start time
  useEffect(() => {
    setCurrentSegmentIdx(0);
    setCurrentFlashTime(0);
    setIsCompleted(false);
    setAllowContinuousPlay(false);

    if (playerRef.current && isReady) {
      const firstSeg = activeSegments[0];
      const targetYtId = firstSeg.youtube_id || defaultYtId;

      try {
        if (playerRef.current.getVideoData && playerRef.current.getVideoData().video_id !== targetYtId) {
          playerRef.current.loadVideoById({
            videoId: targetYtId,
            startSeconds: firstSeg.start_time_seconds || 0
          });
        } else if (playerRef.current.seekTo) {
          playerRef.current.seekTo(firstSeg.start_time_seconds || 0, true);
          playerRef.current.playVideo();
        }
        startPlaybackMonitor();
      } catch (e) {}
    }
  }, [videoUrl, title, segments]);

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isCompleted) {
      handleReplay();
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      stopPlaybackMonitor();
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
      startPlaybackMonitor();
    }
  };

  const handleReplay = () => {
    setCurrentSegmentIdx(0);
    setCurrentFlashTime(0);
    setIsCompleted(false);
    setAllowContinuousPlay(false);
    if (playerRef.current) {
      const firstSeg = activeSegments[0];
      const firstYtId = firstSeg.youtube_id || defaultYtId;
      if (firstYtId && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById({
          videoId: firstYtId,
          startSeconds: firstSeg.start_time_seconds || 0
        });
      } else if (playerRef.current.seekTo) {
        playerRef.current.seekTo(firstSeg.start_time_seconds || 0, true);
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
      startPlaybackMonitor();
    }
  };

  // Continue watching the whole broadcast without clip limits
  const handleContinueFull = () => {
    setAllowContinuousPlay(true);
    setIsCompleted(false);
    setIsPlaying(true);
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
    startPlaybackMonitor();
  };

  const progressPercent = Math.min(100, Math.max(0, (currentFlashTime / (calculatedTotalDuration || 1)) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const uniqueSourcesCount = Array.from(new Set(activeSegments.map(s => s.youtube_id || defaultYtId).filter(Boolean))).length;
  const youtubeWatchUrl = activeYtId ? `https://www.youtube.com/watch?v=${activeYtId}&t=${currentSeg.start_time_seconds || 0}s` : "";

  return (
    <div className="relative bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-0 select-none">
      {/* Top Branding Header */}
      <div className="bg-gradient-to-r from-red-950 via-black to-slate-900 px-4 py-2.5 border-b border-red-500/30 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Nexativa Clean Player
          </span>
          {uniqueSourcesCount > 1 && (
            <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
              <Layers className="w-3 h-3" /> Multi-Programa ({uniqueSourcesCount} transmisiones)
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Powered by <strong className="text-white">Nexora One</strong></span>
          {youtubeWatchUrl && (
            <a
              href={youtubeWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 flex items-center gap-1 ml-2 text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded"
            >
              <ExternalLink className="w-3 h-3" /> Ver en YouTube
            </a>
          )}
        </div>
      </div>

      {/* Video Container Area */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {/* YouTube API Target */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Completed Plaque Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-slate-950/95 to-black z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-500 shadow-2xl">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black text-red-500 uppercase tracking-widest block">
                🔴 RECORTE NOTICIOSO FINALIZADO
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-lg leading-snug">{title}</h3>
              <p className="text-xs text-gray-400 max-w-md">
                Corte audiovisual procesado por Nora IA. Puedes repetir el momento clave o continuar viendo la transmisión completa.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleReplay}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Repetir Momento Clave
              </button>

              <button
                onClick={handleContinueFull}
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all"
              >
                <FastForward className="w-4 h-4" /> Continuar Viendo Transmisión Completa
              </button>
            </div>

            <div className="pt-2 text-[10px] text-gray-500 border-t border-white/10 w-full max-w-xs text-center font-mono">
              Desarrollado por <strong>Nexora One</strong> para Nexativa News © Todos los derechos reservados
            </div>
          </div>
        )}
      </div>

      {/* Custom Clean Progress Bar */}
      <div className="bg-slate-900 p-4 border-t border-white/10 space-y-2">
        {/* Progress Line */}
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-red-600 via-amber-500 to-red-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls and Exclusive Flash Duration Counter */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg"
            >
              {isCompleted ? (
                <RotateCcw className="w-4 h-4" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <div>
              <span className="text-xs font-bold text-white block line-clamp-1">{title}</span>
              <span className="text-[10px] text-gray-400 block font-mono">
                Segmento {currentSegmentIdx + 1} de {activeSegments.length}: {currentSeg.title} {currentSeg.source_title ? `(${currentSeg.source_title})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!allowContinuousPlay && (
              <button
                onClick={handleContinueFull}
                className="text-[11px] text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                title="Quitar límite de tiempo y reproducir toda la transmisión"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Transmisión Completa</span>
              </button>
            )}

            <div className="text-right font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
              {formatTime(currentFlashTime)} / {formatTime(calculatedTotalDuration)}
            </div>
          </div>
        </div>

        {/* Footer Credit Signature */}
        <div className="pt-2 text-[10px] text-gray-400 border-t border-white/5 flex items-center justify-between">
          <span>Infraestructura Periodística Digital por <strong>Nexora One</strong></span>
          <span className="text-red-400 font-bold uppercase font-sans">© Nexativa News</span>
        </div>
      </div>
    </div>
  );
}
