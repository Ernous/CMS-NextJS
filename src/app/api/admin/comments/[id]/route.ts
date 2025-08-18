import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { getCurrentUser, hasPermission } from '@/lib/auth';

// DELETE - удаление комментария администратором
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissions, 'moderate_comments')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
}