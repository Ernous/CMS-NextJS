# 🔧 Исправление прав администратора

## Проблема
Пользователь с ролью `admin` не может получить доступ к админ-панели `/admin` из-за недостаточных прав в массиве `permissions`.

## Причина
При создании пользователя-администратора права не были автоматически назначены согласно его роли.

## Решение

### Вариант 1: Запуск скрипта исправления (рекомендуется)

1. Убедитесь, что MongoDB запущен
2. Запустите скрипт исправления:

```bash
node scripts/fix-admin-permissions.js
```

Скрипт автоматически найдет пользователя с ролью `admin` и обновит его права.

### Вариант 2: Ручное обновление через MongoDB

Подключитесь к MongoDB и выполните:

```javascript
use cms_blog
db.users.updateOne(
  { role: "admin" },
  { 
    $set: { 
      permissions: [
        "create_post", "edit_post", "delete_post", "publish_post",
        "manage_users", "manage_emojis", "moderate_comments", "view_analytics",
        "comment", "react"
      ] 
    } 
  }
)
```

### Вариант 3: Через API (если доступен)

```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/update-permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "create_post", "edit_post", "delete_post", "publish_post",
      "manage_users", "manage_emojis", "moderate_comments", "view_analytics",
      "comment", "react"
    ]
  }'
```

## Права по умолчанию для ролей

### Admin
- `create_post` - создание постов
- `edit_post` - редактирование постов
- `delete_post` - удаление постов
- `publish_post` - публикация постов
- `manage_users` - управление пользователями
- `manage_emojis` - управление эмодзи
- `moderate_comments` - модерация комментариев
- `view_analytics` - просмотр аналитики
- `comment` - комментирование
- `react` - реакции

### Moderator
- `create_post` - создание постов
- `edit_post` - редактирование постов
- `publish_post` - публикация постов
- `moderate_comments` - модерация комментариев
- `view_analytics` - просмотр аналитики
- `comment` - комментирование
- `react` - реакции

### Author
- `create_post` - создание постов
- `edit_post` - редактирование постов
- `publish_post` - публикация постов
- `comment` - комментирование
- `react` - реакции

### User
- `comment` - комментирование
- `react` - реакции

## Проверка исправления

После исправления прав:

1. Войдите в систему как администратор
2. Перейдите на `/admin`
3. Должна открыться админ-панель без редиректа на главную

## Предотвращение проблемы в будущем

В модели `User` добавлен middleware, который автоматически назначает права при изменении роли пользователя. Теперь при создании или изменении роли пользователя права будут назначаться автоматически.