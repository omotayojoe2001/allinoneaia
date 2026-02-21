import { useState, useEffect } from 'react';
import { Bell, Plus, Settings, Calendar, AlertCircle, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  category: string;
  title: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
}

interface ReminderSettings {
  category: string;
  enabled: boolean;
  advance_minutes: number;
  repeat_count: number;
  repeat_interval_minutes: number;
  send_email: boolean;
  send_whatsapp: boolean;
  send_push: boolean;
}

const RemindersPage = () => {
  const [tab, setTab] = useState<'upcoming' | 'overdue' | 'past' | 'calendar'>('upcoming');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [settings, setSettings] = useState<ReminderSettings[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadReminders();
    loadSettings();
  }, [tab]);

  const loadReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('reminders').select('*').eq('user_id', user.id);

    if (tab === 'upcoming') {
      query = query.eq('status', 'pending').gte('due_date', new Date().toISOString());
    } else if (tab === 'overdue') {
      query = query.eq('status', 'pending').lt('due_date', new Date().toISOString());
    } else if (tab === 'past') {
      query = query.in('status', ['completed', 'cancelled']);
    } else if (tab === 'calendar') {
      // Load all pending reminders for calendar view
      query = query.eq('status', 'pending');
    }

    const { data } = await query.order('due_date', { ascending: true });
    if (data) setReminders(data);
  };

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('reminder_settings').select('*').eq('user_id', user.id);
    if (data) setSettings(data);
  };

  const createReminder = async (formData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reminder created' });
      setShowCreate(false);
      loadReminders();
    }
  };

  const updateReminder = async (id: string, status: string) => {
    await supabase.from('reminders').update({ status }).eq('id', id);
    loadReminders();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id);
    loadReminders();
  };

  const updateSettings = async (category: string, updates: Partial<ReminderSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('reminder_settings').upsert({
      user_id: user.id,
      category,
      ...updates,
    });

    loadSettings();
    toast({ title: 'Settings updated' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `In ${days} days`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" /> Reminders
            </h1>
            <p className="text-sm text-muted-foreground">Manage all your reminders in one place</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Reminder
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button onClick={() => setTab('upcoming')} className={`pb-2 px-1 ${tab === 'upcoming' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            Upcoming
          </button>
          <button onClick={() => setTab('overdue')} className={`pb-2 px-1 ${tab === 'overdue' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            Overdue
          </button>
          <button onClick={() => setTab('past')} className={`pb-2 px-1 ${tab === 'past' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            Past
          </button>
          <button onClick={() => setTab('calendar')} className={`pb-2 px-1 flex items-center gap-1 ${tab === 'calendar' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            <Calendar className="w-4 h-4" /> Calendar
          </button>
        </div>

        {/* Calendar View */}
        {tab === 'calendar' ? (
          <CalendarView reminders={reminders} onReminderClick={(r) => { setSelectedReminder(r); setShowDetails(true); }} />
        ) : (
          /* Reminders List */
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No {tab} reminders</p>
              </div>
            ) : (
              reminders.map(reminder => (
                <div key={reminder.id} className="glass-card rounded-lg p-4 flex items-start justify-between cursor-pointer hover:bg-secondary/50" onClick={() => { setSelectedReminder(reminder); setShowDetails(true); }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {reminder.category}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{reminder.title}</h3>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(reminder.due_date)} • {new Date(reminder.due_date).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {reminder.status === 'pending' && (
                      <button onClick={() => updateReminder(reminder.id, 'completed')} className="text-green-500 hover:bg-green-500/10 p-2 rounded">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteReminder(reminder.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && <CreateReminderModal onClose={() => setShowCreate(false)} onCreate={createReminder} />}

        {/* Details Modal */}
        {showDetails && selectedReminder && (
          <ReminderDetailsModal 
            reminder={selectedReminder} 
            onClose={() => { setShowDetails(false); setSelectedReminder(null); }}
            onComplete={() => { updateReminder(selectedReminder.id, 'completed'); setShowDetails(false); }}
            onDelete={() => { deleteReminder(selectedReminder.id); setShowDetails(false); }}
          />
        )}

        {/* Settings Modal */}
        {showSettings && <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onUpdate={updateSettings} />}
      </div>
    </div>
  );
};

const CalendarView = ({ reminders, onReminderClick }: { reminders: Reminder[]; onReminderClick: (reminder: Reminder) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  
  const getRemindersForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return reminders.filter(r => r.due_date.startsWith(dateStr));
  };
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="px-3 py-1 bg-secondary rounded hover:bg-secondary/80">&larr;</button>
        <h2 className="text-lg font-semibold">{monthNames[month]} {year}</h2>
        <button onClick={nextMonth} className="px-3 py-1 bg-secondary rounded hover:bg-secondary/80">&rarr;</button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
        ))}
        
        {days.map((day, i) => {
          const dayReminders = day ? getRemindersForDay(day) : [];
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          
          return (
            <div key={i} className={`min-h-24 border rounded-lg p-2 ${
              !day ? 'bg-secondary/20' : isToday ? 'border-primary bg-primary/5' : 'bg-card'
            }`}>
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>{day}</div>
                  <div className="space-y-1">
                    {dayReminders.map(r => (
                      <div 
                        key={r.id} 
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                          r.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                          r.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          r.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`} 
                        title={r.title}
                        onClick={() => onReminderClick(r)}
                      >
                        {r.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReminderDetailsModal = ({ reminder, onClose, onComplete, onDelete }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reminder Details</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${
                reminder.priority === 'urgent' ? 'text-red-500' :
                reminder.priority === 'high' ? 'text-orange-500' :
                reminder.priority === 'medium' ? 'text-yellow-500' :
                'text-blue-500'
              }`}>
                {reminder.priority.toUpperCase()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {reminder.category}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{reminder.title}</h3>
            {reminder.description && (
              <p className="text-muted-foreground">{reminder.description}</p>
            )}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Due Date:</span>
              <span>{new Date(reminder.due_date).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Status:</span>
              <span className="capitalize">{reminder.status}</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            {reminder.status === 'pending' && (
              <button onClick={onComplete} className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Mark Complete
              </button>
            )}
            <button onClick={onDelete} className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateReminderModal = ({ onClose, onCreate }: any) => {
  const [formData, setFormData] = useState({
    category: 'custom',
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Reminder</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded bg-background">
              <option value="custom">Custom</option>
              <option value="invoice">Invoice</option>
              <option value="appointment">Appointment</option>
              <option value="stock">Stock</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded bg-background" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded bg-background h-20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date & Time</label>
            <input type="datetime-local" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full p-2 border rounded bg-background" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full p-2 border rounded bg-background">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsModal = ({ settings, onClose, onUpdate }: any) => {
  const categories = ['invoice', 'appointment', 'stock', 'task', 'automation', 'content', 'social'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reminder Settings</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {categories.map(category => {
            const setting = settings.find((s: any) => s.category === category) || {};
            return (
              <div key={category} className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 capitalize">{category} Reminders</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={setting.enabled ?? true} onChange={(e) => onUpdate(category, { enabled: e.target.checked })} />
                    Enabled
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={setting.send_email ?? true} onChange={(e) => onUpdate(category, { send_email: e.target.checked })} />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={setting.send_push ?? true} onChange={(e) => onUpdate(category, { send_push: e.target.checked })} />
                    Push
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={setting.send_whatsapp ?? false} onChange={(e) => onUpdate(category, { send_whatsapp: e.target.checked })} />
                    WhatsApp
                  </label>
                  <div className="col-span-2">
                    <label className="block text-xs text-muted-foreground mb-1">Remind before (minutes)</label>
                    <input type="number" value={setting.advance_minutes ?? 60} onChange={(e) => onUpdate(category, { advance_minutes: parseInt(e.target.value) })} className="w-full p-2 border rounded bg-background" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
