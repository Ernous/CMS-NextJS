import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import UserMute from '@/models/UserMute';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// GET - получение списка пользователей
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'manage_users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
      query.isBanned = false;
    } else if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .populate('bannedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    // Получаем активные муты для каждого пользователя
    const usersWithMutes = await Promise.all(
      users.map(async (user) => {
        const mutes = await UserMute.find({
          user: user._id,
          isActive: true,
          expiresAt: { $gt: new Date() }
        }).populate('mutedBy', 'username');
        return {
          ...user,
          activeMutes: mutes
        };
      })
    );

    return NextResponse.json({
      users: usersWithMutes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    );
  }
}

// POST - бан/разбан пользователя
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'manage_users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { userId, action, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'ID пользователя и действие обязательны' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    if (action === 'ban') {
      targetUser.isBanned = true;
      targetUser.banReason = reason || 'Нарушение правил';
      targetUser.bannedBy = user._id;
      targetUser.bannedAt = new Date();
      targetUser.isActive = false;
    } else if (action === 'unban') {
      targetUser.isBanned = false;
      targetUser.banReason = undefined;
      targetUser.bannedBy = undefined;
      targetUser.bannedAt = undefined;
      targetUser.isActive = true;
    } else if (action === 'activate') {
      targetUser.isActive = true;
    } else if (action === 'deactivate') {
      targetUser.isActive = false;
    } else {
      return NextResponse.json(
        { error: 'Неверное действие' },
        { status: 400 }
      );
    }

    await targetUser.save();

    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('bannedBy', 'username')
      .lean();

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json(
      { error: 'Ошибка при выполнении действия' },
      { status: 500 }
    );
  }
}