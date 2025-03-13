'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { aiModels } from '../models';

interface NotebookInfo {
  id: string;
  aiId: string;
  aiName: string;
  topic: string;
  lastModified: string;
  fileSize: number;
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<NotebookInfo[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [notebookContent, setNotebookContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 加载所有笔记本信息
  useEffect(() => {
    async function loadNotebooks() {
      try {
        setLoading(true);
        const response = await fetch('/api/notebooks');
        const data = await response.json();
        
        if (data.notebooks) {
          setNotebooks(data.notebooks);
        }
      } catch (error) {
        console.error('加载笔记本失败:', error);
        setError('加载笔记本失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    }

    loadNotebooks();
  }, []);

  // 加载选定笔记本的内容
  const handleViewNotebook = async (notebookId: string) => {
    try {
      const response = await fetch(`/api/notebooks/${notebookId}`);
      const data = await response.json();
      
      if (data.content) {
        setSelectedNotebook(notebookId);
        setNotebookContent(data.content);
      } else {
        setError('无法加载笔记本内容');
      }
    } catch (error) {
      console.error('加载笔记本内容失败:', error);
      setError('加载笔记本内容失败');
    }
  };

  // 删除笔记本
  const handleDeleteNotebook = async (notebookId: string) => {
    if (!confirm('确定要删除这个笔记本吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 从列表中删除
        setNotebooks(notebooks.filter(n => n.id !== notebookId));
        
        // 如果正在查看这个笔记本，则清空内容
        if (selectedNotebook === notebookId) {
          setSelectedNotebook(null);
          setNotebookContent('');
        }
      } else {
        setError('删除笔记本失败');
      }
    } catch (error) {
      console.error('删除笔记本失败:', error);
      setError('删除笔记本失败');
    }
  };

  // 获取AI对应的颜色
  const getAIColor = (aiId: string): string => {
    switch (aiId) {
      case 'philosopher':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'scientist':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'politician':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 获取AI对应的名称
  const getAIName = (aiId: string): string => {
    const model = aiModels.find(m => m.id === aiId);
    return model ? model.name : aiId;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">加载笔记本中...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-8 text-center">AI笔记本管理</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-center text-red-700">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* 笔记本列表 */}
        <div className="md:w-1/3">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">所有笔记本</h2>
            
            {notebooks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>暂无笔记本</p>
                <p className="mt-2 text-sm">参与辩论后将自动创建笔记本</p>
                <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  开始新辩论
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {notebooks.map((notebook) => (
                  <div 
                    key={notebook.id}
                    className={`p-3 border rounded-md cursor-pointer hover:shadow transition-shadow ${
                      selectedNotebook === notebook.id ? 'border-blue-500 shadow' : 'border-gray-200'
                    }`}
                    onClick={() => handleViewNotebook(notebook.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium truncate max-w-xs">{notebook.topic}</div>
                        <div className={`text-sm px-2 py-0.5 rounded inline-block mt-1 ${getAIColor(notebook.aiId)}`}>
                          {getAIName(notebook.aiId)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotebook(notebook.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      上次更新: {new Date(notebook.lastModified).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 笔记本内容 */}
        <div className="md:w-2/3">
          <div className="bg-white p-4 rounded-lg shadow h-full">
            {selectedNotebook ? (
              <>
                <h2 className="text-xl font-medium mb-4">
                  {notebooks.find(n => n.id === selectedNotebook)?.topic || '笔记本内容'}
                </h2>
                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200 min-h-[400px]">
                  {notebookContent || '（笔记本内容为空）'}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>选择一个笔记本查看内容</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <Link href="/" className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
          返回辩论平台
        </Link>
      </div>
    </div>
  );
} 