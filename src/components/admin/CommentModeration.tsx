'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Eye, 
  User
} from 'lucide-react';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  post: {
    _id: string;
    title: string;
    slug: string;
  };
  likes: string[];
  replies: Comment[];
  createdAt: string;
  isApproved: boolean;
}

export default function CommentModerationComponent() {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/comments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, token]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadComments();
        alert('Комментарий удален');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении комментария');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Ошибка при удалении комментария');
    }
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Модерация комментариев</h2>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по содержанию..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все комментарии</option>
              <option value="approved">Одобренные</option>
              <option value="pending">Ожидающие</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список комментариев */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Комментарии не найдены</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start space-x-4">
                {/* Аватар автора */}
                <div className="flex-shrink-0">
                  {comment.author.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Содержание комментария */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.author.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {!comment.isApproved && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Ожидает модерации
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-3">
                    {truncateText(comment.content, 200)}
                  </p>

                  {/* Информация о посте */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Пост:</span>
                      <a 
                        href={`/posts/${comment.post.slug}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {comment.post.title}
                      </a>
                    </div>
                  </div>

                  {/* Статистика */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Лайков: {comment.likes.length}</span>
                    <span>Ответов: {comment.replies.length}</span>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedComment(comment)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Просмотреть полный комментарий"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить комментарий"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Назад
            </button>
            
            <span className="px-4 py-2 text-gray-600">
              Страница {currentPage} из {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Вперед
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра комментария */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Комментарий от {selectedComment.author.username}
              </h3>
              <button
                onClick={() => setSelectedComment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedComment.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Автор:</span>
                  <span className="ml-2 text-gray-600">{selectedComment.author.username}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Дата:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedComment.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Лайков:</span>
                  <span className="ml-2 text-gray-600">{selectedComment.likes.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Ответов:</span>
                  <span className="ml-2 text-gray-600">{selectedComment.replies.length}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Пост:</h4>
                <a 
                  href={`/posts/${selectedComment.post.slug}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedComment.post.title}
                </a>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedComment(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  handleDeleteComment(selectedComment._id);
                  setSelectedComment(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}