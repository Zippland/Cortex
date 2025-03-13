import fs from 'fs';
import path from 'path';
import { AIModel } from '../models/types';

// 笔记本文件存储目录
const NOTEBOOK_DIR = path.join(process.cwd(), 'notebooks');

// 知识库文件存储目录
const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

// 确保目录存在 (在导入时执行)
(function ensureDirectoriesExist() {
  // 确保笔记本目录存在
  if (!fs.existsSync(NOTEBOOK_DIR)) {
    fs.mkdirSync(NOTEBOOK_DIR, { recursive: true });
    console.log('已创建笔记本目录:', NOTEBOOK_DIR);
  }
  
  // 确保知识库目录存在
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    console.log('已创建知识库目录:', KNOWLEDGE_DIR);
  }
})();

// 确保笔记本目录存在 (旧函数，保留向后兼容性)
function ensureNotebookDirExists(): void {
  if (!fs.existsSync(NOTEBOOK_DIR)) {
    fs.mkdirSync(NOTEBOOK_DIR, { recursive: true });
  }
}

// 确保知识库目录存在 (旧函数，保留向后兼容性)
function ensureKnowledgeDirExists(): void {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
}

/**
 * 生成用于笔记本文件的唯一ID
 * 基于AI模型ID和辩题，确保可以在不同会话中识别同一AI对同一辩题的笔记
 */
function generateNotebookId(aiId: string, topic: string): string {
  // 处理空主题的情况
  if (!topic || topic.trim() === '') {
    const timestamp = new Date().getTime();
    return `${aiId}-untitled-${timestamp}`;
  }
  
  // 对文件名进行安全处理，保留中文字符
  // 移除文件系统不允许的字符: \ / : * ? " < > |
  const safeTopicName = topic
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_'); // 替换不允许的文件名字符为下划线
  
  // 限制文件名长度，避免过长
  const maxLength = 50;
  const truncatedTopic = safeTopicName.length > maxLength 
    ? safeTopicName.substring(0, maxLength) + '...' 
    : safeTopicName;
  
  return `${aiId}-${truncatedTopic}`;
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

/**
 * 从文件读取AI知识库内容
 * 知识库以AI ID命名，存储在knowledge文件夹中
 * 如果文件不存在，返回空字符串
 */
export function readKnowledgeFromFile(aiModel: AIModel): string {
  try {
    ensureKnowledgeDirExists();
    const filePath = path.join(KNOWLEDGE_DIR, `${aiModel.id}.md`);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    return '';
  } catch (error) {
    console.error(`读取知识库文件失败:`, error);
    return '';
  }
} 