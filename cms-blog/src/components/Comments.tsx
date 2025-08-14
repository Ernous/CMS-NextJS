'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, User } from 'lucide-react';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  likes: string[];
  replies: Comment[];
  createdAt: string;
}

interface CommentsProps {
  postSlug: string;
}

export default function Comments({ postSlug }: CommentsProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postSlug]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      alert('Для комментирования необходимо войти в систему');
      return;
    }

    if (!newComment.trim()) {
      alert('Введите текст комментария');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        await loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при создании комментария');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Ошибка при создании комментария');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!user || !token) {
      alert('Для ответа необходимо войти в систему');
      return;
    }

    if (!replyContent.trim()) {
      alert('Введите текст ответа');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: replyContent,
          parentCommentId 
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setShowReplyForm(null);
        await loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при создании ответа');
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Ошибка при создании ответа');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user || !token) {
      alert('Для лайка необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при обработке лайка');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      alert('Ошибка при обработке лайка');
    }
  };

  const hasUserLiked = (likes: string[]): boolean => {
    if (!user) return false;
    return likes.includes(user.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment._id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-gray-900">
                {comment.author.username}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{comment.content}</p>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeComment(comment._id)}
                className={`flex items-center space-x-1 text-sm transition-colors ${
                  hasUserLiked(comment.likes)
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-red-600'
                }`}
              >
                <Heart size={16} className={hasUserLiked(comment.likes) ? 'fill-current' : ''} />
                <span>{comment.likes.length}</span>
              </button>
              
              {!isReply && (
                <button
                  onClick={() => setShowReplyForm(showReplyForm === comment._id ? null : comment._id)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Ответить</span>
                </button>
              )}
            </div>
            
            {/* Форма ответа */}
            {showReplyForm === comment._id && (
              <div className="mt-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Написать ответ..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {replyContent.length}/1000
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowReplyForm(null);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment._id)}
                      disabled={loading || !replyContent.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Отправка...' : 'Ответить'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ответы на комментарий */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Форма создания комментария */}
      {user ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Оставить комментарий
          </h3>
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">
                {newComment.length}/1000
              </span>
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            Для комментирования необходимо{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
              войти в систему
            </a>
          </p>
        </div>
      )}

      {/* Список комментариев */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Комментарии ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Пока нет комментариев. Будьте первым!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}