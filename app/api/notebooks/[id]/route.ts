import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 笔记本文件存储目录
const NOTEBOOK_DIR = path.join(process.cwd(), 'notebooks');

// 获取特定笔记本内容
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // 在Next.js 15中，params是一个Promise对象，需要先await
    const { id } = await params;
    
    // 防止目录遍历攻击
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json(
        { error: '无效的笔记本ID' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(NOTEBOOK_DIR, `${id}.md`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '笔记本不存在' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('获取笔记本内容失败:', error);
    return NextResponse.json(
      { error: '获取笔记本内容失败' },
      { status: 500 }
    );
  }
}

// 删除笔记本
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 在Next.js 15中，params是一个Promise对象，需要先await
    const { id } = await params;
    
    // 防止目录遍历攻击
    if (id.includes('..') || id.includes('/') || id.includes('\\')) {
      return NextResponse.json(
        { error: '无效的笔记本ID' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(NOTEBOOK_DIR, `${id}.md`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '笔记本不存在' },
        { status: 404 }
      );
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除笔记本失败:', error);
    return NextResponse.json(
      { error: '删除笔记本失败' },
      { status: 500 }
    );
  }
} 