'use client';

import { useState, useEffect, useRef } from 'react';
import { DebateSession, DebateMessage } from '../models/types';

interface DebateViewerProps {
  session: DebateSession;
  onContinueDebate: () => void;
  onReset: () => void;
  initialAutoMode?: boolean;
}

export default function DebateViewer({ 
  session, 
  onContinueDebate, 
  onReset,
  initialAutoMode = false
}: DebateViewerProps) {
  const [loading, setLoading] = useState(false);
  const [showNotebooks, setShowNotebooks] = useState(false);
  const [autoMode, setAutoMode] = useState(initialAutoMode);
  const autoModeRef = useRef(initialAutoMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);

  // 当autoMode状态变化时，更新ref
  useEffect(() => {
    autoModeRef.current = autoMode;

    // 如果开启了自动模式且不在加载状态，立即开始下一轮
    if (autoMode && !loading && !session.isComplete && !session.userConfirmationNeeded) {
      handleContinueDebate();
    }
  }, [autoMode]);

  // 监听消息数量变化，如果在自动模式下且消息增加了，立即开始下一轮
  useEffect(() => {
    // 检查消息是否增加
    if (session.messages.length > previousMessagesLengthRef.current) {
      // 更新前一次消息数量记录
      previousMessagesLengthRef.current = session.messages.length;
      
      // 如果在自动模式，且不在加载状态，且辩论未结束，且不需要用户确认，立即开始下一轮
      if (autoModeRef.current && !loading && !session.isComplete && !session.userConfirmationNeeded) {
        // 使用setTimeout确保UI有时间更新
        setTimeout(() => {
          handleContinueDebate();
        }, 100); // 极短的延迟，仅为了让UI有机会更新
      }
    }
  }, [session.messages.length]);

  // 监听用户确认状态变化
  useEffect(() => {
    // 如果需要用户确认，自动显示笔记本
    if (session.userConfirmationNeeded) {
      setShowNotebooks(true);
    }
  }, [session.userConfirmationNeeded]);

  // 初始化前一次消息数量
  useEffect(() => {
    previousMessagesLengthRef.current = session.messages.length;
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages.length]);

  // 处理继续辩论
  const handleContinueDebate = async () => {
    if (loading || session.isComplete) return;
    
    setLoading(true);
    await onContinueDebate();
    setLoading(false);
  };

  // 切换自动模式
  const toggleAutoMode = () => {
    setAutoMode(prev => !prev);
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

  // 切换笔记本显示状态
  const toggleNotebooks = () => {
    setShowNotebooks(!showNotebooks);
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
            当前回合：{session.currentRound}
          </div>
        </div>
      </div>

      {/* 自动辩论控制面板 */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="mr-3 font-medium">自动辩论：</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoMode} 
                onChange={toggleAutoMode} 
                className="sr-only peer"
                disabled={session.isComplete || loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            {autoMode 
              ? <span>自动模式已开启，AI回复后将立即进入下一轮辩论</span> 
              : <span>点击开关启用自动辩论模式</span>}
          </div>
        </div>
      </div>

      {/* 用户确认面板 - 仅在需要确认时显示 */}
      {session.userConfirmationNeeded && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h3 className="font-medium text-lg mb-2 text-yellow-800">AI已更新笔记本</h3>
          <p className="text-sm text-yellow-700 mb-4">
            辩论已经进行了一段时间，AI们已经更新了他们的笔记本。您可以查看笔记本内容，然后决定是否继续辩论。
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleContinueDebate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              继续辩论
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              结束辩论
            </button>
          </div>
        </div>
      )}

      {/* 笔记本内容展示 */}
      {showNotebooks && (
        <div className="mb-6 space-y-4">
          <div className="p-4 rounded-lg border border-blue-300 bg-blue-50">
            <div className="font-medium mb-1 text-blue-600">{session.ai1.name}的笔记本</div>
            <div className="whitespace-pre-wrap text-sm">
              {session.ai1Notebook || '（暂无笔记）'}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-green-300 bg-green-50">
            <div className="font-medium mb-1 text-green-600">{session.ai2.name}的笔记本</div>
            <div className="whitespace-pre-wrap text-sm">
              {session.ai2Notebook || '（暂无笔记）'}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto p-1">
        {session.messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${getSpeakerColor(message)}`}
          >
            <div className="font-medium mb-1">{getSpeakerName(message)}</div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!session.isComplete && !autoMode && !session.userConfirmationNeeded && (
          <button
            onClick={handleContinueDebate}
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

        <button
          onClick={toggleNotebooks}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          {showNotebooks ? '隐藏笔记本' : '查看笔记本'}
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