import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import UserMute from '@/models/UserMute';
import { getCurrentUser } from '@/lib/auth';

// GET - получение комментариев к посту
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    await dbConnect();

    const post = await Post.findOne({ slug: params.slug });
    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: post._id, isApproved: true })
      .populate('author', 'username avatar')
      .populate('replies')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Comment.countDocuments({ post: post._id, isApproved: true });

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении комментариев' },
      { status: 500 }
    );
  }
}

// POST - создание комментария
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const post = await Post.findOne({ slug: params.slug });
    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    const { content, parentCommentId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Содержание комментария обязательно' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Комментарий слишком длинный (максимум 1000 символов)' },
        { status: 400 }
      );
    }

    // Проверяем права на комментирование
    if (!user.permissions.includes('comment')) {
      return NextResponse.json(
        { error: 'У вас нет прав на комментирование' },
        { status: 403 }
      );
    }

    // Проверяем, не забанен ли пользователь
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Ваш аккаунт заблокирован' },
        { status: 403 }
      );
    }

    // Проверяем, не замучен ли пользователь
    const mutes = await UserMute.find({
      user: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
      type: { $in: ['comment', 'all'] }
    });
    if (mutes.length > 0) {
      return NextResponse.json(
        { error: 'Вы не можете комментировать в данный момент' },
        { status: 403 }
      );
    }

    const commentData: Record<string, unknown> = {
      content: content.trim(),
      author: user._id,
      post: post._id,
      isApproved: true // Автоматически одобряем комментарии авторизованных пользователей
    };

    // Если это ответ на другой комментарий
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Родительский комментарий не найден' },
          { status: 404 }
        );
      }
      commentData.parentComment = parentCommentId;
    }

    const comment = new Comment(commentData);
    await comment.save();

    // Если это ответ, добавляем в replies родительского комментария
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')
      .lean();

    return NextResponse.json(populatedComment, { status: 201 });

  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании комментария' },
      { status: 500 }
    );
  }
}