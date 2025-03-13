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
    if (message.name === session.ai1.name) return 'bg-blue-50 border-blue-200 text-blue-800';
    if (message.name === session.ai2.name) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  // 切换笔记本显示状态
  const toggleNotebooks = () => {
    setShowNotebooks(!showNotebooks);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-indigo-100">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-800">
          辩题：{session.topic}
        </h1>
        <div className="flex flex-col md:flex-row justify-between gap-3 text-sm">
          <div className="flex items-center justify-center md:justify-start bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
            <span className="mr-2 font-bold">第一位辩手:</span>
            <span className="font-medium">{session.ai1.name}</span>
          </div>
          <div className="flex items-center justify-center md:justify-start bg-green-100 text-green-700 px-4 py-2 rounded-lg">
            <span className="mr-2 font-bold">第二位辩手:</span>
            <span className="font-medium">{session.ai2.name}</span>
          </div>
          <div className="flex items-center justify-center md:justify-start bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg">
            <span className="mr-2 font-bold">当前回合:</span>
            <span className="font-medium">{session.currentRound}</span>
          </div>
        </div>
      </div>

      {/* 自动辩论控制面板 - 改为更紧凑的样式 */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <span className="text-xs font-medium text-gray-700 mr-2">自动辩论:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoMode} 
              onChange={toggleAutoMode} 
              className="sr-only peer"
              disabled={session.isComplete || loading}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
          {autoMode && 
            <span className="ml-2 text-xs text-indigo-600">已开启</span>
          }
        </div>
      </div>

      {/* 用户确认面板 - 仅在需要确认时显示 */}
      {session.userConfirmationNeeded && (
        <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
          <div className="flex items-center mb-3 text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-medium text-lg">AI已更新笔记本</h3>
          </div>
          <p className="text-amber-700 mb-5 pl-8">
            辩论已经进行了一段时间，AI们已经更新了他们的笔记本。您可以查看笔记本内容，然后决定是否继续辩论。
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleContinueDebate}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              继续辩论
            </button>
            <button
              onClick={onReset}
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              结束辩论
            </button>
          </div>
        </div>
      )}

      {/* 笔记本内容展示 */}
      {showNotebooks && (
        <div className="mb-8 space-y-5">
          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
            <div className="flex items-center mb-3 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <div className="font-medium">{session.ai1.name}的笔记本</div>
            </div>
            <div className="whitespace-pre-wrap text-sm bg-white border border-blue-100 p-4 rounded-lg shadow-inner">
              {session.ai1Notebook || '（暂无笔记）'}
            </div>
          </div>
          
          <div className="p-5 rounded-xl border border-green-200 bg-green-50 shadow-sm">
            <div className="flex items-center mb-3 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <div className="font-medium">{session.ai2.name}的笔记本</div>
            </div>
            <div className="whitespace-pre-wrap text-sm bg-white border border-green-100 p-4 rounded-lg shadow-inner">
              {session.ai2Notebook || '（暂无笔记）'}
            </div>
          </div>
        </div>
      )}

      {/* 对话消息区域 - 改为左右布局 */}
      <div className="mb-8 max-h-[600px] overflow-y-auto p-4 pr-4 custom-scrollbar rounded-xl border border-gray-100 bg-gray-50 shadow-inner">
        <div className="space-y-4">
          {session.messages.map((message, index) => {
            // 忽略系统消息，通常这些是内部提示
            if (message.role === 'system') return null;
            
            // 确定消息是来自哪个AI
            const isAi1Message = message.name === session.ai1.name;
            const isAi2Message = message.name === session.ai2.name;
            
            // 如果不是AI1或AI2的消息，则居中显示（例如系统通知）
            if (!isAi1Message && !isAi2Message) {
              return (
                <div key={index} className="flex justify-center my-4">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-[80%] text-sm">
                    {message.content}
                  </div>
                </div>
              );
            }
            
            return (
              <div 
                key={index} 
                className={`flex ${isAi1Message ? 'justify-start' : 'justify-end'} mb-4`}
              >
                <div 
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                    isAi1Message 
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 rounded-bl-none' 
                      : 'bg-green-50 border border-green-200 text-green-800 rounded-br-none'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center text-sm">
                    {isAi1Message && <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>}
                    {isAi2Message && <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>}
                    {getSpeakerName(message)}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {!session.isComplete && !autoMode && !session.userConfirmationNeeded && (
          <button
            onClick={handleContinueDebate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm transition-all flex items-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                正在生成回复...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                继续辩论
              </>
            )}
          </button>
        )}
        
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          重新开始
        </button>

        <button
          onClick={toggleNotebooks}
          className={`px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm transition-all flex items-center ${
            showNotebooks 
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-500 border border-amber-300' 
              : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          {showNotebooks ? '隐藏笔记本' : '查看笔记本'}
        </button>
      </div>

      {session.isComplete && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center shadow-sm">
          <div className="text-yellow-700 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium mb-1">辩论已结束</p>
            <p className="text-sm">您可以点击"重新开始"发起新的辩论</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
        }
      `}</style>
    </div>
  );
} 