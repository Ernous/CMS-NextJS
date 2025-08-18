import mongoose from 'mongoose';

export interface ISiteSettings extends mongoose.Document {
  siteName: string;
  siteDescription: string;
  siteIcon: string;
  siteLogo: string;
  primaryColor: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxCommentsPerPost: number;
  maxReactionsPerPost: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ISiteSettingsModel extends mongoose.Model<ISiteSettings> {
  getInstance(): Promise<ISiteSettings>;
}

const siteSettingsSchema = new mongoose.Schema<ISiteSettings>({
  siteName: {
    type: String,
    required: true,
    default: 'CMS Блог'
  },
  siteDescription: {
    type: String,
    default: 'Современная CMS система для блогов'
  },
  siteIcon: {
    type: String,
    default: '/favicon.ico'
  },
  siteLogo: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#3B82F6'
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  maxCommentsPerPost: {
    type: Number,
    default: 100
  },
  maxReactionsPerPost: {
    type: Number,
    default: 50
  }
}, {
  timestamps: true
});

// Создаем единственный экземпляр настроек
siteSettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings, ISiteSettingsModel>('SiteSettings', siteSettingsSchema);