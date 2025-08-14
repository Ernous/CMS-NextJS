import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { requireAuth } from '@/lib/auth';

// GET - получение комментариев к посту
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();

    const post = await Post.findOne({ slug: params.slug });
    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    const comments = await Comment.find({ 
      post: post._id, 
      parentComment: null, // Только корневые комментарии
      isApproved: true 
    })
      .populate('author', 'username avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar'
        },
        match: { isApproved: true }
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(comments);

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении комментариев' },
      { status: 500 }
    );
  }
}

// POST - создание комментария
export const POST = requireAuth(async (
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

    const commentData: any = {
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
});