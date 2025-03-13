'use client';

import { useState } from 'react';
import { DebateSession, DebateMessage } from '../models/types';

interface DebateViewerProps {
  session: DebateSession;
  onContinueDebate: () => void;
  onReset: () => void;
}

export default function DebateViewer({ session, onContinueDebate, onReset }: DebateViewerProps) {
  const [loading, setLoading] = useState(false);

  // 处理继续辩论
  const handleContinue = async () => {
    if (loading || session.isComplete) return;
    
    setLoading(true);
    await onContinueDebate();
    setLoading(false);
  };

  // 获取消息发送者的名称
  const getSpeakerName = (message: DebateMessage) => {
    if (message.name) return message.name;
    
    if (message.role === 'system') return '系统';
    if (message.role === 'user') return '用户';
    return '助手';
  };

  // 获取消息发送者的颜色
  const getSpeakerColor = (message: DebateMessage) => {
    if (message.name === session.ai1.name) return 'bg-blue-100 border-blue-300';
    if (message.name === session.ai2.name) return 'bg-green-100 border-green-300';
    return 'bg-gray-100 border-gray-300';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">辩题：{session.topic}</h1>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            第一位辩手：<span className="font-medium text-blue-600">{session.ai1.name}</span>
          </div>
          <div>
            第二位辩手：<span className="font-medium text-green-600">{session.ai2.name}</span>
          </div>
          <div>
            回合：{session.currentRound} / {session.rounds}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {session.messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${getSpeakerColor(message)}`}
          >
            <div className="font-medium mb-1">{getSpeakerName(message)}</div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        {!session.isComplete && (
          <button
            onClick={handleContinue}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '正在生成回复...' : '继续辩论'}
          </button>
        )}
        
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          重新开始
        </button>
      </div>

      {session.isComplete && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
          辩论已结束。您可以点击"重新开始"发起新的辩论。
        </div>
      )}
    </div>
  );
} 