import React from 'react';
import confetti from 'canvas-confetti';
import { Player } from '../types/mahjong';

interface GameOverModalProps {
  players: Player[];
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ players, onRestart }) => {
  React.useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  }, []);

  // スコア順にソート
  const ranked = [...players].map((p, originalIdx) => ({
    ...p,
    originalIdx,
  })).sort((a, b) => b.score - a.score);

  const rankBadges = [
    'bg-yellow-400 text-black',
    'bg-slate-300 text-black',
    'bg-amber-700 text-white',
    'bg-gray-700 text-white',
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3">
      <div className="w-[500px] max-w-[94%] max-h-[94%] overflow-y-auto bg-gradient-to-b from-[#13241b] to-[#0a140f] border-2 border-yellow-500/80 rounded-2xl p-5 text-white shadow-2xl text-center">
        <h2 className="text-3xl font-black text-amber-400 tracking-wider mb-1">
          対 局 終 了
        </h2>
        <p className="text-xs text-gray-300 mb-6">東風戦の全局が終了しました</p>

        {/* 順位一覧 */}
        <div className="flex flex-col gap-3 mb-6">
          {ranked.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-500/20 border-yellow-400/60 shadow-lg'
                  : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${rankBadges[idx]}`}
                >
                  {idx + 1}
                </span>
                <span className="font-bold text-base">{p.name}</span>
                {idx === 0 && (
                  <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded font-black shadow">
                    優勝 🏆
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-amber-300 tabular-nums">
                  {p.score.toLocaleString()}
                </span>
                <span className="text-xs text-gray-300 ml-1">点</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-xl shadow-xl transition-transform active:scale-95"
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
};
