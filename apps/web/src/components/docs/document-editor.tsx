'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Save,
  FileText,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { CollaborativeDocument } from '@rivest/types'

interface DocumentEditorProps {
  document: CollaborativeDocument
  onSave?: (content: Record<string, unknown>) => void
  readOnly?: boolean
}

export function DocumentEditor({ document, onSave, readOnly = false }: DocumentEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Alusta kirjutamist...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-slate-300',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-slate-100 font-semibold border border-slate-300 p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 p-2',
        },
      }),
    ],
    content: document.content || '',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none focus:outline-none min-h-[400px] px-8 py-6',
      },
    },
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editor || readOnly) return

    const interval = setInterval(() => {
      handleSave()
    }, 30000)

    return () => clearInterval(interval)
  }, [editor, readOnly])

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return

    setIsSaving(true)
    try {
      await onSave(editor.getJSON())
      setLastSaved(new Date())
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Laadin redaktorit...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-400" />
          <div>
            <h2 className="font-semibold text-slate-900">{document.title}</h2>
            {lastSaved && (
              <p className="text-xs text-slate-500">
                Salvestatud: {lastSaved.toLocaleTimeString('et-EE')}
              </p>
            )}
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvestan...' : 'Salvesta'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      {!readOnly && <DocumentToolbar editor={editor} />}

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status bar */}
      <div className="border-t border-slate-200 px-4 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
        <div>
          {editor.storage.characterCount?.characters?.() || 0} tähemärki
          {' · '}
          {editor.storage.characterCount?.words?.() || 0} sõna
        </div>
        <div>
          {document.status === 'draft' && (
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              Mustand
            </span>
          )}
          {document.status === 'published' && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Avaldatud
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Toolbar Component
function DocumentToolbar({ editor }: { editor: Editor }) {
  const addLink = useCallback(() => {
    const url = window.prompt('Sisesta URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Sisesta pildi URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  return (
    <div className="border-b border-slate-200 p-2 flex flex-wrap gap-1 bg-white sticky top-0 z-10">
      {/* Text formatting */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-2 mr-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Paks (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Kursiiv (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Läbikriipsutatud"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Kood"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-2 mr-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Pealkiri 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Pealkiri 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Pealkiri 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-2 mr-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Täpploend"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Nummerdatud loend"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Tsitaat"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horisontaaljoon"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Insert */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-2 mr-1">
        <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Lisa link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Lisa pilt">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="Lisa tabel">
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* History */}
      <div className="flex gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Võta tagasi (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Tee uuesti (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-slate-200 text-slate-900'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}
