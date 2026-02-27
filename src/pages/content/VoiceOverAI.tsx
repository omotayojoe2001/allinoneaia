import { useState, useEffect, useRef } from 'react';
import { Mic, Download, Play, Pause, ArrowLeft, Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { elevenlabsAPI } from '@/lib/elevenlabs-api';
import { supabase } from '@/lib/supabase';

const VoiceOverAI = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voiceList = await elevenlabsAPI.listVoices();
      setVoices(voiceList);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const generateVoice = async () => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter text', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const blobUrl = await elevenlabsAPI.generateVoice(text, { voiceId: selectedVoice });
      setAudioUrl(blobUrl);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch the blob and upload to Supabase storage
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const fileName = `voiceover-${Date.now()}.mp3`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('generated-media')
          .upload(fileName, blob, { contentType: 'audio/mpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('generated-media')
          .getPublicUrl(fileName);

        await supabase.from('generated_media').insert({
          user_id: user.id,
          type: 'audio',
          prompt: text.substring(0, 200),
          file_url: publicUrl,
          file_path: fileName
        });
      }

      toast({ title: 'Voice generated successfully' });
      setTimeout(() => navigate('/content/voiceover/library'), 1500);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => navigate('/content/voiceover/library')}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <Library className="w-4 h-4" /> View Library
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Mic className="w-6 h-6" /> VoiceOver AI
        </h1>

        <div className="glass-card rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Select Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-3 border rounded-lg bg-background mb-4"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-2">Text to Speech</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full h-48 p-4 border rounded-lg bg-background resize-none mb-4"
            maxLength={5000}
          />
          <div className="text-xs text-muted-foreground mb-4">{text.length}/5000 characters (10k free/month)</div>

          <button
            onClick={generateVoice}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Voice'}
          </button>
        </div>

        {audioUrl && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="font-semibold mb-4">Generated Audio</h3>
            <audio
              ref={(el) => {
                audioRef.current = el;
                if (el) el.onended = () => setPlaying(false);
              }}
              src={audioUrl}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="bg-primary text-primary-foreground p-3 rounded-full"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <a
                href={audioUrl}
                download
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceOverAI;
