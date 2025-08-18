const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_blog';

// Схема пользователя (упрощенная версия)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'moderator', 'author', 'user'],
    default: 'user'
  },
  permissions: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Установка прав по умолчанию в зависимости от роли
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'create_post', 'edit_post', 'delete_post', 'publish_post',
          'manage_users', 'manage_emojis', 'moderate_comments', 'view_analytics',
          'comment', 'react'
        ];
        break;
      case 'moderator':
        this.permissions = [
          'create_post', 'edit_post', 'publish_post',
          'moderate_comments', 'view_analytics',
          'comment', 'react'
        ];
        break;
      case 'author':
        this.permissions = ['create_post', 'edit_post', 'publish_post', 'comment', 'react'];
        break;
      case 'user':
        this.permissions = ['comment', 'react'];
        break;
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

async function fixAdminPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Находим пользователя с ролью admin
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log(`Found admin user: ${adminUser.username} (${adminUser.email})`);
    console.log('Current permissions:', adminUser.permissions);

    // Обновляем права администратора
    adminUser.permissions = [
      'create_post', 'edit_post', 'delete_post', 'publish_post',
      'manage_users', 'manage_emojis', 'moderate_comments', 'view_analytics',
      'comment', 'react'
    ];

    await adminUser.save();
    console.log('Admin permissions updated successfully');
    console.log('New permissions:', adminUser.permissions);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAdminPermissions();