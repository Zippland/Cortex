import fs from 'fs';
import path from 'path';
import { AIModel } from '../models/types';

// 笔记本文件存储目录
const NOTEBOOK_DIR = path.join(process.cwd(), 'notebooks');

// 确保笔记本目录存在
function ensureNotebookDirExists(): void {
  if (!fs.existsSync(NOTEBOOK_DIR)) {
    fs.mkdirSync(NOTEBOOK_DIR, { recursive: true });
  }
}

/**
 * 生成用于笔记本文件的唯一ID
 * 基于AI模型ID和辩题，确保可以在不同会话中识别同一AI对同一辩题的笔记
 */
function generateNotebookId(aiId: string, topic: string): string {
  // 将辩题转换为URL安全的字符串
  const sanitizedTopic = topic
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // 移除特殊字符
    .replace(/\s+/g, '-');    // 空格替换为连字符
  
  return `${aiId}-${sanitizedTopic}`;
}

/**
 * 获取笔记本文件路径
 */
function getNotebookFilePath(notebookId: string): string {
  ensureNotebookDirExists();
  return path.join(NOTEBOOK_DIR, `${notebookId}.md`);
}

/**
 * 从文件读取AI笔记本内容
 * 如果文件不存在，返回空字符串
 */
export function readNotebookFromFile(aiModel: AIModel, topic: string): string {
  try {
    const notebookId = generateNotebookId(aiModel.id, topic);
    const filePath = getNotebookFilePath(notebookId);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    return '';
  } catch (error) {
    console.error(`读取笔记本文件失败:`, error);
    return '';
  }
}

/**
 * 将AI笔记本内容写入文件
 */
export function writeNotebookToFile(aiModel: AIModel, topic: string, content: string): void {
  try {
    const notebookId = generateNotebookId(aiModel.id, topic);
    const filePath = getNotebookFilePath(notebookId);
    
    ensureNotebookDirExists();
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`写入笔记本文件失败:`, error);
  }
}

/**
 * 获取笔记本的元数据信息
 * 包括创建时间、最后修改时间等
 */
export function getNotebookMetadata(aiModel: AIModel, topic: string) {
  try {
    const notebookId = generateNotebookId(aiModel.id, topic);
    const filePath = getNotebookFilePath(notebookId);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        created: stats.birthtime,
        modified: stats.mtime,
        size: stats.size
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error(`获取笔记本元数据失败:`, error);
    return { exists: false, error: String(error) };
  }
} 