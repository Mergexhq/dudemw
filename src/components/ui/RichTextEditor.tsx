"use client"

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link'],
        ['clean']
    ],
}

const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'align',
    'link'
]

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
            <style jsx global>{`
                .rich-text-editor .quill {
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    background: white;
                }
                
                .rich-text-editor .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                    border-radius: 0.5rem 0.5rem 0 0;
                    padding: 12px;
                }
                
                .rich-text-editor .ql-container {
                    border: none;
                    font-size: 14px;
                    min-height: 200px;
                }
                
                .rich-text-editor .ql-editor {
                    min-height: 200px;
                    padding: 16px;
                }
                
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
                
                /* Make toolbar buttons more visible */
                .rich-text-editor .ql-toolbar button {
                    margin: 0 2px;
                }
                
                .rich-text-editor .ql-toolbar button:hover,
                .rich-text-editor .ql-toolbar button.ql-active {
                    background: #e5e7eb;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    )
}
