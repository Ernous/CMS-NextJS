import mongoose from 'mongoose';

export interface IEmoji extends mongoose.Document {
  name: string;
  shortcode: string;
  url: string;
  category: string;
  tags: string[];
  isCustom: boolean;
  pack: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmojiPack extends mongoose.Document {
  name: string;
  description: string;
  author: mongoose.Types.ObjectId;
  isActive: boolean;
  isPublic: boolean;
  emojis: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const emojiSchema = new mongoose.Schema<IEmoji>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[a-zA-Z0-9_]+$/
  },
  url: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isCustom: {
    type: Boolean,
    default: true
  },
  pack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmojiPack',
    required: true
  }
}, {
  timestamps: true
});

const emojiPackSchema = new mongoose.Schema<IEmojiPack>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  emojis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emoji'
  }]
}, {
  timestamps: true
});

// Индексы
emojiSchema.index({ shortcode: 1 });
emojiSchema.index({ pack: 1 });
emojiSchema.index({ category: 1 });

emojiPackSchema.index({ author: 1 });
emojiPackSchema.index({ isActive: 1, isPublic: 1 });

export const Emoji = mongoose.models.Emoji || mongoose.model<IEmoji>('Emoji', emojiSchema);
export const EmojiPack = mongoose.models.EmojiPack || mongoose.model<IEmojiPack>('EmojiPack', emojiPackSchema);