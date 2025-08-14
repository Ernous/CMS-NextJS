import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'author' | 'user';
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
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
  avatar: {
    type: String,
    default: null
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
      'view_analytics'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Установка прав по умолчанию в зависимости от роли
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'create_post', 'edit_post', 'delete_post', 'publish_post',
          'manage_users', 'manage_emojis', 'moderate_comments', 'view_analytics'
        ];
        break;
      case 'moderator':
        this.permissions = [
          'create_post', 'edit_post', 'publish_post',
          'moderate_comments', 'view_analytics'
        ];
        break;
      case 'author':
        this.permissions = ['create_post', 'edit_post', 'publish_post'];
        break;
      case 'user':
        this.permissions = [];
        break;
    }
  }
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);