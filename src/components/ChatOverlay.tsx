import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Smile } from 'lucide-react';
import { ChatMessage } from '../types/mahjong';
import { sounds } from '../utils/audio';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isQuick?: boolean) => void;
  myPlayerName: string;
}

const QUICK_MESSAGES = [
  'よろしくお願いします！',
  'ありがとうございます！',
  'ナイス！👍',
  '悔しい〜！💦',
  '長考中…🤔',
  'ポン！',
  'リーチ！🔥',
  'お見事でした！',
];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  onSendMessage,
  myPlayerName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
    sounds.playChat();
  };

  const handleQuickSend = (msg: string) => {
    onSendMessage(msg, true);
    setShowQuick(false);
    sounds.playChat();
  };

  return (
    <>
      {/* チャット開閉フローティングボタン */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-2xl transition-transform active:scale-90 flex items-center justify-center border border-emerald-400/50"
          title="チャットを開く"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          {messages.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {/* チャットウィンドウ */}
      {isOpen && (
        <div className="fixed bottom-18 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] h-96 bg-gray-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-fade-in">
          {/* ヘッダー */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#173325] to-[#0f2319] border-b border-emerald-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm">対戦チャット</span>
            </div>
            <span className="text-[11px] text-gray-400">{myPlayerName}</span>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 text-xs">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-center italic">
                定型文やメッセージを送って<br />対戦相手と交流しましょう！
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderName === myPlayerName;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-gray-400 mb-0.5 px-1">
                      {msg.senderName}
                    </span>
                    <div
                      className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs break-words shadow-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-xs'
                      } ${msg.isQuick ? 'font-bold' : ''}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* クイック定型文ポップアップ */}
          {showQuick && (
            <div className="p-2 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {QUICK_MESSAGES.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSend(msg)}
                  className="px-2 py-1.5 bg-gray-700/80 hover:bg-emerald-700 text-[11px] rounded text-left truncate transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          {/* 入力欄 */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-gray-950 border-t border-gray-800 flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => setShowQuick(!showQuick)}
              className={`p-2 rounded-xl transition-colors ${
                showQuick ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title="定型文"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl shadow transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

/**
 * 卓上のプレイヤー吹き出し表示コンポーネント
 */
export const SpeechBubble: React.FC<{ message?: ChatMessage; position?: 'bottom' | 'top' | 'left' | 'right' }> = ({
  message,
  position = 'bottom',
}) => {
  if (!message) return null;

  const posClasses = {
    bottom: '-top-10 left-1/2 -translate-x-1/2',
    top: '-bottom-10 left-1/2 -translate-x-1/2',
    left: 'left-full ml-3 top-1/2 -translate-y-1/2',
    right: 'right-full mr-3 top-1/2 -translate-y-1/2',
  }[position];

  return (
    <div
      className={`absolute z-30 pointer-events-none px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-2xl border border-emerald-400 whitespace-nowrap animate-bounce ${posClasses}`}
    >
      {message.text}
    </div>
  );
};
