import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { EmojiPack } from '@/models/Emoji';
import { requirePermission } from '@/lib/auth';

// GET - получение списка пакетов эмодзи
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public');
    const author = searchParams.get('author');

    const query: any = { isActive: true };

    if (isPublic === 'true') {
      query.isPublic = true;
    }

    if (author) {
      query.author = author;
    }

    const packs = await EmojiPack.find(query)
      .populate('author', 'username')
      .populate('emojis', 'shortcode url')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(packs);

  } catch (error) {
    console.error('Get emoji packs error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пакетов эмодзи' },
      { status: 500 }
    );
  }
}

// POST - создание нового пакета эмодзи
export const POST = requirePermission('manage_emojis')(async (request: NextRequest, user: any) => {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, description, isPublic } = body;

    // Валидация
    if (!name) {
      return NextResponse.json(
        { error: 'Название пакета обязательно' },
        { status: 400 }
      );
    }

    // Проверка уникальности названия
    const existingPack = await EmojiPack.findOne({ 
      name, 
      author: user._id 
    });
    
    if (existingPack) {
      return NextResponse.json(
        { error: 'Пакет с таким названием уже существует' },
        { status: 400 }
      );
    }

    const pack = new EmojiPack({
      name,
      description: description || '',
      author: user._id,
      isPublic: isPublic !== false,
      emojis: []
    });

    await pack.save();

    const populatedPack = await EmojiPack.findById(pack._id)
      .populate('author', 'username')
      .lean();

    return NextResponse.json(populatedPack, { status: 201 });

  } catch (error) {
    console.error('Create emoji pack error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании пакета эмодзи' },
      { status: 500 }
    );
  }
});