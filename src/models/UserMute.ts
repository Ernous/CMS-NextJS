import mongoose from 'mongoose';

export interface IUserMute extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  mutedBy: mongoose.Types.ObjectId;
  type: 'comment' | 'post' | 'all';
  reason: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userMuteSchema = new mongoose.Schema<IUserMute>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mutedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['comment', 'post', 'all'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
userMuteSchema.index({ user: 1, type: 1, isActive: 1 });
userMuteSchema.index({ expiresAt: 1 });

// Метод для проверки, активен ли мут
userMuteSchema.methods.isActiveMute = function(): boolean {
  return this.isActive && this.expiresAt > new Date();
};

// Статический метод для получения активных мутов пользователя
userMuteSchema.statics.getActiveMutes = async function(userId: string) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('mutedBy', 'username');
};

// Статический метод для проверки, может ли пользователь комментировать
userMuteSchema.statics.canComment = async function(userId: string): Promise<boolean> {
  const mutes = await this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
    type: { $in: ['comment', 'all'] }
  });
  return mutes.length === 0;
};

// Статический метод для проверки, может ли пользователь создавать посты
userMuteSchema.statics.canPost = async function(userId: string): Promise<boolean> {
  const mutes = await this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
    type: { $in: ['post', 'all'] }
  });
  return mutes.length === 0;
};

export default mongoose.models.UserMute || mongoose.model<IUserMute>('UserMute', userMuteSchema);