'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UserManagementComponent from '@/components/admin/UserManagement';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Проверяем права доступа
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Назад в админку</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
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
        <UserManagementComponent />
      </main>
    </div>
  );
}