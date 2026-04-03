import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, AlertCircle, RefreshCcw, Activity, Mic, Bot, Scan, Database, Zap, Layers, Scale, Crosshair, Eye, Info, ChevronRight, Target, Search, Dumbbell, Trophy, Zap as ZapIcon, Disc, Flag, Heart, Move, Flame, ArrowLeft, X, Play, AlertTriangle, Volume2, StopCircle, Youtube, ExternalLink, UserCheck, RotateCcw, ZoomIn, ZoomOut, Shield, Maximize2, Minimize2, Star, ThumbsUp, Hand, Lightning } from 'lucide-react';
import { analyzeMovement, analyzeVideoContent } from '../services/geminiService';
import { LiveSessionService } from '../services/liveSessionService';
import { AnalysisResult, UserStats, UserSettings } from '../types';
import { t } from '../utils/translations';

interface AnalyzerProps {
  onAnalyzeComplete: (result: AnalysisResult) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  userStats: UserStats;
  userSettings: UserSettings;
  sessionHistory: AnalysisResult[];
  onExit?: () => void;
  startWithBriefing?: boolean;
}

// --- AI COACH AVATAR ---
const AICoachAvatar: React.FC<{ level: number, isSpeaking: boolean, voiceName: string, state: 'idle' | 'listening' | 'speaking' | 'processing', emotion?: 'happy' | 'neutral' | 'concerned' }> = ({ level, isSpeaking, voiceName, state, emotion = 'neutral' }) => {
    // Normalize level (0-100)
    const visualLevel = Math.min(100, Math.max(0, level));
    const scale = 1 + (visualLevel / 200); 
    
    let ringColor = "border-primary/40";
    let glowColor = "bg-primary/20";
    if (state === 'listening') {
        ringColor = "border-accent/40";
        glowColor = "bg-accent/20";
    } else if (state === 'processing') {
        ringColor = "border-accent/40"; // Use accent for processing too, or maybe a lighter amber
        glowColor = "bg-accent/20";
    } else if (emotion === 'happy') {
        ringColor = "border-secondary/40"; // Use secondary (Emerald)
        glowColor = "bg-secondary/20";
    }

    return (
        <div className="absolute bottom-6 left-6 z-50 flex items-end gap-3 pointer-events-none transition-all duration-500">
             <div className="relative w-24 h-24 flex items-center justify-center">
                 <div 
                    className={`absolute inset-0 rounded-full blur-xl transition-all duration-100 ${glowColor}`}
                    style={{ transform: `scale(${scale * 1.3})`, opacity: isSpeaking || state === 'listening' ? 0.6 : 0.1 }}
                 ></div>
                 
                 <div className={`absolute inset-0 border-2 ${ringColor} rounded-full border-t-transparent ${isSpeaking || state === 'processing' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                 <div className={`absolute inset-2 border ${state === 'listening' ? 'border-accent/30' : 'border-gray-500/30'} rounded-full border-b-transparent ${isSpeaking || state === 'processing' ? 'animate-spin' : ''}`} style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                 
                 <div className="relative z-10 w-16 h-16 bg-black/90 border border-white/10 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                     <div className="flex items-center gap-[3px] h-8">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i}
                                className={`w-1.5 rounded-full transition-all duration-75 shadow-[0_0_10px_currentColor] ${state === 'listening' ? 'bg-accent' : state === 'processing' ? 'bg-accent' : emotion === 'happy' ? 'bg-secondary' : 'bg-primary'}`}
                                style={{ 
                                    height: (isSpeaking || state === 'listening') ? `${Math.max(15, Math.random() * visualLevel)}%` : '15%',
                                    opacity: (isSpeaking || state === 'listening') ? 1 : 0.3
                                }}
                            ></div>
                        ))}
                     </div>
                 </div>
                 
                 <div className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${state !== 'idle' ? 'bg-secondary shadow-[0_0_10px_#10b981]' : 'bg-gray-600'}`}></div>
             </div>
             
             <div className={`mb-6 transition-all duration-500 transform ${state !== 'idle' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                 <div className="bg-black/80 backdrop-blur-xl border-l-2 border-primary px-4 py-2 rounded-r-xl shadow-lg">
                     <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">AI Coach</span>
                     <span className="text-sm text-white font-black uppercase tracking-wider flex items-center gap-2">
                        {voiceName} 
                        {state === 'listening' && <span className="text-[9px] text-accent animate-pulse">• LISTENING</span>}
                        {state === 'processing' && <span className="text-[9px] text-accent animate-pulse">• THINKING</span>}
                     </span>
                 </div>
             </div>
        </div>
    );
};

const SkeletonVisualizer: React.FC<{ result: AnalysisResult, showHeatmap: boolean }> = ({ result, showHeatmap }) => {
    const joints: Record<string, { x: number, y: number }> = {
        head: { x: 50, y: 10 },
        neck: { x: 50, y: 20 },
        l_shoulder: { x: 35, y: 25 },
        r_shoulder: { x: 65, y: 25 },
        l_elbow: { x: 25, y: 45 },
        r_elbow: { x: 75, y: 45 },
        l_wrist: { x: 20, y: 65 },
        r_wrist: { x: 80, y: 65 },
        chest: { x: 50, y: 40 },
        hips: { x: 50, y: 55 },
        l_hip: { x: 40, y: 55 },
        r_hip: { x: 60, y: 55 },
        l_knee: { x: 35, y: 75 },
        r_knee: { x: 65, y: 75 },
        l_ankle: { x: 35, y: 95 },
        r_ankle: { x: 65, y: 95 },
    };

    const connections = [
        ['head', 'neck'],
        ['neck', 'chest'],
        ['neck', 'l_shoulder'], ['neck', 'r_shoulder'],
        ['l_shoulder', 'l_elbow'], ['l_elbow', 'l_wrist'],
        ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_wrist'],
        ['chest', 'hips'],
        ['hips', 'l_hip'], ['hips', 'r_hip'],
        ['l_hip', 'l_knee'], ['l_knee', 'l_ankle'],
        ['r_hip', 'r_knee'], ['r_knee', 'r_ankle']
    ];

    const getJointStatus = (jointKey: string) => {
        const checkStr = jointKey.replace('l_', 'left ').replace('r_', 'right ').replace('_', ' ');
        const error = result.errors.find(e => 
            e.joint.toLowerCase().includes(checkStr) || 
            (jointKey === 'hips' && e.joint.toLowerCase().includes('hip')) ||
            (jointKey === 'chest' && (e.joint.toLowerCase().includes('back') || e.joint.toLowerCase().includes('spine')))
        );
        if (error) return error.severity === 'High' ? 'critical' : 'warning';
        return 'optimal';
    };

    const getColor = (status: string, stress: number) => {
        if (showHeatmap && stress > 70) return '#ef4444'; // Red for high stress
        if (showHeatmap && stress > 40) return '#84cc16'; // Lime (Accent)
        switch(status) {
            case 'critical': return '#ef4444'; 
            case 'warning': return '#84cc16'; // Lime (Accent)
            case 'optimal': return '#f97316'; // Orange (Primary)
            default: return '#71717a';
        }
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-3xl border border-white/5 p-4">
            <svg viewBox="0 0 100 110" className="h-full w-auto drop-shadow-2xl">
                {connections.map(([start, end], i) => {
                    const s = joints[start];
                    const e = joints[end];
                    return (
                        <line 
                            key={i}
                            x1={s.x} y1={s.y}
                            x2={e.x} y2={e.y}
                            stroke={showHeatmap ? 'rgba(255, 255, 255, 0.2)' : 'rgba(217, 70, 239, 0.3)'}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    );
                })}

                {Object.entries(joints).map(([key, coords]) => {
                    const status = getJointStatus(key);
                    const stress = result.jointStress?.[key] || 0;
                    const color = getColor(status, stress);
                    const isAlert = status === 'critical' || status === 'warning';
                    
                    return (
                        <g key={key}>
                            {/* Heatmap Glow */}
                            {showHeatmap && stress > 30 && (
                                <circle cx={coords.x} cy={coords.y} r={stress / 5} fill={color} opacity="0.4" filter="url(#glow)" />
                            )}

                            <circle 
                                cx={coords.x} 
                                cy={coords.y} 
                                r={isAlert ? 4.5 : 3} 
                                fill={color}
                                stroke={isAlert ? 'rgba(0,0,0,0.5)' : 'none'}
                                strokeWidth="1"
                                className="transition-all duration-500"
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const Analyzer: React.FC<AnalyzerProps> = ({ onAnalyzeComplete, selectedSport, onSportChange, userStats, userSettings, sessionHistory, onExit, startWithBriefing = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStartingCameraRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mode, setMode] = useState<'live' | 'instant' | 'upload' | 'coach' | 'fixit'>('live'); 
  const [error, setError] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'overview' | 'technical' | 'biomechanics' | 'compare'>('overview');
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string, type: 'video' | 'image' } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Camera & Zoom State
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(userSettings.preferences.cameraFacingMode || 'user');
  const [zoom, setZoom] = useState(1);
  const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Audio Playback & Coach Avatar State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [coachAudioLevel, setCoachAudioLevel] = useState(0); 
  const [coachState, setCoachState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [coachEmotion, setCoachEmotion] = useState<'neutral' | 'happy' | 'concerned'>('neutral');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [showBriefing, setShowBriefing] = useState(startWithBriefing);
  const [tempSport, setTempSport] = useState(selectedSport);

  const [liveService] = useState(() => new LiveSessionService());
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Gesture State
  const [gestureDetected, setGestureDetected] = useState<string | null>(null);

  // Fix-It Mode State
  const [fixItDrill, setFixItDrill] = useState<{title: string, desc: string} | null>(null);

  useEffect(() => {
    liveService.setMuted(!userSettings.preferences.voiceFeedback);
  }, [userSettings.preferences.voiceFeedback, liveService]);

  const startCamera = async (targetMode: 'user' | 'environment', withAudio: boolean = false) => {
    if (isStartingCameraRef.current) return;
    if (stream) stream.getTracks().forEach(t => t.stop());
    isStartingCameraRef.current = true;
    
    let idealWidth = userSettings.preferences.resolution === '4K' ? 3840 : userSettings.preferences.resolution === '1080p' ? 1920 : 1280;
    let idealHeight = userSettings.preferences.resolution === '4K' ? 2160 : userSettings.preferences.resolution === '1080p' ? 1080 : 720;

    try {
      const constraints = { 
        video: { facingMode: targetMode, width: { ideal: idealWidth }, height: { ideal: idealHeight } }, 
        audio: withAudio 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setError(null);
      
      const track = mediaStream.getVideoTracks()[0];
      const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      if (caps.zoom) {
          setZoomRange({ min: caps.zoom.min, max: caps.zoom.max });
          const settings = track.getSettings() as any;
          if (settings.zoom) setZoom(settings.zoom as number);
      }
    } catch (err) {
      setError("Camera access denied.");
    } finally {
      isStartingCameraRef.current = false;
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (['live', 'instant', 'coach', 'fixit'].includes(mode)) {
      startCamera(facingMode, mode === 'coach');
    }
    setUploadedMedia(null);
    return () => {
      stopCamera();
      if (isLiveConnected) liveService.disconnect();
    };
  }, [mode, facingMode]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
  }, [stream, showBriefing]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Safety check: ensure video is ready
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        return; 
    }

    setIsAnalyzing(true);
    setResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      // In "Instant" mode, we might pass a flag or handle differently, for now leveraging same engine
      const result = await analyzeMovement(
        base64Data,
        'image/jpeg',
        selectedSport,
        'Pro', 
        userSettings.preferences.language,
        sessionHistory,
        userSettings.preferences.voiceName,
        userSettings.profile.gender
      );

      if (result.overallScore > 80) setCoachEmotion('happy');
      else if (result.injuryRiskLevel === 'High') setCoachEmotion('concerned');
      else setCoachEmotion('neutral');

      setResult(result);
      onAnalyzeComplete(result);
      
      if (userSettings.preferences.voiceFeedback && result.audioBase64) {
        playAudioFeedback(result.audioBase64);
      }
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startFixItDrill = () => {
      if (!result || result.errors.length === 0) return;
      const error = result.errors[0]; 
      setFixItDrill({
          title: `Correcting: ${error.issue}`,
          desc: error.correction
      });
      setMode('fixit');
      setResult(null); 
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
    setCoachState('idle');
  };

  const playAudioFeedback = (base64Audio: string) => {
    if (!base64Audio) return;
    stopAudio();
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const pcmData = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) channelData[i] = pcmData[i] / 32768.0;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { setIsPlayingAudio(false); setCoachState('idle'); audioSourceRef.current = null; };
      audioSourceRef.current = source;
      setIsPlayingAudio(true);
      setCoachState('speaking');
      source.start(0);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAnalyzing(true);
      setResult(null);
      setUploadedMedia({ url: URL.createObjectURL(file), type: file.type.startsWith('video') ? 'video' : 'image' });
      const reader = new FileReader();
      reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          try {
              if (file.type.startsWith('video')) {
                   const r = await analyzeVideoContent(base64, file.type, selectedSport);
                   setResult(r); onAnalyzeComplete(r); if(userSettings.preferences.voiceFeedback && r.audioBase64) playAudioFeedback(r.audioBase64);
              } else {
                   const r = await analyzeMovement(base64, file.type, selectedSport, 'Pro', userSettings.preferences.language, sessionHistory, userSettings.preferences.voiceName, userSettings.profile.gender);
                   setResult(r); onAnalyzeComplete(r); if(userSettings.preferences.voiceFeedback && r.audioBase64) playAudioFeedback(r.audioBase64);
              }
          } catch(e) { setError("Failed"); } finally { setIsAnalyzing(false); }
      };
      reader.readAsDataURL(file);
  };

  const toggleLiveCoach = async () => {
       if (isLiveConnected) { liveService.disconnect(); setIsLiveConnected(false); setCoachState('idle'); } 
       else { if (!stream) return; setIsLiveConnected(true); setCoachState('listening'); try { await liveService.connect(stream, userSettings.preferences.voiceName, ()=>{}, (l)=>setCoachAudioLevel(l), ()=>{}, ()=>{ setIsLiveConnected(false); setCoachState('idle'); }, ()=>{ setIsLiveConnected(false); setCoachState('idle'); }); } catch(e) { setIsLiveConnected(false); } }
  };

  if (showBriefing) {
      return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="max-w-4xl w-full bg-surface border border-gray-800 rounded-[32px] overflow-hidden shadow-2xl relative">
                  <div className="p-8 text-center">
                       <h3 className="text-2xl font-bold text-white mb-2">Ready to Analyze?</h3>
                       <button onClick={() => { onSportChange(tempSport); setShowBriefing(false); }} className="px-8 py-4 bg-primary text-black font-black rounded-xl mt-4">Launch Session</button>
                  </div>
              </div>
          </div>
      );
  }

  // Comparison Logic: Get last valid session
  const previousSession = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : null;

  return (
    <div className="flex flex-col h-full relative">
        <header className="h-16 border-b border-gray-800 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onExit} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
                <span className="text-sm font-bold text-white uppercase tracking-wider">{selectedSport}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg">
                <button onClick={() => setMode('live')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${mode === 'live' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>Full</button>
                <button onClick={() => setMode('instant')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${mode === 'instant' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>Instant</button>
                <button onClick={() => setMode('coach')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${mode === 'coach' ? 'bg-primary text-black' : 'text-gray-500'}`}>Coach</button>
            </div>
        </header>

        <div className="flex-1 relative flex overflow-hidden">
            <div className={`relative transition-all duration-500 ${result ? 'w-1/2' : 'w-full'} h-full bg-black flex items-center justify-center overflow-hidden`}>
                
                {mode !== 'upload' && <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-${fitMode} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} style={{ transform: `scale(${zoom}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}` }} />}
                {mode === 'upload' && uploadedMedia && (uploadedMedia.type === 'video' ? <video src={uploadedMedia.url} controls className="absolute inset-0 w-full h-full object-contain" /> : <img src={uploadedMedia.url} className="absolute inset-0 w-full h-full object-contain" />)}
                {mode === 'upload' && !uploadedMedia && <div className="text-center p-12 border-2 border-dashed border-gray-700 rounded-3xl"><Upload className="mx-auto mb-4" /><input type="file" onChange={handleFileUpload} /></div>}
                
                <canvas ref={canvasRef} className="hidden" />

                {mode === 'instant' && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-pulse z-30">
                        ⚡ Instant Mode
                    </div>
                )}

                {/* Main Capture Button */}
                {!result && (mode === 'live' || mode === 'instant') && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-30">
                        {error && <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-bold mb-2">{error}</div>}
                        <button onClick={captureAndAnalyze} disabled={isAnalyzing} className={`w-20 h-20 rounded-full border-4 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 group ${mode === 'instant' ? 'border-yellow-500/50' : ''}`}>
                            <div className={`w-16 h-16 rounded-full ${mode === 'instant' ? 'bg-yellow-500' : 'bg-white group-hover:bg-primary'} transition-colors shadow-lg`}></div>
                        </button>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{isAnalyzing ? 'Processing...' : (mode === 'instant' ? 'Quick Scan' : 'Capture')}</p>
                    </div>
                )}

                {/* AI Coach Controls */}
                {mode === 'coach' && (
                     <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
                         <button onClick={toggleLiveCoach} className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-3 transition-all ${isLiveConnected ? 'bg-red-500 text-white' : 'bg-primary text-black'}`}>
                             {isLiveConnected ? <StopCircle size={20} /> : <Mic size={20} />} {isLiveConnected ? 'End' : 'Start Coach'}
                         </button>
                     </div>
                )}

                {/* Coach Avatar */}
                {(mode === 'coach' || (userSettings.preferences.voiceFeedback && result)) && (
                    <AICoachAvatar level={coachAudioLevel} isSpeaking={coachState === 'speaking'} voiceName={userSettings.preferences.voiceName} state={coachState} emotion={coachEmotion} />
                )}

                {isAnalyzing && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div className="w-full h-1 bg-primary/50 shadow-[0_0_30px_#06b6d4] absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                        <div className="absolute center text-primary font-mono text-xl font-bold tracking-widest animate-pulse top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">ANALYZING BIOMECHANICS...</div>
                    </div>
                )}
            </div>

            {/* Results Panel */}
            {result && (
                <div className="w-1/2 h-full bg-surface border-l border-gray-800 flex flex-col animate-in slide-in-from-right duration-500">
                    <div className={`p-6 border-b border-gray-800 bg-black/20 relative overflow-hidden ${result.overallScore > 90 ? 'shadow-[inset_0_0_50px_rgba(6,182,212,0.2)]' : ''}`}>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                 <h2 className="text-4xl font-black text-white italic tracking-tighter">{result.overallScore}</h2>
                                 <p className="text-primary font-black uppercase tracking-widest text-sm mt-1">{result.scoreTitle || 'Foundation Phase'}</p>
                            </div>
                            <div className="flex gap-2">
                                 {result.errors.length > 0 && (
                                     <button onClick={startFixItDrill} className="px-4 py-2 bg-yellow-500 text-black font-black text-xs rounded-lg uppercase tracking-wider hover:bg-yellow-400 flex items-center gap-2 animate-pulse">
                                         <RefreshCcw size={14} /> Fix-It
                                     </button>
                                 )}
                                 <button onClick={() => setResult(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><RotateCcw size={20} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-800">
                        {['overview', 'technical', 'biomechanics', 'compare'].map((tab) => (
                            <button key={tab} onClick={() => setResultsTab(tab as any)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${resultsTab === tab ? 'border-b-2 border-primary text-white bg-white/5' : 'text-gray-500'}`}>{tab}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {resultsTab === 'overview' && (
                            <>
                                <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800">
                                    <h3 className="text-white font-bold flex items-center gap-2 mb-3"><Bot size={18} className="text-primary" /> Coach Feedback</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">"{result.feedback}"</p>
                                    {result.audioBase64 && <button onClick={() => isPlayingAudio ? stopAudio() : playAudioFeedback(result.audioBase64!)} className="mt-4 flex items-center gap-2 text-xs font-bold text-primary">{isPlayingAudio ? 'Stop' : 'Replay'}</button>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-surface border border-gray-800 p-4 rounded-xl">
                                         <span className="text-[10px] text-gray-500 uppercase font-bold">Risk</span>
                                         <div className={`text-xl font-black mt-1 ${result.injuryRiskLevel === 'High' ? 'text-red-500' : 'text-green-500'}`}>{result.injuryRiskLevel}</div>
                                     </div>
                                     <div className="bg-surface border border-gray-800 p-4 rounded-xl">
                                         <span className="text-[10px] text-gray-500 uppercase font-bold">Power</span>
                                         <div className="text-xl font-black text-white mt-1">{result.powerScore}</div>
                                     </div>
                                </div>
                            </>
                        )}
                        {resultsTab === 'biomechanics' && (
                            <div className="h-full flex flex-col">
                                <div className="flex justify-end mb-2">
                                    <button onClick={() => setShowHeatmap(!showHeatmap)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${showHeatmap ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                        Stress Heatmap
                                    </button>
                                </div>
                                <div className="h-64 md:h-96 w-full bg-black/50 rounded-2xl border border-gray-800 overflow-hidden relative">
                                    <SkeletonVisualizer result={result} showHeatmap={showHeatmap} />
                                </div>
                            </div>
                        )}
                        {resultsTab === 'compare' && (
                            <div className="space-y-4">
                                {previousSession ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="p-4 bg-gray-900 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase font-bold">Previous</div>
                                                <div className="text-2xl font-black text-gray-400">{previousSession.overallScore}</div>
                                            </div>
                                            <div className="p-4 bg-gray-900 rounded-xl border border-primary/30">
                                                <div className="text-xs text-primary uppercase font-bold">Current</div>
                                                <div className="text-2xl font-black text-white">{result.overallScore}</div>
                                            </div>
                                        </div>
                                        <div className="bg-surface p-4 rounded-xl border border-gray-800">
                                            <h4 className="text-sm font-bold text-white mb-2">Score Difference</h4>
                                            <div className={`text-xl font-black ${result.overallScore >= previousSession.overallScore ? 'text-green-500' : 'text-red-500'}`}>
                                                {result.overallScore >= previousSession.overallScore ? '+' : ''}{result.overallScore - previousSession.overallScore} Points
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-8 text-gray-500">No previous session found for comparison.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Analyzer;