import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BriefingData {
  greeting: string;
  overdueInvoices: number;
  pendingTasks: number;
  staffAtRisk: number;
  staffNotSignedIn: { count: number; days: number };
  stockValue: number;
  totalRevenue: number;
  taskCompletionRate: number;
  recentTransactions: number;
}

const AIBriefingCard = ({ userId, userName }: { userId: string; userName: string }) => {
  const { formatAmount } = useCurrency();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const shouldShowBriefing = async () => {
    const lastBriefingTime = localStorage.getItem(`briefing_time_${userId}`);
    const now = Date.now();

    if (!lastBriefingTime) {
      localStorage.setItem(`briefing_time_${userId}`, now.toString());
      return true;
    }

    const timeDiff = now - parseInt(lastBriefingTime);
    const sixHoursMs = 6 * 60 * 60 * 1000;

    if (timeDiff > sixHoursMs) {
      localStorage.setItem(`briefing_time_${userId}`, now.toString());
      return true;
    }

    return false;
  };

  const generateBriefing = async () => {
    const show = await shouldShowBriefing();
    if (!show) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [invoices, tasks, stock, transactions] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', userId).catch(() => ({ data: [] })),
        supabase.from('tasks').select('*').eq('user_id', userId).catch(() => ({ data: [] })),
        supabase.from('stock').select('*').eq('user_id', userId).catch(() => ({ data: [] })),
        supabase.from('cashbook_transactions').select('*').eq('user_id', userId).gte('date', startOfMonth.toISOString()).catch(() => ({ data: [] })),
      ]);

      const overdueInvoices = invoices.data?.filter(
        (i) => i.payment_status === 'unpaid' && new Date(i.due_date) < now
      ).length || 0;

      const pendingTasks = tasks.data?.filter((t) => t.status === 'pending').length || 0;

      const completedTasks = tasks.data?.filter((t) => t.status === 'completed').length || 0;
      const taskCompletionRate = tasks.data?.length ? (completedTasks / tasks.data.length) * 100 : 0;

      const stockValue = stock.data?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;

      const totalRevenue = transactions.data?.filter((t) => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      const recentTransactions = transactions.data?.length || 0;

      setBriefing({
        greeting: getGreeting(),
        overdueInvoices,
        pendingTasks,
        staffAtRisk: 0,
        staffNotSignedIn: { count: 0, days: 7 },
        stockValue,
        totalRevenue,
        taskCompletionRate,
        recentTransactions,
      });

      setShowCard(true);
    } catch (error) {
      console.error('Error generating briefing:', error);
      setShowCard(false);
    }
  };

  useEffect(() => {
    generateBriefing();
  }, [userId]);

  const generateBriefingText = () => {
    if (!briefing) return '';

    const parts = [
      `${briefing.greeting}, ${userName}!`,
      `Since your last login, here's what's happening.`,
      `You have ${briefing.overdueInvoices} overdue invoices waiting for payment.`,
      `There are ${briefing.pendingTasks} pending tasks on your list.`,
      `Your staff at risk count is ${briefing.staffAtRisk}.`,
      `${briefing.staffNotSignedIn.count} staff members haven't signed in for more than ${briefing.staffNotSignedIn.days} days.`,
      `Your current stock value is ${formatAmount(briefing.stockValue)}.`,
      `This month, you've generated ${formatAmount(briefing.totalRevenue)} in revenue.`,
      `Your task completion rate is ${briefing.taskCompletionRate.toFixed(0)} percent.`,
      `You have ${briefing.recentTransactions} recent transactions recorded.`,
      `Stay focused and keep pushing forward!`,
    ];

    return parts.join(' ');
  };

  const briefingText = generateBriefingText();

  useEffect(() => {
    if (!showCard || dismissed || !briefingText) return;

    setIsTyping(true);
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < briefingText.length) {
        setDisplayedText(briefingText.substring(0, index + 1));
        index++;

        // Speak character by character
        if (isSpeaking && briefingText[index - 1] && briefingText[index - 1] !== ' ') {
          const utterance = new SpeechSynthesisUtterance(briefingText[index - 1]);
          utterance.rate = 1.5;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [showCard, dismissed, briefingText, isSpeaking]);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(briefingText);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!showCard || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setDismissed(true)}
      />

      {/* Card */}
      <motion.div
        className="relative w-full max-w-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-8 shadow-2xl"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
      >
        {/* Close Button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          {/* Typing Text */}
          <div className="min-h-32">
            <p className="text-lg leading-relaxed text-foreground">
              {displayedText}
              {isTyping && <span className="animate-pulse">▌</span>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSpeaking
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Speak
                </>
              )}
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="ml-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIBriefingCard;
