import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import UserMute from '@/models/UserMute';
import { requirePermission } from '@/lib/auth';

// GET - получение мутов пользователя
export const GET = requirePermission('manage_users')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();

    const mutes = await UserMute.find({ user: params.id })
      .populate('mutedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(mutes);

  } catch (error) {
    console.error('Get mutes error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении мутов' },
      { status: 500 }
    );
  }
});

// POST - создание мута
export const POST = requirePermission('manage_users')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();

    const { type, reason, duration } = await request.json();

    if (!type || !reason || !duration) {
      return NextResponse.json(
        { error: 'Тип, причина и длительность обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует
    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Вычисляем время окончания мута
    const expiresAt = new Date();
    const durationInMs = parseInt(duration) * 60 * 1000; // duration в минутах
    expiresAt.setTime(expiresAt.getTime() + durationInMs);

    // Создаем мут
    const mute = new UserMute({
      user: params.id,
      mutedBy: user._id,
      type,
      reason,
      expiresAt
    });

    await mute.save();

    const populatedMute = await UserMute.findById(mute._id)
      .populate('mutedBy', 'username')
      .populate('user', 'username')
      .lean();

    return NextResponse.json(populatedMute, { status: 201 });

  } catch (error) {
    console.error('Create mute error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании мута' },
      { status: 500 }
    );
  }
});

// DELETE - удаление мута
export const DELETE = requirePermission('manage_users')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const muteId = searchParams.get('muteId');

    if (!muteId) {
      return NextResponse.json(
        { error: 'ID мута обязателен' },
        { status: 400 }
      );
    }

    const mute = await UserMute.findById(muteId);
    if (!mute) {
      return NextResponse.json(
        { error: 'Мут не найден' },
        { status: 404 }
      );
    }

    // Проверяем, что мут принадлежит указанному пользователю
    if (mute.user.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Мут не принадлежит указанному пользователю' },
        { status: 403 }
      );
    }

    mute.isActive = false;
    await mute.save();

    return NextResponse.json({ message: 'Мут удален' });

  } catch (error) {
    console.error('Delete mute error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении мута' },
      { status: 500 }
    );
  }
});