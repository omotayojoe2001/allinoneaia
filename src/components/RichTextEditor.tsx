import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Heading3 } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          editor.chain().focus().setImage({ src: reader.result as string }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-2 border-b flex flex-wrap gap-1">
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`}><Heading3 className="w-4 h-4" /></button>
        <div className="w-px bg-border mx-1" />
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('bold') ? 'bg-accent' : ''}`}><Bold className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('italic') ? 'bg-accent' : ''}`}><Italic className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('underline') ? 'bg-accent' : ''}`}><UnderlineIcon className="w-4 h-4" /></button>
        <div className="w-px bg-border mx-1" />
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}><AlignLeft className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}><AlignCenter className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded hover:bg-accent ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}><AlignRight className="w-4 h-4" /></button>
        <div className="w-px bg-border mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}><List className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded hover:bg-accent ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px bg-border mx-1" />
        <button onClick={addLink} className={`p-2 rounded hover:bg-accent ${editor.isActive('link') ? 'bg-accent' : ''}`}><LinkIcon className="w-4 h-4" /></button>
        <button onClick={addImage} className="p-2 rounded hover:bg-accent"><ImageIcon className="w-4 h-4" /></button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none" />
    </div>
  );
};
