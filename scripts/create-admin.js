const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms-blog';

// Схема пользователя (упрощенная версия)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'author', 'user'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'create_post',
      'edit_post',
      'delete_post',
      'publish_post',
      'manage_users',
      'manage_emojis',
      'moderate_comments',
      'view_analytics',
      'comment',
      'react'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Подключение к базе данных
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено');

    // Данные администратора
    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      permissions: [
        'create_post',
        'edit_post',
        'delete_post',
        'publish_post',
        'manage_users',
        'manage_emojis',
        'moderate_comments',
        'view_analytics'
      ]
    };

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log('⚠️  Пользователь с таким email уже существует');
      console.log('Email:', existingUser.email);
      console.log('Роль:', existingUser.role);
      return;
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Создаем администратора
    const admin = new User({
      ...adminData,
      password: hashedPassword
    });

    await admin.save();

    console.log('✅ Администратор успешно создан!');
    console.log('Email:', adminData.email);
    console.log('Пароль:', adminData.password);
    console.log('Роль:', adminData.role);

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  }
}

// Запуск скрипта
createAdmin();