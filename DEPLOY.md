# Деплой на Vercel

## Подготовка к деплою

### 1. Настройка MongoDB

Для продакшена рекомендуется использовать MongoDB Atlas:

1. Создайте аккаунт на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Создайте новый кластер
3. Получите строку подключения (Connection String)
4. Замените `<password>` на пароль вашего пользователя

### 2. Настройка переменных окружения в Vercel

В настройках проекта на Vercel добавьте следующие переменные окружения:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cms-blog?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 3. Деплой на Vercel

#### Способ 1: Через GitHub

1. Загрузите код в GitHub репозиторий
2. Подключите репозиторий к Vercel
3. Настройте переменные окружения
4. Нажмите "Deploy"

#### Способ 2: Через Vercel CLI

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в аккаунт:
```bash
vercel login
```

3. Деплойте проект:
```bash
vercel
```

4. Для продакшена:
```bash
vercel --prod
```

### 4. Создание первого администратора

После деплоя создайте первого администратора:

1. Зарегистрируйтесь как обычный пользователь
2. Подключитесь к MongoDB Atlas
3. Выполните команду для изменения роли:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### 5. Настройка домена (опционально)

1. В настройках проекта на Vercel перейдите в "Domains"
2. Добавьте ваш домен
3. Настройте DNS записи согласно инструкциям Vercel

## Структура проекта для деплоя

```
/
├── src/                    # Исходный код
│   ├── app/               # Next.js App Router
│   ├── components/        # React компоненты
│   ├── contexts/          # React контексты
│   ├── lib/               # Утилиты
│   ├── models/            # Mongoose модели
│   └── types/             # TypeScript типы
├── public/                # Статические файлы
├── scripts/               # Скрипты
├── package.json           # Зависимости
├── next.config.ts         # Конфигурация Next.js
├── vercel.json            # Конфигурация Vercel
└── README.md              # Документация
```

## Возможные проблемы

### Ошибка подключения к MongoDB

Убедитесь, что:
- Строка подключения корректна
- IP адрес Vercel добавлен в whitelist MongoDB Atlas
- Пользователь имеет права на чтение/запись

### Ошибки сборки

Проверьте:
- Все зависимости установлены
- TypeScript ошибки исправлены
- Конфигурация Next.js корректна

### Проблемы с аутентификацией

Убедитесь, что:
- JWT_SECRET установлен
- NEXTAUTH_URL соответствует вашему домену
- Все переменные окружения настроены

## Мониторинг

После деплоя следите за:
- Логами в Vercel Dashboard
- Метриками производительности
- Ошибками в консоли браузера

## Обновления

Для обновления приложения:
1. Загрузите изменения в GitHub
2. Vercel автоматически пересоберет и задеплоит проект
3. Или используйте `vercel --prod` для принудительного деплоя