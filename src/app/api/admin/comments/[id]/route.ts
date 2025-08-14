import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { requirePermission } from '@/lib/auth';

// DELETE - удаление комментария администратором
export const DELETE = requirePermission('moderate_comments')(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();

    const comment = await Comment.findById(params.id);
    if (!comment) {
      return NextResponse.json(
        { error: 'Комментарий не найден' },
        { status: 404 }
      );
    }

    // Удаляем комментарий
    await Comment.findByIdAndDelete(params.id);

    // Если это был ответ, удаляем его из replies родительского комментария
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: params.id }
      });
    }

    return NextResponse.json({ message: 'Комментарий удален' });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении комментария' },
      { status: 500 }
    );
  }
});