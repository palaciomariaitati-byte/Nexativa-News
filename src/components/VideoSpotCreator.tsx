/* src/components/VideoSpotCreator.tsx */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Download, UploadCloud, X, Film, Volume2, Info, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface VideoSpotCreatorProps {
  imageUrl: string;
  title: string;
  copyText: string;
  clientName: string;
  onUploadFinished: (url: string) => void;
  onClose: () => void;
}

const MUSIC_TRACKS = [
  {
    id: "motivador",
    name: "Motivador & Tecnológico 🎶",
  },
  {
    id: "alegre",
    name: "Alegre & Comercial 📈",
  },
  {
    id: "acustico",
    name: "Acústico Relajante 🍃",
  },
];

// Procedural Audio Synthesizer Sequencer to bypass CORS and load times
class SynthSequencer {
  private ctx: AudioContext;
  private dest: AudioNode;
  private type: string;
  private intervalId: any = null;
  private step = 0;

  constructor(ctx: AudioContext, dest: AudioNode, type: string) {
    this.ctx = ctx;
    this.dest = dest;
    this.type = type;
  }

  start() {
    const tempo = this.type === "acustico" ? 75 : this.type === "alegre" ? 105 : 125;
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

    // 1. Kick/Drum Beat (except for acoustic tracks)
    if (this.type !== "acustico" && step % 4 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
      
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      
      osc.connect(gain);
      gain.connect(dest);
      
      osc.start(time);
      osc.stop(time + 0.15);
    }

    // 2. Chords / Melodies
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

    // Play bass note on step 0 and 8
    if (step % 8 === 0) {
      const bassFreq = currentChord[0] / 2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(bassFreq, time);
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(time);
      osc.stop(time + 1.0);
    }

    // Play melody arpeggios
    if (this.type === "acustico") {
      if (step % 2 === 0) {
        const note = currentChord[step % currentChord.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.6);
      }
    } else {
      if (step % 2 !== 0 && Math.random() > 0.4) {
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
        
        gain.gain.setValueAtTime(0.02, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.3);
      }
    }
  }
}

export default function VideoSpotCreator({
  imageUrl,
  title,
  copyText,
  clientName,
  onUploadFinished,
  onClose,
}: VideoSpotCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sequencerRef = useRef<SynthSequencer | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [selectedTrack, setSelectedTrack] = useState(MUSIC_TRACKS[0]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const durationLimit = 10; // Spot duration: 10 seconds

  // Initialize and run canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl || "/banner-nexativa.jpg";

    let startTime = Date.now();

    const render = () => {
      if (!ctx || !canvas) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed % durationLimit) / durationLimit; // 0 to 1 loop

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background image with Ken Burns effect (zoom & pan)
      if (img.complete && img.naturalWidth > 0) {
        const scale = 1 + progress * 0.15; // zoom from 1.0 to 1.15
        const panX = -progress * 25;
        const panY = -progress * 15;

        ctx.save();
        ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Fallback solid gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#1e1b4b");
        grad.addColorStop(1, "#311042");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw dark overlay gradient at the bottom for readability
      const shadowGrad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
      shadowGrad.addColorStop(0.5, "rgba(0,0,0,0.6)");
      shadowGrad.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

      // Draw top header brand ribbon
      ctx.fillStyle = "rgba(212, 175, 55, 0.9)"; // Gold brand color
      ctx.fillRect(0, 0, canvas.width, 40);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${clientName.toUpperCase()} • SPOT PUBLICITARIO`, canvas.width / 2, 25);

      // DRAW TRANSPARENT DARK CONTAINER BOX BEHIND THE TEXT BLOCK
      // This prevents the background image details from clashing with the text readability.
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.beginPath();
      // Y: 210, Height: 138 -> Spans from Y=210 to Y=348 (leaves 12px padding at the bottom of the canvas)
      ctx.roundRect?.(20, canvas.height - 150, canvas.width - 40, 138, 16);
      ctx.fill();

      // Draw Client Brand / Headline text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      const displayTitle = title.length > 35 ? title.substring(0, 35) + "..." : title;
      ctx.fillText(displayTitle, canvas.width / 2, canvas.height - 110);

      // Draw advertising copy / slogan
      ctx.fillStyle = "#d4af37"; // Gold text accent
      ctx.font = "bold 14px sans-serif";
      const cleanCopy = copyText.replace(/<[^>]+>/g, "").trim();
      const displayCopy = cleanCopy.length > 55 ? cleanCopy.substring(0, 55) + "..." : cleanCopy;
      ctx.fillText(displayCopy, canvas.width / 2, canvas.height - 75);

      // Draw CTA Badge
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      
      const badgeWidth = 190;
      const badgeHeight = 30;
      const badgeX = canvas.width / 2 - badgeWidth / 2;
      const badgeY = canvas.height - 48;
      
      ctx.beginPath();
      ctx.roundRect?.(badgeX, badgeY, badgeWidth, badgeHeight, 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();

      // CTA Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11px sans-serif";
      ctx.fillText("¡CONSULTAR AHORA! 📲", canvas.width / 2, canvas.height - 29);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    img.onload = () => {
      if (!animationFrameRef.current) {
        render();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageUrl, title, copyText, clientName]);

  // Clean up audio context & sequencer on unmount
  useEffect(() => {
    return () => {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
      }
    };
  }, []);

  // Handle Play/Stop preview
  const handlePlayToggle = async () => {
    if (isPlaying) {
      if (sequencerRef.current) {
        sequencerRef.current.stop();
        sequencerRef.current = null;
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
      
      // Connect to speakers directly
      const seq = new SynthSequencer(audioCtx, audioCtx.destination, selectedTrack.id);
      sequencerRef.current = seq;
      seq.start();
    }
  };

  // Sync music track change
  const handleTrackChange = (trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    
    setSelectedTrack(track);
    
    // Stop active preview
    if (isPlaying && sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
      setIsPlaying(false);
    }
  };

  // Recording Spot logic
  const handleStartRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stop active preview if playing
    if (sequencerRef.current) {
      sequencerRef.current.stop();
      sequencerRef.current = null;
    }

    setRecordingError(null);
    setVideoBlob(null);
    setSuccess(false);
    setIsRecording(true);
    setRecordingSeconds(0);

    try {
      // Capture canvas video track (30 fps)
      const canvasStream = canvas.captureStream(30);

      // Set up Audio Mixing via Web Audio API
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // Re-route synth sound to both stream destination and speakers
      const dest = audioCtx.createMediaStreamDestination();
      
      const splitNode = audioCtx.createGain();
      splitNode.gain.value = 1.0;
      splitNode.connect(dest);
      splitNode.connect(audioCtx.destination); // Direct audio to device speaker as well

      // Start the sequencer
      const seq = new SynthSequencer(audioCtx, splitNode, selectedTrack.id);
      sequencerRef.current = seq;
      seq.start();
      setIsPlaying(true);

      // Combine video and audio tracks
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      dest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

      // Set up MediaRecorder
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
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      // Setup countdown interval
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

  // Download locally
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

  // Auto-upload spot video to Supabase and assign to form
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
      <div className="bg-[#111622] border border-white/10 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 relative shadow-[0_0_50px_rgba(168,85,247,0.15)] max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Film className="text-purple-400 w-5 h-5" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Creador de Spot de Video</h3>
        </div>

        {/* Info card */}
        <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
          <p>
            Generaremos un video de 10 segundos animando la imagen promocional con efectos de cámara y superposición del copy de venta. El audio es sintetizado en tiempo real en tu navegador para evitar errores y retrasos.
          </p>
        </div>

        {/* Main Canvas preview */}
        <div className="flex justify-center w-full">
          <div className="relative aspect-video w-full max-w-[500px] rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
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

        {/* Controls Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Audio selection list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-brand-accent)] uppercase tracking-wide flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Estilo de Música (Sintetizador)
            </label>
            <div className="space-y-1.5">
              {MUSIC_TRACKS.map((track) => (
                <button
                  key={track.id}
                  disabled={isRecording}
                  onClick={() => handleTrackChange(track.id)}
                  className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg border font-bold transition-all ${
                    selectedTrack.id === track.id
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-md"
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {track.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col justify-end gap-2.5">
            {recordingError && (
              <p className="text-red-400 text-xs font-bold mb-1 text-center">{recordingError}</p>
            )}

            {/* Preview and Record Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePlayToggle}
                disabled={isRecording}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 text-purple-400" />}
                {isPlaying ? "Detener" : "Preescuchar"}
              </button>

              <button
                onClick={handleStartRecording}
                disabled={isRecording}
                className={`flex-1 text-white py-3 rounded-xl transition-all font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                  isRecording 
                    ? "bg-red-700 cursor-not-allowed" 
                    : "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/15"
                }`}
              >
                <Film className="w-4 h-4" />
                {isRecording ? "Grabando..." : "Grabar Spot"}
              </button>
            </div>

            {/* Download and Save actions */}
            {videoBlob && !isRecording && (
              <div className="flex gap-2 animate-slide-up">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-indigo-600/30 hover:bg-indigo-600/40 text-white border border-indigo-500/30 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar Spot
                </button>

                <button
                  onClick={handleUploadToCampaign}
                  disabled={uploading || success}
                  className={`flex-1 text-black font-black py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
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

        {/* Form success banner */}
        {success && (
          <div className="bg-green-500/15 border border-green-500/25 p-3 rounded-xl text-center text-xs text-green-300 font-bold animate-fade-in flex items-center justify-center gap-2 mt-4 font-sans">
            <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
            ¡El video ha sido subido y vinculado a tu formulario! Puedes guardar la campaña ahora.
          </div>
        )}

      </div>
    </div>
  );
}
