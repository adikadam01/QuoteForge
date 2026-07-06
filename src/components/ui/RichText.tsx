import React, { useRef } from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// --- Types ---
interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    id?: string;
}

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

// --- Helpers ---
const insertMarkdown = (
    textarea: HTMLTextAreaElement,
    prefix: string,
    suffix: string
): string => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    return `${before}${prefix}${selection}${suffix}${after}`;
};

// --- Components ---

export function RichEditor({ value, onChange, placeholder, className, rows = 3, id }: RichEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFormat = (format: 'bold' | 'italic' | 'list') => {
        if (!textareaRef.current) return;

        let newValue = value;
        const textarea = textareaRef.current;

        switch (format) {
            case 'bold':
                newValue = insertMarkdown(textarea, '**', '**');
                break;
            case 'italic':
                newValue = insertMarkdown(textarea, '*', '*');
                break;
            case 'list':
                // Check if we act on a selection or just current line
                newValue = insertMarkdown(textarea, '- ', '');
                break;
        }

        onChange(newValue);
        textarea.focus();
    };

    return (
        <div className={cn("border rounded-md focus-within:ring-1 focus-within:ring-ring", className)}>
            <div className="flex items-center gap-1 p-1 border-b bg-muted/20">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleFormat('bold')}
                    title="Bold"
                >
                    <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleFormat('italic')}
                    title="Italic"
                >
                    <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleFormat('list')}
                    title="Bullet List"
                >
                    <List className="h-3.5 w-3.5" />
                </Button>
            </div>
            <Textarea
                ref={textareaRef}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="border-0 focus-visible:ring-0 shadow-none rounded-t-none resize-y min-h-[80px]"
                rows={rows}
            />
        </div>
    );
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
    if (!content) return null;

    // Simple regex parser for display
    // 1. Split by newlines to handle paragraphs/lists
    // 2. Parse bold (**text**) and italic (*text*) inline
    const lines = content.split('\n');

    return (
        <div className={cn("text-sm space-y-1", className)}>
            {lines.map((line, i) => {
                // Handle List Items
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={i} className="flex gap-2 pl-2">
                            <span className="text-zinc-400">•</span>
                            <span>{parseInlineStyles(line.replace(/^- /, ''))}</span>
                        </div>
                    );
                }

                // Handle Empty Lines (paragraphs)
                if (!line.trim()) {
                    return <div key={i} className="h-2" />;
                }

                // Standard Line
                return <div key={i}>{parseInlineStyles(line)}</div>;
            })}
        </div>
    );
}

function parseInlineStyles(text: string): React.ReactNode[] {
    // Regex to split by bold (**...**) or italic (*...*)
    // Capturing groups allow us to keep the delimiters to know what matched
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
    });
}
