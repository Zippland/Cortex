'use client';

import { useState, useEffect } from 'react';
import { AIModel } from '../models/types';
import CreateAIModal from './CreateAIModal';

interface DebateFormProps {
  onStartDebate: (topic: string, ai1Id: string, ai2Id: string, autoMode: boolean) => void;
}

export default function DebateForm({ onStartDebate }: DebateFormProps) {
  const [topic, setTopic] = useState('');
  const [ai1Id, setAi1Id] = useState('');
  const [ai2Id, setAi2Id] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 加载AI模型
  useEffect(() => {
    async function loadModels() {
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          setAi1Id(data.models[0].id);
          setAi2Id(data.models.length > 1 ? data.models[1].id : data.models[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('加载AI模型失败:', error);
        setError('加载AI模型失败，请刷新页面重试');
        setLoading(false);
      }
    }

    loadModels();
  }, []);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('请输入辩题');
      return;
    }
    
    if (ai1Id === ai2Id) {
      setError('请选择两个不同的AI');
      return;
    }
    
    onStartDebate(topic, ai1Id, ai2Id, autoMode);
  };

  // 切换自动模式
  const toggleAutoMode = () => {
    setAutoMode(prev => !prev);
  };

  // 打开创建AI模态框
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // 关闭创建AI模态框
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // 成功创建AI后的回调
  const handleAICreated = (newModel: AIModel) => {
    setModels(prevModels => [...prevModels, newModel]);
    // 可选择自动选中新创建的AI
    setAi2Id(newModel.id);
  };

  if (loading) {
    return (
      <div className="text-center py-12 px-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3"></div>
        <p className="text-indigo-700">正在加载AI模型...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-flex items-center text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">发起辩论</h2>
        <p className="text-gray-600 mt-2">选择辩题和立场，开启一场思想碰撞</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            辩题
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="例如：人工智能是否会取代人类工作？"
            required
          />
          <p className="mt-1 text-xs text-gray-500">请输入一个有意义的辩题，以引发AI之间的深入讨论</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="ai1" className="block text-sm font-medium text-indigo-700">
                <div className="flex items-center">
                  <span className="mr-2">🔵</span>
                  第一位辩手
                </div>
              </label>
              <button
                type="button"
                onClick={openCreateModal}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                创建自定义AI
              </button>
            </div>
            <select
              id="ai1"
              value={ai1Id}
              onChange={(e) => setAi1Id(e.target.value)}
              className="w-full px-4 py-3 border border-indigo-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="ai2" className="block text-sm font-medium text-green-700">
                <div className="flex items-center">
                  <span className="mr-2">🟢</span>
                  第二位辩手
                </div>
              </label>
            </div>
            <select
              id="ai2"
              value={ai2Id}
              onChange={(e) => setAi2Id(e.target.value)}
              className="w-full px-4 py-3 border border-green-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 自动辩论设置 */}
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div className="font-medium text-gray-800">自动辩论模式</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoMode} 
                onChange={toggleAutoMode} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {autoMode ? '已启用' : '未启用'}
              </span>
            </label>
          </div>
          <div className="mt-3 text-sm text-gray-600 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              启用自动辩论后，系统将在每轮AI回复完成后自动进入下一轮辩论，无需手动点击。每更新完笔记本后，会询问是否继续辩论。
            </span>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all font-medium text-lg shadow-md"
        >
          开始辩论
        </button>
      </form>
      
      {/* 创建AI模态框 */}
      <CreateAIModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleAICreated}
      />
    </div>
  );
} 