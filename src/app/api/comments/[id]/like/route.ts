import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { getCurrentUser } from '@/lib/auth';

// POST - поставить/убрать лайк комментарию
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const comment = await Comment.findById(params.id);
    if (!comment) {
      return NextResponse.json(
        { error: 'Комментарий не найден' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли уже лайк от этого пользователя
    const hasLiked = comment.likes.includes(user._id);

    if (hasLiked) {
      // Убираем лайк
      await Comment.findByIdAndUpdate(params.id, {
        $pull: { likes: user._id }
      });
    } else {
      // Добавляем лайк
      await Comment.findByIdAndUpdate(params.id, {
        $addToSet: { likes: user._id }
      });
    }

    // Получаем обновленный комментарий
    const updatedComment = await Comment.findById(params.id)
      .populate('author', 'username avatar')
      .lean();

    return NextResponse.json({
      comment: updatedComment,
      liked: !hasLiked
    });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обработке лайка' },
      { status: 500 }
    );
  }
}