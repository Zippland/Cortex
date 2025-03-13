import { NextResponse } from 'next/server';
import { aiModels } from '../../models';

export async function GET() {
  try {
    return NextResponse.json({ models: aiModels });
  } catch (error) {
    console.error('获取AI模型失败:', error);
    return NextResponse.json(
      { error: '获取AI模型失败' },
      { status: 500 }
    );
  }
} 