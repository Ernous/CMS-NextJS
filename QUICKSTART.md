# Быстрый старт CMS Блог

## 🚀 Быстрая установка

### 1. Клонирование и установка
```bash
git clone <your-repo-url>
cd your-project-name
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/cms_blog
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Запуск проекта
```bash
npm run dev
```

Откройте http://localhost:3000

## 👤 Создание первого администратора

### Локально:
```bash
npm run create-admin
```

### В продакшене:
1. Зарегистрируйтесь как обычный пользователь
2. В MongoDB измените роль:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## 📝 Основные функции

### Для обычных пользователей:
- ✅ Чтение постов
- ✅ Комментирование (авторизованные)
- ✅ Реакции эмодзи (авторизованные)
- ✅ Лайки комментариев (авторизованные)

### Для авторов и выше:
- ✅ Создание постов
- ✅ Редактирование постов
- ✅ Управление контентом

### Для администраторов:
- ✅ Управление пользователями
- ✅ Управление эмодзи
- ✅ Полная админ панель

## 🎨 Кастомные эмодзи

1. Войдите как админ
2. Создайте пакет эмодзи
3. Добавьте эмодзи с shortcode
4. Используйте `:shortcode:` в markdown

## 🚀 Деплой на Vercel

См. подробную инструкцию в [DEPLOY.md](./DEPLOY.md)

## 📁 Структура проекта

```
/
├── src/
│   ├── app/           # Next.js страницы и API
│   ├── components/    # React компоненты
│   ├── contexts/      # React контексты
│   ├── lib/          # Утилиты
│   ├── models/       # Mongoose модели
│   └── types/        # TypeScript типы
├── scripts/          # Скрипты
├── public/           # Статические файлы
└── package.json      # Зависимости
```

## 🔧 Основные команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен версии
npm run create-admin # Создание администратора
```

## 🆘 Поддержка

- Документация: [README.md](./README.md)
- Деплой: [DEPLOY.md](./DEPLOY.md)
- Проблемы: создайте issue в репозитории