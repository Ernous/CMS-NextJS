'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Reactions from '@/components/Reactions';
import Comments from '@/components/Comments';
import { ArrowLeft, User, Calendar, Eye, Edit, Trash2 } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  status: string;
  category: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  featuredImage?: string;
  images: string[];
  videos: string[];
}

interface PostPageProps {
  params: { slug: string };
}

export default function PostPage({ params }: PostPageProps) {
  const { user, hasPermission } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [params.slug]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      } else {
        setError('Пост не найден');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Ошибка при загрузке поста');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !post) return;

    if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Ошибка при удалении поста');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Ошибка при удалении поста');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Пост не найден'}
          </h1>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Вернуться на главную</span>
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = user && (
    post.author._id === user.id || 
    hasPermission('edit_post')
  );

  const canDelete = user && (
    post.author._id === user.id || 
    hasPermission('delete_post')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Назад к постам</span>
            </Link>

            <div className="flex items-center space-x-4">
              {canEdit && (
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={20} />
                  <span>Редактировать</span>
                </Link>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={20} />
                  <span>Удалить</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Заголовок поста */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Метаинформация */}
            <div className="flex items-center space-x-6 text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <User size={20} />
                <span>{post.author.username}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={20} />
                <span>
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye size={20} />
                <span>{post.viewCount} просмотров</span>
              </div>
            </div>

            {/* Категория и теги */}
            <div className="flex items-center space-x-4">
              {post.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {post.category}
                </span>
              )}
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          {/* Изображение поста */}
          {post.featuredImage && (
            <div className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Содержание поста */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Дополнительные изображения */}
          {post.images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Изображения
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {post.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Изображение ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Видео */}
          {post.videos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Видео
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.videos.map((video, index) => (
                  <video
                    key={index}
                    controls
                    className="w-full rounded-lg shadow-md"
                  >
                    <source src={video} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                ))}
              </div>
            </div>
          )}

          {/* Реакции */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Реакции
            </h3>
            <Reactions postSlug={post.slug} />
          </div>

          {/* Комментарии */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <Comments postSlug={post.slug} />
          </div>
        </article>
      </main>
    </div>
  );
}