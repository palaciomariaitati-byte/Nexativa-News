/* src/components/VideoSpotCreator.tsx */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Download, UploadCloud, X, Film, Volume2, Info, CheckCircle2, Music, Upload, Link as LinkIcon, Layers } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface VideoSpotCreatorProps {
  imageUrl: string;
  title: string;
  copyText: string;
  clientName: string;
  clientLogoUrl?: string;
  onUploadFinished: (url: string) => void;
  onClose: () => void;
}

const MUSIC_TRACKS = [
  { id: "motivador", name: "Comercial Energético 🔥 (Dance)", bpm: 125 },
  { id: "alegre", name: "Moderno & Comercial 📈 (Pop/Groove)", bpm: 108 },
  { id: "acustico", name: "Ambiental Relajante 🍃 (Chill/Bell)", bpm: 80 },
];

const ANIMATION_STYLES = [
  { id: "kenburns", name: "Zoom Cinemático (Ken Burns)" },
  { id: "paneo", name: "Desplazamiento Horizontal" },
  { id: "pulsante", name: "Pulsante Rítmico (Sincro Beat)" },
  { id: "giro", name: "Giro Suave y Paneo" },
];

// Procedural Audio Synthesizer Sequencer
class SynthSequencer {
  private ctx: AudioContext;
  private dest: AudioNode;
  private type: string;
  private intervalId: any = null;
  private step = 0;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext, dest: AudioNode, type: string) {
    this.ctx = ctx;
    this.dest = dest;
    this.type = type;
    this.initNoiseBuffer();
  }

  private initNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  start() {
    const track = MUSIC_TRACKS.find(t => t.id === this.type) || MUSIC_TRACKS[0];
    const tempo = track.bpm;
    const stepDuration = 60 / tempo / 2; // eighth notes
    let nextNoteTime = this.ctx.currentTime;

    const scheduler = () => {
      while (nextNoteTime < this.ctx.currentTime + 0.1) {
        this.playStep(nextNoteTime, this.step);
        nextNoteTime += stepDuration;
        this.step = (this.step + 1) % 16;
      }
    };

    this.intervalId = setInterval(scheduler, 25);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private playStep(time: number, step: number) {
    const ctx = this.ctx;
    const dest = this.dest;

    if (this.type !== "acustico" && (step % 4 === 0)) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
      gain.gain.setValueAtTime(0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.18);
    }

    if (this.type !== "acustico" && step % 4 === 2 && this.noiseBuffer) {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, time);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);
      noiseSource.start(time);

      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.linearRampToValueAtTime(100, time + 0.1);
      toneGain.gain.setValueAtTime(0.25, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(toneGain);
      toneGain.connect(dest);
      osc.start(time);
      osc.stop(time + 0.12);
    }

    if (this.type !== "acustico" && step % 2 === 1 && this.noiseBuffer) {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7500, time);
      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(0.12, time);
      hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      noiseSource.connect(filter);
      filter.connect(hatGain);
      hatGain.connect(dest);
      noiseSource.start(time);
    }

    const chords = {
      motivador: [
        [220, 261.63, 329.63], // Am
        [220, 261.63, 329.63],
        [174.61, 220, 261.63], // F
        [196.00, 246.94, 293.66], // G
      ],
      alegre: [
        [261.63, 329.63, 392.00], // C
        [293.66, 349.23, 440.00], // Dm
        [329.63, 392.00, 493.88], // Em
        [349.23, 440.00, 523.25], // F
      ],
      acustico: [
        [196.00, 246.94, 293.66, 392.00], // Gmaj7
        [174.61, 220.00, 261.63, 349.23], // Fmaj7
        [220.00, 261.63, 329.63, 440.00], // Am7
        [196.00, 246.94, 293.66, 392.00], // Gmaj7
      ]
    };

    const chordList = chords[this.type as keyof typeof chords] || chords.motivador;
    const chordIndex = Math.floor(step / 4) % chordList.length;
    const currentChord = chordList[chordIndex];

    if (step % 8 === 0) {
      const bassFreq = currentChord[0] / 2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(bassFreq, time);
      gain.gain.setValueAtTime(0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 1.0);
    }

    if (this.type === "acustico") {
      if (step % 2 === 0) {
        const note = currentChord[step % currentChord.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.75);
      }
    } else {
      if (step % 2 !== 0 && Math.random() > 0.3) {
        const note = currentChord[Math.floor(Math.random() * currentChord.length)] * (step % 3 === 0 ? 2 : 1);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this.type === "motivador" ? "sawtooth" : "sine";
        osc.frequency.setValueAtTime(note, time);
        
        if (osc.type === "sawtooth") {
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(700, time);
          osc.connect(filter);
          filter.connect(gain);
        } else {
          osc.connect(gain);
        }
        
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.35);
      }
    }
  }
}

export default function VideoSpotCreator({
  imageUrl,
  title,
  copyText,
  clientName,
  clientLogoUrl,
  onUploadFinished,
  onClose,
}: VideoSpotCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Custom audio elements and nodes
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sequencerRef = useRef<SynthSequencer | null>(null);
  const customAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [selectedTrack, setSelectedTrack] = useState(MUSIC_TRACKS[0]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // New audio states: Custom tracks
  const [audioType, setAudioType] = useState<"synth" | "file" | "url">("synth");
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [customAudioObjectUrl, setCustomAudioObjectUrl] = useState<string | null>(null);

  // New animation states
  const [animationStyle, setAnimationStyle] = useState("kenburns");

  const durationLimit = 10; // Spot duration: 10 seconds

  // Initialize and run canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl || "/banner-nexativa.jpg";

    const logoImg = new Image();
    if (clientLogoUrl) {
      logoImg.crossOrigin = "anonymous";
      logoImg.src = clientLogoUrl;
    }

    let startTime = Date.now();

    const render = () => {
      if (!ctx || !canvas) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed % durationLimit) / durationLimit;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background image with selected animation style
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        if (animationStyle === "kenburns") {
          const scale = 1 + progress * 0.15;
          const panX = -progress * 25;
          const panY = -progress * 15;
          ctx.translate(panX, panY);
          ctx.scale(scale, scale);
        } else if (animationStyle === "paneo") {
          const panX = -30 + progress * 60;
          ctx.translate(panX, 0);
          ctx.scale(1.12, 1.12);
        } else if (animationStyle === "pulsante") {
          const track = MUSIC_TRACKS.find(t => t.id === selectedTrack.id) || MUSIC_TRACKS[0];
          const tempo = audioType === "synth" ? track.bpm : 120;
          const bps = tempo / 60;
          const pulse = Math.abs(Math.sin(elapsed * Math.PI * bps)) * 0.05;
          ctx.scale(1.05 + pulse, 1.05 + pulse);
        } else if (animationStyle === "giro") {
          const rotate = Math.sin(elapsed * 0.8) * 0.035;
          ctx.rotate(rotate);
          ctx.scale(1.08 + progress * 0.07, 1.08 + progress * 0.07);
        }

        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#1e1b4b");
        grad.addColorStop(1, "#311042");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw top header brand ribbon (Dark Translucent bar with gold bottom line)
      ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
      ctx.fillRect(0, 0, canvas.width, 42);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(0, 41, canvas.width, 1.5);

      // Client name on left
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`📣  ${clientName.toUpperCase()}`, 15, 22);

      // Pulsing CTA Badge on right inside top bar (green WhatsApp styling)
      ctx.save();
      ctx.textAlign = "right";
      const ctaPulse = 1 + Math.abs(Math.sin(elapsed * Math.PI * 1.5)) * 0.04;
      ctx.fillStyle = "#22c55e"; // Success green
      ctx.font = `bold ${Math.floor(11 * ctaPulse)}px sans-serif`;
      ctx.fillText("¡CONSULTAR AHORA! 📲", canvas.width - 60, 22);
      ctx.restore();

      // Draw logo in circle frame top-right (on the bar)
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width - 32, 21, 15, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, canvas.width - 47, 6, 30, 30);
        ctx.restore();
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width - 32, 21, 15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main Campaign Title Overlay in middle-bottom
      // Rendered with thick black outline for 100% legibility on any image without dark blocks!
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 5;
      ctx.font = "900 32px sans-serif";
      const displayTitle = title.toUpperCase();
      ctx.strokeText(displayTitle, canvas.width / 2, canvas.height - 75);
      ctx.fillText(displayTitle, canvas.width / 2, canvas.height - 75);
      ctx.restore();

      // TELEVISION-STYLE NEWS TICKER (Scrolling Text Marquee)
      // Only occupies 35px at the bottom of the canvas, keeping the graphic image completely visible.
      const tickerHeight = 35;
      const tickerY = canvas.height - tickerHeight;

      // Dark translucent ticker background
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(0, tickerY, canvas.width, tickerHeight);

      // Gold top accent border for ticker
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(0, tickerY, canvas.width, 1.5);

      // Render scrolling text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const cleanCopy = copyText.replace(/<[^>]+>/g, "").trim();
      const tickerText = `✦  ${cleanCopy}  ✦  ¡PREGUNTANOS POR NUESTRAS PROMOCIONES!  ✦  ${displayTitle}  ✦  `;
      const textWidth = ctx.measureText(tickerText).width;

      const speed = 70; // 70px per second
      const totalWidth = textWidth + canvas.width;
      const xOffset = canvas.width - (elapsed * speed) % totalWidth;

      ctx.fillText(tickerText, xOffset, tickerY + tickerHeight / 2);
      // Seamless loop offset
      if (xOffset + textWidth < canvas.width) {
        ctx.fillText(tickerText, xOffset + textWidth, tickerY + tickerHeight / 2);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    img.onload = render;
    if (clientLogoUrl) logoImg.onload = render;

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageUrl, title, copyText, clientName, clientLogoUrl, animationStyle, audioType, selectedTrack]);

  // Clean up references
  useEffect(() => {
    return () => {
      if (sequencerRef.current) sequencerRef.current.stop();
      if (customAudioRef.current) customAudioRef.current.pause();
      if (customAudioObjectUrl) URL.revokeObjectURL(customAudioObjectUrl);
    };
  }, [customAudioObjectUrl]);

  // Setup Audio Nodes dynamically
  const setupAudioRoute = (ctx: AudioContext, targetDest: AudioNode) => {
    if (audioType === "synth") {
      const seq = new SynthSequencer(ctx, targetDest, selectedTrack.id);
      sequencerRef.current = seq;
      seq.start();
    } else {
      const audio = customAudioRef.current;
      if (!audio) return;

      if (!customAudioSourceRef.current) {
        customAudioSourceRef.current = ctx.createMediaElementSource(audio);
      }
      
      customAudioSourceRef.current.disconnect();
      customAudioSourceRef.current.connect(targetDest);

      audio.currentTime = 0;
      audio.loop = true;
      audio.play().catch(e => console.error("Fallo al reproducir audio personalizado:", e));
    }
  };

  // Toggle preview playback
  const handlePlayToggle = async () => {
    if (isPlaying) {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
        sequencerRef.current = null;
      }
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      setupAudioRoute(audioCtx, audioCtx.destination);
    }
  };

  // Sync track change
  const handleTrackChange = (trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    setSelectedTrack(track);
    
    if (isPlaying) {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
        sequencerRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  // File upload change
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (customAudioObjectUrl) {
      URL.revokeObjectURL(customAudioObjectUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setCustomAudioObjectUrl(objUrl);
    setAudioType("file");

    if (isPlaying) {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
        sequencerRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  // Handle URL change
  const handleAudioUrlApply = () => {
    if (!customAudioUrl.trim()) return;
    setAudioType("url");
    if (isPlaying) {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
        sequencerRef.current = null;
      }
      setIsPlaying(false);
    }
    alert("Audio por enlace cargado correctamente. 🔗");
  };

  // Recording Spot logic
  const handleStartRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }

    setRecordingError(null);
    setVideoBlob(null);
    setSuccess(false);
    setIsRecording(true);
    setRecordingSeconds(0);

    try {
      const canvasStream = canvas.captureStream(30);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const dest = audioCtx.createMediaStreamDestination();
      const splitNode = audioCtx.createGain();
      splitNode.gain.value = 1.0;
      splitNode.connect(dest);
      splitNode.connect(audioCtx.destination); // Play to speaker

      setupAudioRoute(audioCtx, splitNode);
      setIsPlaying(true);

      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      dest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

      const options = { mimeType: "video/webm;codecs=vp9" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(combinedStream, options);
      } catch (e) {
        recorder = new MediaRecorder(combinedStream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(finalBlob);
        setIsRecording(false);
        setIsPlaying(false);
        
        if (sequencerRef.current) {
          sequencerRef.current.stop();
          sequencerRef.current = null;
        }
        if (customAudioRef.current) {
          customAudioRef.current.pause();
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        
        if (elapsed >= durationLimit) {
          clearInterval(interval);
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }
      }, 1000);

    } catch (err: any) {
      console.error("Recording error:", err);
      setRecordingError(`Error al grabar: ${err.message || "Fallo en audio."}`);
      setIsRecording(false);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Spot_${clientName.replace(/\s+/g, "_")}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadToCampaign = async () => {
    if (!videoBlob) return;
    setUploading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const fileName = `spots/spot_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
      
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, videoBlob, {
          contentType: "video/webm",
          cacheControl: "3600",
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(fileName);
      onUploadFinished(publicUrlData.publicUrl);
      setSuccess(true);
    } catch (err: any) {
      alert(`Error al subir el video a Supabase: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111622] border border-white/10 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 relative shadow-[0_0_50px_rgba(168,85,247,0.15)] max-h-[90vh] overflow-y-auto font-sans text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Custom audio player (off-screen) */}
        <audio
          ref={customAudioRef}
          src={audioType === "file" ? (customAudioObjectUrl || "") : customAudioUrl}
          crossOrigin="anonymous"
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Film className="text-purple-400 w-5 h-5" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Creador de Spot de Video</h3>
        </div>

        {/* Info card */}
        <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
          <p>
            El spot muestra la imagen completa sin obstrucciones. El copy se desliza de forma elegante en una marquesina informativa abajo, y el título principal cuenta con trazo grueso para una excelente lectura.
          </p>
        </div>

        {/* Main Canvas preview */}
        <div className="flex justify-center w-full">
          <div className="relative aspect-video w-full max-w-[480px] rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full h-full object-contain"
            />
            {isRecording && (
              <div className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse tracking-wider">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                GRABANDO: {recordingSeconds}s / {durationLimit}s
              </div>
            )}
          </div>
        </div>

        {/* Controls Layout Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Column 1: Audio Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wide flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Configurar Audio del Spot
            </label>

            {/* Audio Mode Tabs */}
            <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-lg text-[10px] font-bold uppercase">
              <button
                type="button"
                onClick={() => setAudioType("synth")}
                className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${audioType === "synth" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Sintetizador
              </button>
              <button
                type="button"
                onClick={() => setAudioType("file")}
                className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${audioType === "file" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Subir MP3
              </button>
              <button
                type="button"
                onClick={() => setAudioType("url")}
                className={`flex-1 py-1.5 rounded transition-all cursor-pointer ${audioType === "url" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Pegar Link
              </button>
            </div>

            {/* Tab: Synth */}
            {audioType === "synth" && (
              <div className="space-y-1.5 animate-fade-in">
                {MUSIC_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    disabled={isRecording}
                    onClick={() => handleTrackChange(track.id)}
                    className={`w-full text-left text-[11px] px-3 py-2 rounded-lg border font-bold transition-all cursor-pointer ${
                      selectedTrack.id === track.id
                        ? "bg-purple-600/20 border-purple-500 text-white shadow-md"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            )}

            {/* Tab: Upload File */}
            {audioType === "file" && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-[10px] text-gray-400">Sube una canción local (MP3 o WAV) recomendada por tu cliente:</p>
                <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-purple-500 bg-white/5 hover:bg-white/10 rounded-lg p-3 text-xs text-gray-300 font-bold transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-400" />
                  {customAudioObjectUrl ? "Archivo Cargado Correctamente" : "Seleccionar Archivo de Música"}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Tab: URL Link */}
            {audioType === "url" && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-[10px] text-gray-400">Pega un enlace directo a un archivo de audio streaming:</p>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={customAudioUrl}
                    onChange={(e) => setCustomAudioUrl(e.target.value)}
                    placeholder="https://ejemplo.com/musica.mp3"
                    className="flex-grow bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAudioUrlApply}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cargar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Animation & Actions */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wide flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Animación del Fondo
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ANIMATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    disabled={isRecording}
                    onClick={() => setAnimationStyle(style.id)}
                    className={`text-[10px] px-2 py-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      animationStyle === style.id
                        ? "bg-indigo-600/25 border-indigo-500 text-white shadow-md"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions block */}
            <div className="space-y-2 pt-4">
              {recordingError && (
                <p className="text-red-400 text-xs font-bold text-center">{recordingError}</p>
              )}

              {/* Play & Record Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePlayToggle}
                  disabled={isRecording}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 text-purple-400" />}
                  {isPlaying ? "Detener" : "Preescuchar"}
                </button>

                <button
                  onClick={handleStartRecording}
                  disabled={isRecording}
                  className={`flex-1 text-white py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                    isRecording 
                      ? "bg-red-700 cursor-not-allowed" 
                      : "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/15"
                  }`}
                >
                  <Film className="w-4 h-4" />
                  {isRecording ? "Grabando..." : "Grabar Spot"}
                </button>
              </div>

              {/* Save & Download Options */}
              {videoBlob && !isRecording && (
                <div className="flex gap-2 animate-slide-up">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-indigo-600/30 hover:bg-indigo-600/40 text-white border border-indigo-500/30 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Spot
                  </button>

                  <button
                    onClick={handleUploadToCampaign}
                    disabled={uploading || success}
                    className={`flex-1 text-black font-black py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      success
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent-hover)]"
                    }`}
                  >
                    {success ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                    {uploading ? "Subiendo..." : success ? "Vinculado con éxito" : "Vincular a Campaña"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* success banner */}
        {success && (
          <div className="bg-green-500/15 border border-green-500/25 p-3 rounded-xl text-center text-xs text-green-300 font-bold animate-fade-in flex items-center justify-center gap-2 font-sans">
            <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
            ¡El video ha sido subido y vinculado a tu formulario! Puedes guardar la campaña ahora.
          </div>
        )}

      </div>
    </div>
  );
}
