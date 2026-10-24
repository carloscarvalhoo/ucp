'use client';
import { useEffect, useState } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
export function RichTextEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
}) {
  const [showLink, setShowLink] = useState(false),
    [link, setLink] = useState('');
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
        codeBlock: false,
        code: false,
      }),
      TableKit,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': label,
        role: 'textbox',
        'aria-multiline': 'true',
        class: 'admin-rich-content',
      },
    },
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            bullet: editor.isActive('bulletList'),
            ordered: editor.isActive('orderedList'),
          }
        : null,
  });
  useEffect(() => {
    if (editor && editor.getHTML() !== value && !editor.isFocused)
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  if (!editor) return <div className="admin-rich-loading">Carregando editor…</div>;
  function button(title: string, text: string, run: () => void, active = false) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={active ? 'active' : ''}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run}
      >
        {text}
      </button>
    );
  }
  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-toolbar" role="toolbar" aria-label="Formatação do texto">
        {button('Negrito', 'N', () => editor!.chain().focus().toggleBold().run(), state?.bold)}
        {button('Itálico', 'I', () => editor!.chain().focus().toggleItalic().run(), state?.italic)}
        {button('Parágrafo', 'Texto', () => editor!.chain().focus().setParagraph().run())}
        {button('Subtítulo', 'Subtítulo', () =>
          editor!.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
        {button(
          'Lista com marcadores',
          '• Lista',
          () => editor!.chain().focus().toggleBulletList().run(),
          state?.bullet,
        )}
        {button(
          'Lista numerada',
          '1. Lista',
          () => editor!.chain().focus().toggleOrderedList().run(),
          state?.ordered,
        )}
        {button('Inserir ou editar link', 'Link', () => {
          setLink(editor!.getAttributes('link').href || '');
          setShowLink(!showLink);
        })}
        {button('Desfazer no texto', '↶', () => editor!.chain().focus().undo().run())}
        {button('Refazer no texto', '↷', () => editor!.chain().focus().redo().run())}
      </div>
      {showLink && (
        <div className="admin-rich-link">
          <input
            aria-label="Destino do link"
            value={link}
            placeholder="https:// ou /pagina"
            onChange={(e) => setLink(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              if (link.trim())
                editor.chain().focus().extendMarkRange('link').setLink({ href: link.trim() }).run();
              else editor.chain().focus().unsetLink().run();
              setShowLink(false);
            }}
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setShowLink(false);
            }}
          >
            Remover link
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      <p className="admin-rich-hint">Escreva normalmente. Enter cria um novo parágrafo.</p>
    </div>
  );
}
