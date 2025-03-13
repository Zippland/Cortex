'use client';

import { useState, useEffect, useRef } from 'react';
import { DebateSession, DebateMessage } from '../models/types';

interface DebateViewerProps {
  session: DebateSession;
  onContinueDebate: () => void;
  onReset: () => void;
  initialAutoMode?: boolean;
}

// 定义加载状态类型
type LoadingType = 'none' | 'speaking' | 'writing-notebook';

export default function DebateViewer({ 
  session, 
  onContinueDebate, 
  onReset,
  initialAutoMode = false
}: DebateViewerProps) {
  const [loading, setLoading] = useState(false);
  // 新增加载类型状态
  const [loadingType, setLoadingType] = useState<LoadingType>('none');
  const [showNotebooks, setShowNotebooks] = useState(false);
  const [autoMode, setAutoMode] = useState(initialAutoMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  // 用于跟踪更新前的笔记本内容
  const prevAi1NotebookRef = useRef<string | null>(null);
  const prevAi2NotebookRef = useRef<string | null>(null);
  // 新增：笔记本更新状态
  const [notebookUpdated, setNotebookUpdated] = useState(false);
  // 新增：显示笔记本更新提示
  const [showNotebookUpdateAlert, setShowNotebookUpdateAlert] = useState(false);

  // 监听消息数量变化，无论自动模式是否开启，都自动进入下一轮辩论
  useEffect(() => {
    // 检查消息是否增加
    if (session.messages.length > previousMessagesLengthRef.current) {
      // 更新前一次消息数量记录
      previousMessagesLengthRef.current = session.messages.length;
      
      // 如果不在加载状态，且辩论未结束，且不需要用户确认，立即开始下一轮
      if (!loading && !session.isComplete && !session.userConfirmationNeeded) {
        // 使用setTimeout确保UI有时间更新
        setTimeout(() => {
          // 设置加载类型为speaking，因为新消息后应该是等待AI发言
          setLoadingType('speaking');
          handleContinueDebate();
        }, 100); // 极短的延迟，仅为了让UI有机会更新
      }
    }
  }, [session.messages.length]);

  // 监听用户确认状态变化
  useEffect(() => {
    // 如果需要用户确认
    if (session.userConfirmationNeeded) {
      // 自动显示笔记本
      setShowNotebooks(true);
      // 停止任何加载状态
      setLoading(false);
      setLoadingType('none');
      
      // 显示笔记本更新提示
      setShowNotebookUpdateAlert(true);
      
      // 如果是自动模式，则自动继续辩论
      if (autoMode && !session.isComplete) {
        const timeoutId = setTimeout(() => {
          // 再次检查自动模式状态，以防在延迟期间用户关闭了自动模式
          if (autoMode) {
            // 准备更新笔记本的下一步，设置相应加载类型
            setLoadingType('writing-notebook');
            handleContinueDebate();
          }
        }, 2000);
        
        // 清理函数，防止组件卸载时出现问题
        return () => clearTimeout(timeoutId);
      }
    }
  }, [session.userConfirmationNeeded, autoMode, session.isComplete]);

  // 监听笔记本内容变化
  useEffect(() => {
    // 第一次渲染时保存初始笔记本内容
    if (prevAi1NotebookRef.current === null) {
      prevAi1NotebookRef.current = session.ai1Notebook || '';
      prevAi2NotebookRef.current = session.ai2Notebook || '';
      return;
    }

    // 检测笔记本是否有更新
    const notebook1Changed = prevAi1NotebookRef.current !== session.ai1Notebook;
    const notebook2Changed = prevAi2NotebookRef.current !== session.ai2Notebook;

    // 如果有一个笔记本发生了变化
    if (notebook1Changed || notebook2Changed) {
      // 标记笔记本已更新，触发动画效果
      setNotebookUpdated(true);
      
      // 如果当前是写笔记本状态，则重置加载状态
      if (loadingType === 'writing-notebook') {
        setLoadingType('none');
        setLoading(false);
        
        // 显示更新提示
        setShowNotebookUpdateAlert(true);
        
        // 3秒后自动隐藏更新提示
        setTimeout(() => {
          setShowNotebookUpdateAlert(false);
        }, 3000);
        
        // 如果是自动模式，则延迟后自动继续辩论
        if (autoMode && !session.isComplete) {
          setTimeout(() => {
            // 下一步将是AI回复，设置适合的加载类型
            setLoadingType('speaking');
            handleContinueDebate();
          }, 2000);
        }
      }
      
      // 5秒后重置更新状态，动画效果消失
      setTimeout(() => {
        setNotebookUpdated(false);
      }, 5000);
    }

    // 更新引用的笔记本内容
    prevAi1NotebookRef.current = session.ai1Notebook || '';
    prevAi2NotebookRef.current = session.ai2Notebook || '';
  }, [session.ai1Notebook, session.ai2Notebook, autoMode, session.isComplete]);

  // 初始化前一次消息数量
  useEffect(() => {
    previousMessagesLengthRef.current = session.messages.length;
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages.length, loading, loadingType, showNotebookUpdateAlert]);

  // 处理继续辩论
  const handleContinueDebate = async () => {
    if (session.isComplete) return; // 只检查辩论是否结束，移除loading检查
    
    setLoading(true);
    
    // 根据用户确认需求设置不同的加载类型
    if (session.userConfirmationNeeded) {
      // 如果需要用户确认，则接下来可能是在写笔记本
      setLoadingType('writing-notebook');
      // 隐藏笔记本更新提示
      setShowNotebookUpdateAlert(false);
    } else {
      // 否则是在等待AI发言
      setLoadingType('speaking');
    }
    
    try {
      await onContinueDebate();
    } finally {
      // 无论成功还是失败，确保loading状态被重置
      setLoading(false);
      setLoadingType('none');
    }
  };

  // 切换自动模式
  const toggleAutoMode = () => {
    // 即使在加载中也允许切换自动模式
    setAutoMode(prev => !prev);
    
    // 记录到控制台，帮助调试
    console.log("自动模式已切换为:", !autoMode);
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

  // 渲染当前加载状态提示
  const renderLoadingIndicator = () => {
    if (!loading) return null;

    if (loadingType === 'speaking') {
      return (
        <div className="flex justify-center my-4">
          <div className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-lg flex items-center shadow-sm border border-indigo-100">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">AI正在思考...</span>
              <span className="text-xs opacity-75">正在生成下一轮辩论的回应</span>
            </div>
          </div>
        </div>
      );
    }

    if (loadingType === 'writing-notebook') {
      return (
        <div className="flex justify-center my-4">
          <div className="bg-amber-50 text-amber-700 px-6 py-3 rounded-lg flex items-center shadow-sm border border-amber-100">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">正在更新笔记本...</span>
              <span className="text-xs opacity-75">AI正在整理观点并更新笔记</span>
            </div>
          </div>
        </div>
      );
    }

    // 默认加载状态
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-50 text-gray-700 px-6 py-3 rounded-lg flex items-center shadow-sm border border-gray-200">
          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-sm">正在处理...</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative">
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

      {/* 控制面板 - 组合自动继续开关和笔记本按钮 */}
      <div className="flex justify-end items-center mb-4 gap-3">
        {/* 笔记本按钮 - 添加更新动画效果 */}
        <button
          onClick={toggleNotebooks}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm transition-all text-xs font-medium relative ${
            showNotebooks 
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-500 border border-amber-300' 
              : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
          } ${notebookUpdated ? 'animate-pulse' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          {showNotebooks ? '隐藏笔记本' : '查看笔记本'}
          
          {/* 笔记本更新提示标记 */}
          {notebookUpdated && !showNotebooks && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>

        {/* 自动继续开关 */}
        <div className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <span className="text-xs font-medium text-gray-700 mr-2">自动继续:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoMode} 
                onChange={toggleAutoMode} 
                className="sr-only peer"
              disabled={session.isComplete}
              />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          {autoMode && 
            <span className="ml-2 text-xs text-indigo-600">已开启</span>
          }
        </div>
          </div>
          
      {/* 笔记本更新全局提示 - 无论笔记本是否打开都显示 */}
      {showNotebookUpdateAlert && (
        <div className="fixed top-4 right-4 z-50 bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded shadow-lg animate-fade-in max-w-sm">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">笔记本已更新!</p>
              <p className="text-sm">AI已整理观点并更新了笔记本内容</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowNotebooks(true);
              setShowNotebookUpdateAlert(false);
            }}
            className="mt-2 text-xs bg-amber-500 text-white py-1 px-3 rounded hover:bg-amber-600 transition-colors"
          >
            查看笔记本
          </button>
        </div>
      )}

      {/* 用户确认面板 - 仅在需要确认且不是自动模式时显示 */}
      {session.userConfirmationNeeded && !autoMode && (
        <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm animate-fade-in">
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

      {/* 对话消息区域 - 左右布局 */}
      <div className="mb-8 max-h-[600px] overflow-y-auto p-4 pr-4 custom-scrollbar rounded-xl border border-gray-100 bg-gray-50 shadow-inner" id="messages-container">
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

          {/* 加载状态指示器 */}
          {renderLoadingIndicator()}
          
          {/* 此div必须是消息容器中的最后一个元素，以便滚动正确 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        {/* 继续辩论按钮 - 仅在笔记本更新需要确认且不是自动模式时需要显示 */}
        {!session.isComplete && session.userConfirmationNeeded && !autoMode && (
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

      {/* 右侧滑出笔记本面板 */}
      <div 
        className={`fixed top-0 right-0 w-full md:w-1/2 lg:w-2/5 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          showNotebooks ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* 笔记本头部 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-amber-100">
          <h2 className="text-lg font-bold text-amber-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            AI笔记本
          </h2>
          <div className="flex items-center">
            {/* 在笔记本面板中添加自动继续的开关 */}
            <div className="inline-flex items-center mr-4 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-xs font-medium text-amber-700 mr-2">自动继续:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoMode} 
                  onChange={toggleAutoMode} 
                  className="sr-only peer"
                  disabled={session.isComplete}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <button 
              onClick={() => setShowNotebooks(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="关闭笔记本"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 笔记本内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gray-50">
          <div className={`p-5 rounded-xl border border-blue-200 bg-blue-50 shadow-sm transition-all ${notebookUpdated ? 'animate-pulse-light border-blue-400' : ''}`}>
            <div className="flex items-center mb-3 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <div className="font-medium">{session.ai1.name}的笔记本</div>
              {notebookUpdated && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">新更新</span>
              )}
            </div>
            <div className="whitespace-pre-wrap text-sm bg-white border border-blue-100 p-4 rounded-lg shadow-inner">
              {session.ai1Notebook || '（暂无笔记）'}
            </div>
          </div>
          
          <div className={`p-5 rounded-xl border border-green-200 bg-green-50 shadow-sm transition-all ${notebookUpdated ? 'animate-pulse-light border-green-400' : ''}`}>
            <div className="flex items-center mb-3 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <div className="font-medium">{session.ai2.name}的笔记本</div>
              {notebookUpdated && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">新更新</span>
              )}
            </div>
            <div className="whitespace-pre-wrap text-sm bg-white border border-green-100 p-4 rounded-lg shadow-inner">
              {session.ai2Notebook || '（暂无笔记）'}
            </div>
          </div>
        </div>
        
        {/* 笔记本底部操作栏 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowNotebooks(false)}
            className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm transition-all flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
            </svg>
            返回辩论
          </button>
        </div>
      </div>

      {/* 背景遮罩 - 只在移动设备上显示 */}
      {showNotebooks && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowNotebooks(false)}
        ></div>
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
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-light {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; background-opacity: 0.8; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-pulse-light {
          animation: pulse-light 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 