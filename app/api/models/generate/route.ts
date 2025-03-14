import { NextRequest, NextResponse } from 'next/server';
import { generateAIModel, createAIModelFile, updateIndexFile } from '../../../utils/modelGenerator';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // 获取用户描述
    const { description } = await request.json();

    // 验证输入
    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: '请提供AI描述' },
        { status: 400 }
      );
    }

    // 生成AI模型
    const { model, fileName } = await generateAIModel(description);

    // 创建模型文件
    const filePath = createAIModelFile(fileName, model);

    // 更新index.ts文件
    updateIndexFile(fileName);

    // 清除缓存以便新模型立即可用
    revalidatePath('/api/models');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: '成功创建AI模型',
      model: model,
      fileName: fileName
    });
  } catch (error) {
    console.error('创建AI模型失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建AI模型失败' },
      { status: 500 }
    );
  }
} 