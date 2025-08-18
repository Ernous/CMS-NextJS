import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// GET - получение поста по slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    await dbConnect();

    const post = await Post.findOne({ slug: params.slug })
      .populate('author', 'username avatar')
      .lean();

    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    // Увеличиваем счетчик просмотров
    await Post.findByIdAndUpdate((post as { _id: string })._id, { $inc: { views: 1 } });

    return NextResponse.json(post);

  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении поста' },
      { status: 500 }
    );
  }
}

// PUT - обновление поста
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'edit_post')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const post = await Post.findOne({ slug: params.slug });

    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    // Проверяем права на редактирование
    if (post.author.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нет прав на редактирование этого поста' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, status, category, tags, featuredImage, images, videos } = body;

    // Обновляем поля
    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (status) post.status = status;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (images) post.images = images;
    if (videos) post.videos = videos;

    // Обновляем slug если изменился заголовок
    if (title && title !== post.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      let slug = baseSlug;
      let counter = 1;

      while (await Post.findOne({ slug, _id: { $ne: post._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      post.slug = slug;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar')
      .lean();

    return NextResponse.json(updatedPost);

  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении поста' },
      { status: 500 }
    );
  }
}

// DELETE - удаление поста
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'delete_post')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const post = await Post.findOne({ slug: params.slug });

    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    // Проверяем права на удаление
    if (post.author.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нет прав на удаление этого поста' },
        { status: 403 }
      );
    }

    // Удаляем пост
    await Post.findByIdAndDelete(post._id);

    return NextResponse.json({ message: 'Пост удален' });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении поста' },
      { status: 500 }
    );
  }
}