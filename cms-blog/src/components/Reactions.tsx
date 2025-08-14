'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Emoji {
  shortcode: string;
  url: string;
  name: string;
}

interface Reaction {
  emoji: Emoji;
  count: number;
  users: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
}

interface ReactionsProps {
  postSlug: string;
}

export default function Reactions({ postSlug }: ReactionsProps) {
  const { user, token } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [availableEmojis, setAvailableEmojis] = useState<Emoji[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
    loadEmojis();
  }, [postSlug]);

  const loadReactions = async () => {
    try {
      const response = await fetch(`/api/posts/${postSlug}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const loadEmojis = async () => {
    try {
      const response = await fetch('/api/emojis');
      if (response.ok) {
        const data = await response.json();
        setAvailableEmojis(data);
      }
    } catch (error) {
      console.error('Error loading emojis:', error);
    }
  };

  const addReaction = async (emojiShortcode: string) => {
    if (!user || !token) {
      alert('Для добавления реакций необходимо войти в систему');
      return;
    }

    // Проверяем права на реакции
    if (!user.permissions.includes('react')) {
      alert('У вас нет прав на добавление реакций');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postSlug}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ emojiShortcode }),
      });

      if (response.ok) {
        await loadReactions();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при добавлении реакции');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Ошибка при добавлении реакции');
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async (emojiShortcode: string) => {
    if (!user || !token) {
      alert('Для удаления реакций необходимо войти в систему');
      return;
    }

    // Проверяем права на реакции
    if (!user.permissions.includes('react')) {
      alert('У вас нет прав на удаление реакций');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postSlug}/reactions?emoji=${emojiShortcode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadReactions();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении реакции');
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      alert('Ошибка при удалении реакции');
    } finally {
      setLoading(false);
    }
  };

  const hasUserReacted = (emojiShortcode: string): boolean => {
    if (!user) return false;
    const reaction = reactions[emojiShortcode];
    return reaction?.users.some(u => u.id === user.id) || false;
  };

  const handleReactionClick = (emojiShortcode: string) => {
    if (hasUserReacted(emojiShortcode)) {
      removeReaction(emojiShortcode);
    } else {
      addReaction(emojiShortcode);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Существующие реакции */}
      {Object.entries(reactions).map(([shortcode, reaction]) => (
        <button
          key={shortcode}
          onClick={() => handleReactionClick(shortcode)}
          disabled={loading}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full border transition-colors ${
            hasUserReacted(shortcode)
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <img
            src={reaction.emoji.url}
            alt={reaction.emoji.name}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Кнопка добавления новой реакции */}
      {user && (
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">😊</span>
            <span className="text-sm">+</span>
          </button>

          {/* Выпадающий список эмодзи */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-6 gap-1">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji.shortcode}
                    onClick={() => {
                      addReaction(emoji.shortcode);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={emoji.name}
                  >
                    <img
                      src={emoji.url}
                      alt={emoji.name}
                      className="w-6 h-6"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Обработчик клика вне выпадающего списка */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}