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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">AI辩论平台</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-center text-red-700">
            {error}
          </div>
        )}
        
        {loading && !session && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2">正在生成辩论...</p>
          </div>
        )}
        
        {!session && !loading ? (
          <DebateForm onStartDebate={handleStartDebate} />
        ) : session ? (
          <DebateViewer 
            session={session} 
            onContinueDebate={handleContinueDebate} 
            onReset={handleReset}
            key={`debate-${session.topic}-${initialAutoMode ? 'auto' : 'manual'}`}
            initialAutoMode={initialAutoMode}
          />
        ) : null}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>本平台使用OpenAI的gpt-4o-mini模型提供AI辩论服务</p>
          <p className="mt-1">AI笔记本会自动保存，可在<Link href="/notebooks" className="text-blue-500 hover:underline">笔记本管理</Link>中查看</p>
        </div>
      </div>
    </main>
  );
}
