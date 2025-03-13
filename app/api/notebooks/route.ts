import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { aiModels } from '../../models';

// 定义笔记本信息类型
interface NotebookInfo {
  id: string;
  aiId: string;
  aiName: string;
  topic: string;
  lastModified: string;
  fileSize: number;
}

// 笔记本文件存储目录
const NOTEBOOK_DIR = path.join(process.cwd(), 'notebooks');

export async function GET() {
  try {
    // 确保笔记本目录存在
    if (!fs.existsSync(NOTEBOOK_DIR)) {
      return NextResponse.json({ notebooks: [] });
    }

    // 读取所有笔记本文件
    const files = fs.readdirSync(NOTEBOOK_DIR);
    const notebookFiles = files.filter(file => file.endsWith('.md'));

    // 获取笔记本信息
    const notebooks: NotebookInfo[] = notebookFiles.map(file => {
      const filePath = path.join(NOTEBOOK_DIR, file);
      const stats = fs.statSync(filePath);
      
      // 从文件名解析信息 (格式: aiId-topic.md)
      const fileName = file.replace('.md', '');
      const firstDashIndex = fileName.indexOf('-');
      
      if (firstDashIndex === -1) {
        return null; // 不符合命名规则的文件跳过
      }
      
      const aiId = fileName.substring(0, firstDashIndex);
      const topic = fileName.substring(firstDashIndex + 1).replace(/-/g, ' ');
      
      // 查找AI模型名称
      const aiModel = aiModels.find(model => model.id === aiId);
      const aiName = aiModel ? aiModel.name : aiId;
      
      return {
        id: fileName,
        aiId,
        aiName,
        topic,
        lastModified: stats.mtime.toISOString(),
        fileSize: stats.size
      };
    }).filter((item): item is NotebookInfo => item !== null); // 过滤掉null值并指定类型
    
    // 按最后修改时间排序，最新的排在前面
    notebooks.sort((a, b) => {
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error('获取笔记本列表失败:', error);
    return NextResponse.json(
      { error: '获取笔记本列表失败' },
      { status: 500 }
    );
  }
} 