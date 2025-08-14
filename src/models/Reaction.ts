import mongoose from 'mongoose';

export interface IReaction extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  emoji: mongoose.Types.ObjectId;
  createdAt: Date;
}

const reactionSchema = new mongoose.Schema<IReaction>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  emoji: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emoji',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Уникальный индекс для предотвращения дублирования реакций
reactionSchema.index({ user: 1, post: 1, emoji: 1 }, { unique: true });

// Индексы для быстрого поиска
reactionSchema.index({ post: 1 });
reactionSchema.index({ emoji: 1 });

export default mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', reactionSchema);