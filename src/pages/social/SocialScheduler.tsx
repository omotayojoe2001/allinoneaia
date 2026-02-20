import { useState, useEffect } from 'react';
import { Calendar, Twitter, Send, Clock, CheckCircle, XCircle, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { twitterAPI } from '@/lib/twitter-api';
import { useToast } from '@/hooks/use-toast';

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduled_time: string;
  status: string;
  post_id?: string;
  error_message?: string;
  media_urls?: string[];
}

const SocialScheduler = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_time', { ascending: false });
    
    if (data) setPosts(data);
  };

  const schedulePost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const mediaUrls = await Promise.all(mediaFiles.map(f => twitterAPI.uploadMedia(f)));

      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: user.id,
        platform: 'twitter',
        content,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        media_urls: mediaUrls
      });

      if (error) throw error;

      toast({ title: 'Post scheduled successfully' });
      setContent('');
      setScheduledTime('');
      setMediaFiles([]);
      loadPosts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const postNow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const postId = await twitterAPI.postTweet({ text: content, media: mediaFiles });

      await supabase.from('scheduled_posts').insert({
        user_id: user.id,
        platform: 'twitter',
        content,
        scheduled_time: new Date().toISOString(),
        status: 'published',
        post_id: postId
      });

      toast({ title: 'Posted successfully!' });
      setContent('');
      setMediaFiles([]);
      loadPosts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6" /> Twitter/X Scheduler
        </h1>

        <div className="glass-card rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-4">Create Post</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full p-3 border rounded-lg mb-4 min-h-[120px] bg-background"
            maxLength={280}
          />
          <div className="text-xs text-muted-foreground mb-4">{content.length}/280</div>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>Add images (up to 4)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                max={4}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 4);
                  setMediaFiles(files);
                }}
                className="hidden"
              />
            </label>
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {mediaFiles.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => setMediaFiles(mediaFiles.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mb-4">
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="flex-1 p-2 border rounded-lg bg-background"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={postNow}
              disabled={!content || loading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Post Now
            </button>
            <button
              onClick={schedulePost}
              disabled={!content || !scheduledTime || loading}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Clock className="w-4 h-4" /> Schedule
            </button>
          </div>
        </div>

        <h3 className="font-semibold mb-4">Scheduled Posts</h3>
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="glass-card rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-2">{post.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Twitter className="w-3 h-3" />
                    {new Date(post.scheduled_time).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(post.status)}
                  <span className="text-xs capitalize">{post.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default SocialScheduler;
