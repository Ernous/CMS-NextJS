import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!hasPermission(user.permissions, 'manage_users')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { permissions } = await request.json();

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { permissions },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Права пользователя обновлены',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении прав' },
      { status: 500 }
    );
  }
}