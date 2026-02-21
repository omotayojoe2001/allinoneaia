import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const VoiceoverLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [voiceovers, setVoiceovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoiceovers();
  }, []);

  const loadVoiceovers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('generated_media')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'audio')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoiceovers(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading voiceovers', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      setPlayingId(id);
    }
  };

  const deleteVoiceover = async (id: string) => {
    if (!confirm('Delete this voiceover?')) return;
    
    try {
      const { error } = await supabase.from('generated_media').delete().eq('id', id);
      if (error) throw error;
      setVoiceovers(voiceovers.filter(v => v.id !== id));
      toast({ title: 'Voiceover deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">My Voiceovers</h1>

        <audio
          ref={audioRef}
          onEnded={() => setPlayingId(null)}
          className="hidden"
        />

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : voiceovers.length === 0 ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">No voiceovers yet</p>
            <button
              onClick={() => navigate('/content/voiceover')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            >
              Generate Your First Voiceover
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {voiceovers.map((vo) => (
              <div key={vo.id} className="glass-card rounded-lg p-4 flex items-center gap-4">
                <button
                  onClick={() => togglePlay(vo.id, vo.file_url)}
                  className="bg-primary text-primary-foreground p-3 rounded-full flex-shrink-0"
                >
                  {playingId === vo.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{vo.prompt}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(vo.created_at).toLocaleDateString()} at {new Date(vo.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={vo.file_url}
                    download
                    className="p-2 hover:bg-secondary rounded-lg"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => deleteVoiceover(vo.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceoverLibrary;
