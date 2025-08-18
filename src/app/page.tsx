'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Plus, Search, User, LogOut } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: {
    username: string;
    avatar?: string;
  };
  status: string;
  category: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              {settings.siteName}
            </Link>

            <div className="flex items-center space-x-4">
              {/* Поиск */}
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  placeholder="Поиск постов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <Search size={20} />
                </button>
              </form>

              {/* Навигация */}
              <nav className="flex items-center space-x-4">
                {user ? (
                  <>
                    {/* Кнопка "Новый пост" только для авторов и выше */}
                    {(user.role === 'admin' || user.role === 'moderator' || user.role === 'author') && (
                      <Link
                        href="/admin/posts/new"
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus size={20} />
                        <span>Новый пост</span>
                      </Link>
                    )}
                    
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Админка
                      </Link>
                    )}

                    <div className="flex items-center space-x-2">
                      <User size={20} className="text-gray-600" />
                      <span className="text-gray-700">{user.username}</span>
                      <span className="text-xs text-gray-500">({user.role})</span>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Войти
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Регистрация
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchTerm ? `Результаты поиска: "${searchTerm}"` : 'Последние посты'}
          </h1>
          <p className="text-gray-600">
            {searchTerm 
              ? `Найдено ${posts.length} постов`
              : 'Делитесь своими мыслями и идеями'
            }
          </p>
        </div>

        {/* Список постов */}
        <div className="grid gap-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'Посты не найдены' : 'Пока нет постов'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-gray-600 mt-2">{post.excerpt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>{post.author.username}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span>•</span>
                    <span>{post.viewCount} просмотров</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {post.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {post.category}
                      </span>
                    )}
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
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
      </main>
    </div>
  );
}
