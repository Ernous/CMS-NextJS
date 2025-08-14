'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function NewPostPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    tags: '',
    status: 'draft',
    featuredImage: '',
    images: '',
    videos: ''
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  // Проверяем права на создание постов
  if (!user || !['admin', 'moderator', 'author'].includes(user.role)) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        images: formData.images.split(',').map(img => img.trim()).filter(img => img),
        videos: formData.videos.split(',').map(video => video.trim()).filter(video => video)
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/posts/${data.slug}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при создании поста');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Ошибка при создании поста');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Назад на сайт</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Создать новый пост</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Автор:</span>
              <span className="font-medium text-gray-900">{user.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Заголовок *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введите заголовок поста"
                  />
                </div>

                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                    Краткое описание
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Краткое описание поста (необязательно)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Категория
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">Общее</option>
                      <option value="technology">Технологии</option>
                      <option value="lifestyle">Образ жизни</option>
                      <option value="news">Новости</option>
                      <option value="tutorial">Обучение</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Черновик</option>
                      <option value="published">Опубликовать</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Теги
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Теги через запятую (например: javascript, react, web)"
                  />
                </div>
              </div>
            </div>

            {/* Содержание */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Содержание *</h2>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye size={16} />
                  <span>{preview ? 'Редактировать' : 'Предварительный просмотр'}</span>
                </button>
              </div>
              
              {preview ? (
                <div className="prose prose-lg max-w-none">
                  <h1>{formData.title}</h1>
                  <p className="text-gray-600">{formData.excerpt}</p>
                  <div className="border-t pt-4 mt-4">
                    {formData.content}
                  </div>
                </div>
              ) : (
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Напишите содержание поста. Поддерживается Markdown и кастомные эмодзи (:shortcode:)"
                />
              )}
              
              <div className="mt-2 text-sm text-gray-500">
                Поддерживается Markdown и кастомные эмодзи (например: :blobfox:)
              </div>
            </div>

            {/* Медиа */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Медиа</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Главное изображение
                  </label>
                  <input
                    type="url"
                    id="featuredImage"
                    name="featuredImage"
                    value={formData.featuredImage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL главного изображения"
                  />
                </div>

                <div>
                  <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
                    Дополнительные изображения
                  </label>
                  <input
                    type="text"
                    id="images"
                    name="images"
                    value={formData.images}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL изображений через запятую"
                  />
                </div>

                <div>
                  <label htmlFor="videos" className="block text-sm font-medium text-gray-700 mb-1">
                    Видео
                  </label>
                  <input
                    type="text"
                    id="videos"
                    name="videos"
                    value={formData.videos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL видео через запятую"
                  />
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Отмена
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                <span>{loading ? 'Сохранение...' : 'Создать пост'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}