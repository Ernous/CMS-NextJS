import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { requirePermission } from '@/lib/auth';

// GET - получение поста по slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
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
    await Post.findByIdAndUpdate(post._id, {
      $inc: { viewCount: 1 }
    });

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
export const PUT = requirePermission('edit_post')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { slug: string } }
) => {
  try {
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
});

// DELETE - удаление поста
export const DELETE = requirePermission('delete_post')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { slug: string } }
) => {
  try {
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

    await Post.findByIdAndDelete(post._id);

    return NextResponse.json({ message: 'Пост успешно удален' });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении поста' },
      { status: 500 }
    );
  }
});