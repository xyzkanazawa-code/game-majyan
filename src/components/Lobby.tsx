import React, { useState } from 'react';
import { Play, Users, LogIn, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LobbyProps {
  onStartSolo: (playerName: string) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (playerName: string, roomId: string) => void;
  isBeginnerMode: boolean;
  onToggleBeginnerMode: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  isBeginnerMode,
  onToggleBeginnerMode,
}) => {
  const [playerName, setPlayerName] = useState('マサ');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showJoinModal, setShowJoinModal] = useState(false);

  const toggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    onJoinRoom(playerName.trim() || 'マサ', roomIdInput.trim().toUpperCase());
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-radial from-[#1b3d2b] via-[#0d2217] to-[#06110b] text-white">
      {/* 背景の装飾牌グリッド */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-4 p-8 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="text-4xl select-none">🀄</span>
        ))}
      </div>

      {/* サウンド切り替え */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all text-gray-200 cursor-pointer"
        title={isMuted ? 'ミュート解除' : 'ミュート'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
      </button>

      {/* メインカード */}
      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-emerald-500/40 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* タイトルバッジ */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-bold text-emerald-300 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>本格 4人対戦麻雀</span>
        </div>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 tracking-wider mb-2">
          電脳 麻雀 卓
        </h1>
        <p className="text-xs text-emerald-200/70 mb-5">
          東風戦アリアルール ＆ リアルタイム対戦・チャット
        </p>

        {/* プレイヤーネーム入力 */}
        <div className="w-full mb-4 text-left">
          <label className="block text-xs font-bold text-emerald-300 mb-1.5 ml-1">
            プレイヤー名
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="お名前を入力"
            maxLength={10}
            className="w-full px-4 py-3 bg-gray-900/80 border border-emerald-500/40 rounded-xl text-white font-bold text-sm focus:outline-hidden focus:border-amber-400 transition-colors"
          />
        </div>

        {/* 初心者サポートモード切替 */}
        <div className="w-full mb-6">
          <button
            type="button"
            onClick={onToggleBeginnerMode}
            className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
              isBeginnerMode
                ? 'bg-emerald-950/90 border-emerald-400 shadow-lg ring-1 ring-emerald-400/40'
                : 'bg-gray-900/60 border-gray-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2.5 text-left">
              <span className="text-xl">🔰</span>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>初心者サポートモード</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isBeginnerMode ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isBeginnerMode ? 'ON (推奨)' : 'OFF'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-0.5">
                  おすすめの捨て牌や、ポン・チー・カンの判断を案内します
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* モード選択ボタン群 */}
        <div className="w-full flex flex-col gap-3">
          {/* 1人プレイ (CPU対戦) */}
          <button
            onClick={() => onStartSolo(playerName.trim() || 'マサ')}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-transform active:scale-95 border border-emerald-400/40 group cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
            <span>1人プレイ (CPU 3人と対戦)</span>
          </button>

          {/* ルーム作成 (ホスト) */}
          <button
            onClick={() => onCreateRoom(playerName.trim() || 'マサ')}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 border border-amber-400/40 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>部屋を作る (合言葉を発行)</span>
          </button>

          {/* ルーム参加 (ゲスト) */}
          <button
            onClick={() => setShowJoinModal(true)}
            className="w-full py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 font-semibold text-sm rounded-2xl border border-gray-600 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>部屋に入る (合言葉を入力)</span>
          </button>
        </div>

        {/* ルール注記 */}
        <div className="mt-8 pt-4 border-t border-white/10 w-full text-[11px] text-gray-400 flex justify-around">
          <span>喰いタンあり</span>
          <span>•</span>
          <span>赤ドラ3枚</span>
          <span>•</span>
          <span>25000点持ち</span>
          <span>•</span>
          <span>東風戦</span>
        </div>
      </div>

      {/* 合言葉入力モーダル */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-amber-300 mb-2">部屋の合言葉を入力</h3>
            <p className="text-xs text-gray-400 mb-4">
              友達から共有された4桁〜6桁の合言葉（例: MAJ77）を入力してください
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="例: MAJ77"
                maxLength={8}
                className="w-full px-4 py-3 bg-gray-800 border border-emerald-500/40 rounded-xl text-center text-xl font-black tracking-widest text-yellow-300 uppercase focus:outline-hidden focus:border-yellow-400"
                autoFocus
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!roomIdInput.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow cursor-pointer"
                >
                  入室する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
