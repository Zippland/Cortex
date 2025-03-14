import { NextResponse } from 'next/server';
import { aiModels } from '../../models';

// 确保每次请求都获取最新的模型
export async function GET() {
  try {
    // 清除导入缓存，确保重新导入最新的模型
    Object.keys(require.cache).forEach(key => {
      if (key.includes('/app/models/')) {
        delete require.cache[key];
      }
    });
    
    // 重新导入模型
    const { aiModels: freshModels } = require('../../models');
    
    return NextResponse.json({ models: freshModels });
  } catch (error) {
    console.error('获取AI模型失败:', error);
    return NextResponse.json(
      { error: '获取AI模型失败' },
      { status: 500 }
    );
  }
} 