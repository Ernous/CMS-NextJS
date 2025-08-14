import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { requirePermission } from '@/lib/auth';

// GET - получение всех комментариев для модерации
export const GET = requirePermission('moderate_comments')(async (request: NextRequest, user: any) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const query: any = {};

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    if (status === 'approved') {
      query.isApproved = true;
    } else if (status === 'pending') {
      query.isApproved = false;
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.find(query)
      .populate('author', 'username avatar')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Comment.countDocuments(query);

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
});