'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FileText, 
  Smile, 
  BarChart3, 
  Plus,
  ArrowLeft,
  MessageSquare,
  Globe
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalEmojis: number;
  totalReactions: number;
}

export default function AdminPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalEmojis: 0,
    totalReactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadStats();
  }, [user, router]);

  const loadStats = async () => {
    try {
      // В реальном приложении здесь были бы API вызовы для получения статистики
      setStats({
        totalUsers: 25,
        totalPosts: 42,
        totalEmojis: 156,
        totalReactions: 1289
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const adminMenuItems = [
    {
      title: 'Пользователи',
      description: 'Управление пользователями, баны и муты',
      icon: Users,
      href: '/admin/users',
      permission: 'manage_users'
    },
    {
      title: 'Модерация комментариев',
      description: 'Просмотр и удаление комментариев',
      icon: MessageSquare,
      href: '/admin/comments',
      permission: 'moderate_comments'
    },
    {
      title: 'Посты',
      description: 'Управление постами и контентом',
      icon: FileText,
      href: '/admin/posts',
      permission: 'edit_post'
    },
    {
      title: 'Эмодзи',
      description: 'Управление кастомными эмодзи',
      icon: Smile,
      href: '/admin/emojis',
      permission: 'manage_emojis'
    },
    {
      title: 'Настройки сайта',
      description: 'Название, иконка, цвета и ограничения',
      icon: Globe,
      href: '/admin/settings',
      permission: 'manage_users'
    },
    {
      title: 'Аналитика',
      description: 'Статистика и аналитика',
      icon: BarChart3,
      href: '/admin/analytics',
      permission: 'view_analytics'
    }
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Администратор:</span>
              <span className="font-medium text-gray-900">{user.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Статистика */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Общая статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Пользователи</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Посты</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Smile className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Эмодзи</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmojis}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Реакции</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReactions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="flex flex-wrap gap-4">
            {hasPermission('create_post') && (
              <Link
                href="/admin/posts/new"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Создать пост</span>
              </Link>
            )}
            
            {hasPermission('manage_emojis') && (
              <Link
                href="/admin/emojis/new"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
                <span>Добавить эмодзи</span>
              </Link>
            )}
          </div>
        </div>

        {/* Меню администратора */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Управление</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenuItems.map((item) => {
              if (!hasPermission(item.permission)) return null;
              
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}