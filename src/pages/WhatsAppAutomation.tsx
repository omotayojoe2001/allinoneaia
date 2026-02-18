import { Plus, ArrowLeft, Users, Send, X, Edit, Upload, Trash2, Zap, Power } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const WhatsAppAutomation = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'lists' | 'campaigns' | 'sequences'>('lists');
  const [lists, setLists] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingList, setEditingList] = useState<any>(null);
  const [editingSubscriber, setEditingSubscriber] = useState<any>(null);
  const [sequenceSteps, setSequenceSteps] = useState<any[]>([{ delay_value: 0, delay_unit: 'minutes', message_body: '' }]);
  const [sendType, setSendType] = useState<'list' | 'individual'>('list');
  const [timingOption, setTimingOption] = useState<'immediate' | '30min' | '1hour' | '2hour' | 'custom'>('immediate');

  useEffect(() => {
    if (user) {
      loadLists();
      loadCampaigns();
      loadSequences();
    }
  }, [user]);

  useEffect(() => {
    if (selectedList) loadSubscribers();
  }, [selectedList]);

  const loadLists = async () => {
    const { data } = await supabase.from('email_lists').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setLists(data || []);
  };

  const loadCampaigns = async () => {
    const { data } = await supabase.from('scheduled_messages').select('*, email_lists(name)').eq('user_id', user?.id).eq('send_via_whatsapp', true).order('created_at', { ascending: false });
    setCampaigns(data || []);
  };

  const loadSequences = async () => {
    const { data } = await supabase.from('email_sequences').select('*, email_lists(name), sequence_steps(count)').eq('user_id', user?.id);
    setSequences(data || []);
  };

  const loadSubscribers = async () => {
    const { data } = await supabase.from('email_subscribers').select('*').eq('list_id', selectedList.id);
    setSubscribers(data || []);
  };

  const createList = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingList) {
      await supabase.from('email_lists').update({ name: formData.get('name'), description: formData.get('description') }).eq('id', editingList.id);
    } else {
      await supabase.from('email_lists').insert({ user_id: user?.id, name: formData.get('name'), description: formData.get('description') });
    }
    setShowListModal(false);
    setEditingList(null);
    loadLists();
  };

  const deleteList = async (id: string) => {
    await supabase.from('email_lists').delete().eq('id', id);
    loadLists();
  };

  const toggleListStatus = async (list: any) => {
    const newStatus = list.status === 'active' ? 'inactive' : 'active';
    await supabase.from('email_lists').update({ status: newStatus }).eq('id', list.id);
    loadLists();
  };

  const addSubscriber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (editingSubscriber) {
      await supabase.from('email_subscribers').update({ email: formData.get('email'), first_name: formData.get('first_name'), last_name: formData.get('last_name'), phone: formData.get('phone') }).eq('id', editingSubscriber.id);
    } else {
      await supabase.from('email_subscribers').insert({ list_id: selectedList.id, email: formData.get('email'), first_name: formData.get('first_name'), last_name: formData.get('last_name'), phone: formData.get('phone') });
    }
    setShowSubscriberModal(false);
    setEditingSubscriber(null);
    loadSubscribers();
  };

  const deleteSubscriber = async (id: string) => {
    await supabase.from('email_subscribers').delete().eq('id', id);
    loadSubscribers();
  };

  const uploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedList) return;
    const text = await file.text();
    const rows = text.split('\n').slice(1);
    const subs = rows.map(row => {
      const [email, first_name, last_name, phone] = row.split(',').map(s => s.trim());
      return { list_id: selectedList.id, email, first_name, last_name, phone };
    }).filter(s => s.phone);
    await supabase.from('email_subscribers').insert(subs);
    setShowUploadModal(false);
    loadSubscribers();
  };

  const getScheduledTime = () => {
    const now = new Date();
    switch(timingOption) {
      case 'immediate': return now.toISOString();
      case '30min': return new Date(now.getTime() + 30*60000).toISOString();
      case '1hour': return new Date(now.getTime() + 60*60000).toISOString();
      case '2hour': return new Date(now.getTime() + 120*60000).toISOString();
      default: return null;
    }
  };

  const saveCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const scheduledTime = timingOption === 'custom' ? formData.get('custom_time') : getScheduledTime();
    const payload = { user_id: user?.id, target_type: sendType, send_via_whatsapp: true, message_body: formData.get('body'), scheduled_time: scheduledTime, status: 'pending', ...(sendType === 'list' ? { list_id: formData.get('list_id') } : { target_phone: formData.get('phone') }) };
    if (editingCampaign) await supabase.from('scheduled_messages').update(payload).eq('id', editingCampaign.id);
    else await supabase.from('scheduled_messages').insert(payload);
    setShowCampaignModal(false);
    setEditingCampaign(null);
    loadCampaigns();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from('scheduled_messages').delete().eq('id', id);
    loadCampaigns();
  };

  const createSequence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { data: seq } = await supabase.from('email_sequences').insert({ user_id: user?.id, list_id: formData.get('list_id'), name: formData.get('name'), status: 'active' }).select().single();
    if (seq) {
      const steps = sequenceSteps.map((step, i) => {
        const multiplier = step.delay_unit === 'minutes' ? 1 : step.delay_unit === 'hours' ? 60 : step.delay_unit === 'days' ? 1440 : step.delay_unit === 'weeks' ? 10080 : 43200;
        return { sequence_id: seq.id, step_order: i + 1, delay_minutes: step.delay_value * multiplier, email_subject: '', message_body: step.message_body };
      });
      await supabase.from('sequence_steps').insert(steps);
    }
    setShowSequenceModal(false);
    setSequenceSteps([{ delay_value: 0, delay_unit: 'minutes', message_body: '' }]);
    loadSequences();
  };

  const deleteSequence = async (id: string) => {
    await supabase.from('email_sequences').delete().eq('id', id);
    loadSequences();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/automation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {selectedList ? (
          <div>
            <button onClick={() => setSelectedList(null)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to lists
            </button>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{selectedList.name}</h1>
                <p className="text-sm text-muted-foreground">{subscribers.length} subscribers</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowUploadModal(true)} className="bg-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload CSV
                </button>
                <button onClick={() => setShowSubscriberModal(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Subscriber
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">First Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Last Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Phone</th>
                      <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-t border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 text-sm">{sub.first_name}</td>
                        <td className="px-4 py-3 text-sm">{sub.last_name}</td>
                        <td className="px-4 py-3 text-sm">{sub.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button onClick={() => { setEditingSubscriber(sub); setShowSubscriberModal(true); }} className="text-blue-400 hover:text-blue-300 mr-2">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteSubscriber(sub.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">WhatsApp Automation</h1>
                <p className="text-sm text-muted-foreground">Manage lists, campaigns, and sequences</p>
              </div>
              <button onClick={() => activeTab === 'lists' ? setShowListModal(true) : activeTab === 'campaigns' ? setShowCampaignModal(true) : setShowSequenceModal(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                <Plus className="w-4 h-4" /> New {activeTab === 'lists' ? 'List' : activeTab === 'campaigns' ? 'Campaign' : 'Sequence'}
              </button>
            </div>

            <div className="flex gap-2 mb-6 border-b border-border">
              <button onClick={() => setActiveTab('lists')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'lists' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                <Users className="w-4 h-4" /> Lists
              </button>
              <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'campaigns' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                <Send className="w-4 h-4" /> Campaigns
              </button>
              <button onClick={() => setActiveTab('sequences')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'sequences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                <Zap className="w-4 h-4" /> Sequences
              </button>
            </div>

            {activeTab === 'lists' && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lists.map((list) => (
                      <tr key={list.id} className="border-t border-border hover:bg-secondary/50 cursor-pointer">
                        <td onClick={() => setSelectedList(list)} className="px-4 py-3 text-sm font-medium">{list.name}</td>
                        <td onClick={() => setSelectedList(list)} className="px-4 py-3 text-sm text-muted-foreground">{list.description || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${list.status === 'inactive' ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                            {list.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button onClick={() => toggleListStatus(list)} className="text-yellow-400 hover:text-yellow-300 mr-2" title="Toggle Status">
                            <Power className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingList(list); setShowListModal(true); }} className="text-blue-400 hover:text-blue-300 mr-2">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteList(list.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{campaign.message_body?.substring(0, 50)}...</p>
                        <p className="text-xs text-muted-foreground">{campaign.target_type === 'list' ? campaign.email_lists?.name : campaign.target_phone} · {new Date(campaign.scheduled_time).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${campaign.status === 'sent' ? 'bg-green-500/15 text-green-400' : campaign.status === 'pending' ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>{campaign.status}</span>
                        {campaign.status === 'pending' && (
                          <>
                            <button onClick={() => { setEditingCampaign(campaign); setShowCampaignModal(true); }} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteCampaign(campaign.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sequences' && (
              <div className="space-y-3">
                {sequences.map((seq) => (
                  <div key={seq.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{seq.name}</p>
                        <p className="text-xs text-muted-foreground">{seq.email_lists?.name} · {seq.sequence_steps?.[0]?.count || 0} steps</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${seq.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>{seq.status}</span>
                        <button onClick={() => deleteSequence(seq.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showListModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowListModal(false); setEditingList(null); }}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editingList ? 'Edit' : 'Create'} List</h2>
                <button onClick={() => { setShowListModal(false); setEditingList(null); }}><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={createList} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">List Name</label>
                  <input name="name" required defaultValue={editingList?.name} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" defaultValue={editingList?.description} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" rows={3} />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">{editingList ? 'Update' : 'Create'} List</button>
              </form>
            </div>
          </div>
        )}

        {showSubscriberModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowSubscriberModal(false); setEditingSubscriber(null); }}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editingSubscriber ? 'Edit' : 'Add'} Subscriber</h2>
                <button onClick={() => { setShowSubscriberModal(false); setEditingSubscriber(null); }}><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={addSubscriber} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <input name="first_name" required defaultValue={editingSubscriber?.first_name} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <input name="last_name" defaultValue={editingSubscriber?.last_name} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone (required)</label>
                  <input name="phone" required defaultValue={editingSubscriber?.phone} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" placeholder="+1234567890" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email (optional)</label>
                  <input name="email" type="email" defaultValue={editingSubscriber?.email} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">{editingSubscriber ? 'Update' : 'Add'} Subscriber</button>
              </form>
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upload CSV</h2>
                <button onClick={() => setShowUploadModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">CSV format: phone, first_name, last_name, email</p>
                <input type="file" accept=".csv" onChange={uploadCSV} className="w-full px-3 py-2 bg-background border border-border rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {showCampaignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{editingCampaign ? 'Edit' : 'Create'} WhatsApp Campaign</h2>
                <button onClick={() => { setShowCampaignModal(false); setEditingCampaign(null); }}><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={saveCampaign} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Send To</label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setSendType('list')} className={`flex-1 py-2 rounded-lg text-sm ${sendType === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>List</button>
                    <button type="button" onClick={() => setSendType('individual')} className={`flex-1 py-2 rounded-lg text-sm ${sendType === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Individual</button>
                  </div>
                </div>
                {sendType === 'list' ? (
                  <div>
                    <label className="text-sm font-medium">Select List</label>
                    <select name="list_id" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg">
                      <option value="">Choose a list</option>
                      {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <input name="phone" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" placeholder="+1234567890" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <div className="flex gap-1 mb-2">
                    <button type="button" onClick={() => { const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{first_name}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 14, pos + 14); } }} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80">{"{{first_name}}"}</button>
                    <button type="button" onClick={() => { const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{last_name}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 13, pos + 13); } }} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80">{"{{last_name}}"}</button>
                    <button type="button" onClick={() => { const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{phone}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 9, pos + 9); } }} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80">{"{{phone}}"}</button>
                  </div>
                  <textarea name="body" required defaultValue={editingCampaign?.message_body} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" rows={5} />
                </div>
                <div>
                  <label className="text-sm font-medium">Send Timing</label>
                  <select value={timingOption} onChange={(e) => setTimingOption(e.target.value as any)} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="immediate">Send Immediately</option>
                    <option value="30min">Send after 30 minutes</option>
                    <option value="1hour">Send after 1 hour</option>
                    <option value="2hour">Send after 2 hours</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                {timingOption === 'custom' && (
                  <div>
                    <label className="text-sm font-medium">Schedule Time</label>
                    <input name="custom_time" type="datetime-local" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                  </div>
                )}
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">{editingCampaign ? 'Update' : 'Create'} Campaign</button>
              </form>
            </div>
          </div>
        )}

        {showSequenceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSequenceModal(false)}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create WhatsApp Sequence</h2>
                <button onClick={() => setShowSequenceModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={createSequence} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Sequence Name</label>
                  <input name="name" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Attach to List</label>
                  <select name="list_id" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="">Choose a list</option>
                    {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Sequence Steps</label>
                  {sequenceSteps.map((step, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Step {i + 1}</span>
                        {i > 0 && <button type="button" onClick={() => setSequenceSteps(sequenceSteps.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Delay</label>
                        <div className="flex gap-2">
                          <input type="number" value={step.delay_value || 0} onChange={(e) => {
                            const newSteps = [...sequenceSteps];
                            newSteps[i].delay_value = parseInt(e.target.value) || 0;
                            setSequenceSteps(newSteps);
                          }} className="w-24 mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                          <select value={step.delay_unit || 'minutes'} onChange={(e) => {
                            const newSteps = [...sequenceSteps];
                            newSteps[i].delay_unit = e.target.value;
                            setSequenceSteps(newSteps);
                          }} className="flex-1 mt-1 px-3 py-2 bg-background border border-border rounded-lg">
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Message</label>
                        <div className="flex gap-1 mb-1">
                          <button type="button" onClick={() => { const textarea = document.querySelectorAll('textarea')[i] as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{first_name}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 14, pos + 14); } }} className="text-xs px-1.5 py-0.5 bg-secondary rounded hover:bg-secondary/80">{"{{first_name}}"}</button>
                          <button type="button" onClick={() => { const textarea = document.querySelectorAll('textarea')[i] as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{last_name}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 13, pos + 13); } }} className="text-xs px-1.5 py-0.5 bg-secondary rounded hover:bg-secondary/80">{"{{last_name}}"}</button>
                          <button type="button" onClick={() => { const textarea = document.querySelectorAll('textarea')[i] as HTMLTextAreaElement; if (textarea) { const pos = textarea.selectionStart; textarea.value = textarea.value.substring(0, pos) + '{{phone}}' + textarea.value.substring(pos); textarea.focus(); textarea.setSelectionRange(pos + 9, pos + 9); } }} className="text-xs px-1.5 py-0.5 bg-secondary rounded hover:bg-secondary/80">{"{{phone}}"}</button>
                        </div>
                        <textarea value={step.message_body || ''} onChange={(e) => {
                          const newSteps = [...sequenceSteps];
                          newSteps[i].message_body = e.target.value;
                          setSequenceSteps(newSteps);
                        }} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" rows={3} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSequenceSteps([...sequenceSteps, { delay_value: 0, delay_unit: 'minutes', message_body: '' }])} className="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    + Add Step
                  </button>
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">Create Sequence</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppAutomation;
