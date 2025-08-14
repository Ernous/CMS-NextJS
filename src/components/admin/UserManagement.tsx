'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Search, 
  Ban, 
  Unlock, 
  UserCheck, 
  UserX, 
  Volume2, 
  VolumeX,
  MoreVertical,
  Clock
} from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  bannedBy?: {
    username: string;
  };
  bannedAt?: string;
  createdAt: string;
  activeMutes: Array<{
    _id: string;
    type: string;
    reason: string;
    expiresAt: string;
    mutedBy: {
      username: string;
    };
  }>;
}

interface MuteForm {
  type: 'comment' | 'post' | 'all';
  reason: string;
  duration: number;
}

export default function UserManagementComponent() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMuteForm, setShowMuteForm] = useState(false);
  const [muteForm, setMuteForm] = useState<MuteForm>({
    type: 'comment',
    reason: '',
    duration: 60
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action, reason }),
      });

      if (response.ok) {
        await loadUsers();
        alert(`Действие "${action}" выполнено успешно`);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при выполнении действия');
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Ошибка при выполнении действия');
    }
  };

  const handleMuteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(muteForm),
      });

      if (response.ok) {
        await loadUsers();
        setShowMuteForm(false);
        setSelectedUser(null);
        setMuteForm({ type: 'comment', reason: '', duration: 60 });
        alert('Пользователь замучен');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при муте пользователя');
      }
    } catch (error) {
      console.error('Error muting user:', error);
      alert('Ошибка при муте пользователя');
    }
  };

  const handleUnmuteUser = async (muteId: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/mute?muteId=${muteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadUsers();
        alert('Мут снят');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при снятии мута');
      }
    } catch (error) {
      console.error('Error unmuting user:', error);
      alert('Ошибка при снятии мута');
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

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Забанен</span>;
    }
    if (!user.isActive) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Неактивен</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Активен</span>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      moderator: 'bg-blue-100 text-blue-800',
      author: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[role as keyof typeof colors] || colors.user}`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Управление пользователями</h2>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Имя или email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все роли</option>
              <option value="admin">Администратор</option>
              <option value="moderator">Модератор</option>
              <option value="author">Автор</option>
              <option value="user">Пользователь</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все статусы</option>
              <option value="active">Активные</option>
              <option value="banned">Забаненные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Муты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.activeMutes.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        <VolumeX className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">
                          {user.activeMutes.length} мут(ов)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Volume2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Нет мутов</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.isBanned ? (
                        <button
                          onClick={() => handleUserAction(user._id, 'unban')}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        >
                          <Unlock size={16} />
                          <span>Разбанить</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Причина бана:');
                            if (reason) handleUserAction(user._id, 'ban', reason);
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                        >
                          <Ban size={16} />
                          <span>Забанить</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowMuteForm(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center space-x-1"
                      >
                        <VolumeX size={16} />
                        <span>Мут</span>
                      </button>

                      {user.activeMutes.length > 0 && (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Clock size={16} />
                          <span>Муты</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Модальное окно мута */}
      {showMuteForm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Мут пользователя {selectedUser.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип мута
                </label>
                <select
                  value={muteForm.type}
                  onChange={(e) => setMuteForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="comment">Комментарии</option>
                  <option value="post">Посты</option>
                  <option value="all">Все</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Причина
                </label>
                <textarea
                  value={muteForm.reason}
                  onChange={(e) => setMuteForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Укажите причину мута..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Длительность (минуты)
                </label>
                <input
                  type="number"
                  value={muteForm.duration}
                  onChange={(e) => setMuteForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="10080" // 1 неделя
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMuteForm(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                onClick={handleMuteUser}
                disabled={!muteForm.reason.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                Замутить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра мутов */}
      {selectedUser && !showMuteForm && selectedUser.activeMutes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Активные муты пользователя {selectedUser.username}
            </h3>
            
            <div className="space-y-3">
              {selectedUser.activeMutes.map((mute) => (
                <div key={mute._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          mute.type === 'comment' ? 'bg-blue-100 text-blue-800' :
                          mute.type === 'post' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {mute.type === 'comment' ? 'Комментарии' :
                           mute.type === 'post' ? 'Посты' : 'Все'}
                        </span>
                        <span className="text-sm text-gray-500">
                          До: {formatDate(mute.expiresAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{mute.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Замучен: {mute.mutedBy.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnmuteUser(mute._id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Снять мут
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}