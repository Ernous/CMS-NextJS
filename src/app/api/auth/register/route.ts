import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, email, password } = await request.json();

    // Валидация
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email или username уже существует' },
        { status: 400 }
      );
    }

    // Создание пользователя
    const user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    await user.save();

    // Создание JWT токена
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Удаление пароля из ответа
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      avatar: user.avatar
    };

    return NextResponse.json({
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    );
  }
}