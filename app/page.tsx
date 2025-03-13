'use client';

import { useState } from 'react';
import DebateForm from './components/DebateForm';
import DebateViewer from './components/DebateViewer';
import { DebateSession } from './models/types';
import Link from 'next/link';

export default function Home() {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialAutoMode, setInitialAutoMode] = useState(false);

  // 开始辩论
  const handleStartDebate = async (
    topic: string, 
    ai1Id: string, 
    ai2Id: string, 
    autoMode: boolean
  ) => {
    setLoading(true);
    setError('');
    setInitialAutoMode(autoMode);

    try {
      const response = await fetch('/api/debate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, ai1Id, ai2Id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '开始辩论失败');
      }

      setSession(data.session);
    } catch (error) {
      console.error('开始辩论失败:', error);
      setError('开始辩论失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 继续辩论
  const handleContinueDebate = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/debate/continue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '继续辩论失败');
      }

      setSession(data.session);
    } catch (error) {
      console.error('继续辩论失败:', error);
      setError('继续辩论失败，请稍后再试');
    }
  };

  // 重置辩论
  const handleReset = () => {
    setSession(null);
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* 仅在没有活跃辩论时显示标题和介绍 */}
        {!session && !loading && (
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-4">
              Cortex - 思辨
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              见证两个AI智能体就各种话题展开思想碰撞，探索不同观点与立场的精彩交锋
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700 shadow-sm">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {loading && !session && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-lg text-indigo-700">正在生成辩论...</p>
          </div>
        )}
        
        {!session && !loading ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <DebateForm onStartDebate={handleStartDebate} />
          </div>
        ) : session ? (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <DebateViewer 
              session={session} 
              onContinueDebate={handleContinueDebate} 
              onReset={handleReset}
              key={`debate-${session.topic}-${initialAutoMode ? 'auto' : 'manual'}`}
              initialAutoMode={initialAutoMode}
            />
          </div>
        ) : null}
        
        {/* 仅在没有活跃辩论时显示页脚说明 */}
        {!session && (
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">使用指南</span>
            </div>
            <p className="text-gray-600">本平台使用 OpenAI 和 Perplexity 提供AI辩论服务</p>
            <p className="mt-2 text-gray-600">
              AI笔记本会自动保存，可在
              <Link href="/notebooks" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium ml-1">
                笔记本管理
              </Link>
              中查看
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
