import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// GET - получение настроек сайта
export async function GET() {
  try {
    await dbConnect();
    
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении настроек' },
      { status: 500 }
    );
  }
}

// PUT - обновление настроек сайта
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'manage_users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    
    const body = await request.json();
    const {
      siteName,
      siteDescription,
      siteIcon,
      siteLogo,
      primaryColor,
      allowRegistration,
      requireEmailVerification,
      maxCommentsPerPost,
      maxReactionsPerPost
    } = body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }
    
    // Обновляем только переданные поля
    if (siteName !== undefined) settings.siteName = siteName;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (siteIcon !== undefined) settings.siteIcon = siteIcon;
    if (siteLogo !== undefined) settings.siteLogo = siteLogo;
    if (primaryColor !== undefined) settings.primaryColor = primaryColor;
    if (allowRegistration !== undefined) settings.allowRegistration = allowRegistration;
    if (requireEmailVerification !== undefined) settings.requireEmailVerification = requireEmailVerification;
    if (maxCommentsPerPost !== undefined) settings.maxCommentsPerPost = maxCommentsPerPost;
    if (maxReactionsPerPost !== undefined) settings.maxReactionsPerPost = maxReactionsPerPost;

    await settings.save();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении настроек' },
      { status: 500 }
    );
  }
}