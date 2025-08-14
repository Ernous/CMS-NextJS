import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import UserMute from '@/models/UserMute';
import { requirePermission } from '@/lib/auth';

// GET - получение списка постов
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const query: any = {};

    // Фильтр по статусу
    if (status !== 'all') {
      query.status = status;
    }

    // Фильтр по категории
    if (category) {
      query.category = category;
    }

    // Поиск
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(query);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении постов' },
      { status: 500 }
    );
  }
}

// POST - создание нового поста
export const POST = requirePermission('create_post')(async (request: NextRequest, user: any) => {
  try {
    await dbConnect();

    // Проверяем, не забанен ли пользователь
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Ваш аккаунт заблокирован' },
        { status: 403 }
      );
    }

    // Проверяем, не замучен ли пользователь
    const canPost = await UserMute.canPost(user._id.toString());
    if (!canPost) {
      return NextResponse.json(
        { error: 'Вы не можете создавать посты в данный момент' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, status, category, tags, featuredImage, images, videos } = body;

    // Валидация
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Заголовок и содержание обязательны' },
        { status: 400 }
      );
    }

    // Генерация slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    let slug = baseSlug;
    let counter = 1;

    // Проверка уникальности slug
    while (await Post.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = new Post({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 300),
      author: user._id,
      status: status || 'draft',
      category: category || 'general',
      tags: tags || [],
      featuredImage,
      images: images || [],
      videos: videos || []
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .lean();

    return NextResponse.json(populatedPost, { status: 201 });

  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании поста' },
      { status: 500 }
    );
  }
});