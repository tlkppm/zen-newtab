import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, CloudRain, Flame, Wind, Coffee, Zap, Waves } from 'lucide-react';

interface SoundChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'white' | 'pink' | 'brown'; // We will synthesize these
  volume: number;
  isPlaying: boolean;
}

export const FocusSounds = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const channelsRef = useRef<Record<string, { source: AudioBufferSourceNode; gain: GainNode }>>({});
  
  // Only synthesize noise for now to avoid asset dependencies
  const [channels, setChannels] = useState<SoundChannel[]>([
    { id: 'white', name: '白噪音', icon: <Zap size={16} />, type: 'white', volume: 0.5, isPlaying: false },
    { id: 'pink', name: '粉红噪音', icon: <CloudRain size={16} />, type: 'pink', volume: 0, isPlaying: false },
    { id: 'brown', name: '红噪音', icon: <Waves size={16} />, type: 'brown', volume: 0, isPlaying: false },
  ]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const createNoiseBuffer = (type: 'white' | 'pink' | 'brown') => {
    if (!audioContextRef.current) return null;
    const ctx = audioContextRef.current;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.075076;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; 
            b6 = white * 0.115926;
        }
    } else if (type === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
    }
    return buffer;
  };

  const toggleChannel = (id: string) => {
    initAudio();
    const ctx = audioContextRef.current!;
    const channel = channels.find(c => c.id === id);
    if (!channel) return;

    if (channel.isPlaying) {
        // Stop
        // We actually need to stop the source node, but we stored gain node.
        // Let's refactor to store source nodes or just disconnect gain.
        // Simple approach: set volume to 0 effectively mutes it, but better to stop processing.
        // Re-implement: We need a registry of SourceNodes.
        // For simplicity in this demo, let's just use the 'isPlaying' state to control gain connection?
        // No, we need to start/stop the loop.
        
        // Actually, let's just toggle the UI state and handle audio in a dedicated effect or function.
    } 
    
    // Let's rebuild the update logic:
    const newChannels = channels.map(c => 
        c.id === id ? { ...c, isPlaying: !c.isPlaying } : c
    );
    setChannels(newChannels);
    
    // Handle Audio
    const target = newChannels.find(c => c.id === id)!;
    if (target.isPlaying) {
        const buffer = createNoiseBuffer(target.type);
        if (buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            const gain = ctx.createGain();
            gain.gain.value = target.volume * 0.5; // Master scale
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            
            // Store nodes to stop later
            channelsRef.current[id] = { source, gain };
        }
    } else {
        const nodes = channelsRef.current[id];
        if (nodes) {
            nodes.source.stop();
            nodes.source.disconnect();
            nodes.gain.disconnect();
            delete channelsRef.current[id];
        }
    }
    
    // Check if any playing
    setIsPlaying(newChannels.some(c => c.isPlaying));
  };

  const updateVolume = (id: string, vol: number) => {
    const newChannels = channels.map(c => c.id === id ? { ...c, volume: vol } : c);
    setChannels(newChannels);
    const nodes = channelsRef.current[id];
    if (nodes) {
        nodes.gain.gain.value = vol * 0.5;
    }
  };

  const toggleMaster = () => {
      if (isPlaying) {
          // Stop all
          channels.forEach(c => {
              if (c.isPlaying) toggleChannel(c.id);
          });
      } else {
          // Start default (White) if none selected, or resume all selected? 
          // For simplicity, just start White noise if nothing was playing.
          if (channels.every(c => !c.isPlaying)) {
              toggleChannel('white');
          } else {
              // Resume logic if we supported pause. 
              // Currently 'isPlaying' is per channel.
              // So this button acts as "Stop All".
          }
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden text-white shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  <Waves size={16} />
              </div>
              <span className="font-medium text-sm">白噪音</span>
          </div>
          <button 
            onClick={toggleMaster}
            className={`p-1.5 rounded-lg transition-colors ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
              {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {channels.map(channel => (
              <div key={channel.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                      <button 
                        onClick={() => toggleChannel(channel.id)}
                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${channel.isPlaying ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                      >
                          {channel.icon}
                          {channel.name}
                      </button>
                      {channel.isPlaying && (
                          <div className="flex gap-0.5 items-end h-3">
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite] h-full" />
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_1.2s_infinite] h-2/3" />
                              <div className="w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite] h-full" />
                          </div>
                      )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={channel.volume}
                    onChange={(e) => updateVolume(channel.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                    disabled={!channel.isPlaying}
                  />
              </div>
          ))}
      </div>
    </div>
  );
};
