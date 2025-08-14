'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Emoji {
  shortcode: string;
  url: string;
  name: string;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  useEffect(() => {
    // Загружаем эмодзи при монтировании компонента
    fetch('/api/emojis')
      .then(res => res.json())
      .then(data => setEmojis(data))
      .catch(err => console.error('Error loading emojis:', err));
  }, []);

  // Функция для замены кастомных эмодзи
  const processContent = (text: string): string => {
    let processedText = text;
    
    // Заменяем :shortcode: на изображения эмодзи
    emojis.forEach(emoji => {
      const regex = new RegExp(`:${emoji.shortcode}:`, 'g');
      processedText = processedText.replace(regex, `![${emoji.name}](${emoji.url})`);
    });

    return processedText;
  };

  const processedContent = processContent(content);

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Кастомные компоненты для markdown
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mb-3 text-gray-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mb-2 text-gray-900">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full h-auto rounded-lg shadow-md my-4"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}