import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Reaction from '@/models/Reaction';
import { Emoji } from '@/models/Emoji';
import { requireAuth } from '@/lib/auth';

// GET - получение реакций на пост
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

    const reactions = await Reaction.find({ post: post._id })
      .populate('user', 'username avatar')
      .populate('emoji', 'shortcode url name')
      .lean();

    // Группируем реакции по эмодзи
    const groupedReactions = reactions.reduce((acc, reaction) => {
      const emojiShortcode = reaction.emoji.shortcode;
      if (!acc[emojiShortcode]) {
        acc[emojiShortcode] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[emojiShortcode].count++;
      acc[emojiShortcode].users.push({
        id: reaction.user._id,
        username: reaction.user.username,
        avatar: reaction.user.avatar
      });
      return acc;
    }, {} as any);

    return NextResponse.json(groupedReactions);

  } catch (error) {
    console.error('Get reactions error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении реакций' },
      { status: 500 }
    );
  }
}

// POST - добавление реакции
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

    const { emojiShortcode } = await request.json();

    if (!emojiShortcode) {
      return NextResponse.json(
        { error: 'Shortcode эмодзи обязателен' },
        { status: 400 }
      );
    }

    // Находим эмодзи
    const emoji = await Emoji.findOne({ shortcode: emojiShortcode });
    if (!emoji) {
      return NextResponse.json(
        { error: 'Эмодзи не найден' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли уже такая реакция
    const existingReaction = await Reaction.findOne({
      user: user._id,
      post: post._id,
      emoji: emoji._id
    });

    if (existingReaction) {
      return NextResponse.json(
        { error: 'Реакция уже существует' },
        { status: 400 }
      );
    }

    // Создаем новую реакцию
    const reaction = new Reaction({
      user: user._id,
      post: post._id,
      emoji: emoji._id
    });

    await reaction.save();

    const populatedReaction = await Reaction.findById(reaction._id)
      .populate('user', 'username avatar')
      .populate('emoji', 'shortcode url name')
      .lean();

    return NextResponse.json(populatedReaction, { status: 201 });

  } catch (error) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении реакции' },
      { status: 500 }
    );
  }
});

// DELETE - удаление реакции
export const DELETE = requireAuth(async (
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

    const { searchParams } = new URL(request.url);
    const emojiShortcode = searchParams.get('emoji');

    if (!emojiShortcode) {
      return NextResponse.json(
        { error: 'Shortcode эмодзи обязателен' },
        { status: 400 }
      );
    }

    // Находим эмодзи
    const emoji = await Emoji.findOne({ shortcode: emojiShortcode });
    if (!emoji) {
      return NextResponse.json(
        { error: 'Эмодзи не найден' },
        { status: 404 }
      );
    }

    // Удаляем реакцию
    const deletedReaction = await Reaction.findOneAndDelete({
      user: user._id,
      post: post._id,
      emoji: emoji._id
    });

    if (!deletedReaction) {
      return NextResponse.json(
        { error: 'Реакция не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Реакция удалена' });

  } catch (error) {
    console.error('Remove reaction error:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении реакции' },
      { status: 500 }
    );
  }
});