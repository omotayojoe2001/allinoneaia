import { useState, useRef, useEffect } from 'react';
import { FileEdit, Save, ArrowLeft, Upload, File, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RichTextEditor } from '@/components/RichTextEditor';
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Document {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

const DocumentEditor = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'editor')
      .order('updated_at', { ascending: false });

    if (data) setDocuments(data);
  };

  const loadDocument = (doc: Document) => {
    setCurrentDoc(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
  };

  const newDocument = () => {
    setCurrentDoc(null);
    setTitle('');
    setContent('');
    setFileName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    try {
      let extractedText = '';
      
      if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n\n';
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }
      
      setContent(`<p>${extractedText.replace(/\n/g, '</p><p>')}</p>`);
      toast({ title: 'File uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveDocument = async () => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Document is empty', variant: 'destructive' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (currentDoc) {
        const { error } = await supabase.from('ai_documents').update({
          title: title || 'Untitled Document',
          content,
          word_count: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
          updated_at: new Date().toISOString(),
        }).eq('id', currentDoc);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_documents').insert({
          user_id: user.id,
          title: title || 'Untitled Document',
          content,
          type: 'editor',
          word_count: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        });
        if (error) throw error;
      }
      toast({ title: 'Document saved successfully' });
      loadDocuments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await supabase.from('ai_documents').delete().eq('id', id);
    if (currentDoc === id) newDocument();
    loadDocuments();
    toast({ title: 'Document deleted' });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background/50 flex flex-col">
        <div className="p-4 border-b">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={newDocument} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 justify-center">
            <FileText className="w-4 h-4" /> New Document
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {documents.map(doc => (
            <div key={doc.id} className={`p-3 rounded-lg mb-2 hover:bg-accent cursor-pointer ${currentDoc === doc.id ? 'bg-accent' : ''}`}>
              <div className="flex items-start justify-between" onClick={() => loadDocument(doc)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileEdit className="w-5 h-5" /> Document Editor
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex gap-4">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" className="hidden" />
              {fileName && <div className="flex items-center gap-2 text-sm text-muted-foreground"><File className="w-4 h-4" />{fileName}</div>}
            </div>

            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title..." className="w-full p-3 border rounded-lg bg-background text-lg font-semibold" />

            <RichTextEditor content={content} onChange={setContent} />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Word count: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length}</div>
              <button onClick={saveDocument} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
