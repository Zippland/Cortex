'use client';

import { useState, useEffect } from 'react';
import { AIModel } from '../models/types';

interface DebateFormProps {
  onStartDebate: (topic: string, ai1Id: string, ai2Id: string, rounds: number) => void;
}

export default function DebateForm({ onStartDebate }: DebateFormProps) {
  const [topic, setTopic] = useState('');
  const [ai1Id, setAi1Id] = useState('');
  const [ai2Id, setAi2Id] = useState('');
  const [rounds, setRounds] = useState(3);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    
    onStartDebate(topic, ai1Id, ai2Id, rounds);
  };

  if (loading) {
    return <div className="text-center py-10">正在加载AI模型...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">发起AI辩论</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            辩题
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：人工智能是否会取代人类工作？"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="ai1" className="block text-sm font-medium text-gray-700 mb-1">
              第一位辩手
            </label>
            <select
              id="ai1"
              value={ai1Id}
              onChange={(e) => setAi1Id(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="ai2" className="block text-sm font-medium text-gray-700 mb-1">
              第二位辩手
            </label>
            <select
              id="ai2"
              value={ai2Id}
              onChange={(e) => setAi2Id(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        
        <div className="mb-6">
          <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-1">
            辩论回合数
          </label>
          <input
            type="number"
            id="rounds"
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value))}
            min="1"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          开始辩论
        </button>
      </form>
    </div>
  );
} 