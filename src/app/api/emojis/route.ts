import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Emoji, EmojiPack } from '@/models/Emoji';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// GET - получение списка эмодзи
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const pack = searchParams.get('pack');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (pack) {
      query.pack = pack;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortcode: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const emojis = await Emoji.find(query)
      .populate('pack', 'name')
      .sort({ shortcode: 1 })
      .lean();

    return NextResponse.json(emojis);

  } catch (error) {
    console.error('Get emojis error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении эмодзи' },
      { status: 500 }
    );
  }
}

// POST - создание нового эмодзи
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'manage_emojis')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, shortcode, url, category, tags, packId } = body;

    // Валидация
    if (!name || !shortcode || !url || !packId) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Проверка уникальности shortcode
    const existingEmoji = await Emoji.findOne({ shortcode });
    if (existingEmoji) {
      return NextResponse.json(
        { error: 'Эмодзи с таким shortcode уже существует' },
        { status: 400 }
      );
    }

    // Проверка существования пакета
    const pack = await EmojiPack.findById(packId);
    if (!pack) {
      return NextResponse.json(
        { error: 'Пакет эмодзи не найден' },
        { status: 404 }
      );
    }

    const emoji = new Emoji({
      name,
      shortcode,
      url,
      category: category || 'general',
      tags: tags || [],
      pack: packId
    });

    await emoji.save();

    // Добавляем эмодзи в пакет
    pack.emojis.push(emoji._id);
    await pack.save();

    const populatedEmoji = await Emoji.findById(emoji._id)
      .populate('pack', 'name')
      .lean();

    return NextResponse.json(populatedEmoji, { status: 201 });

  } catch (error) {
    console.error('Create emoji error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании эмодзи' },
      { status: 500 }
    );
  }
}