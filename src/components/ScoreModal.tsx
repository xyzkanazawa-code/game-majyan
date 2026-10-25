import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, RoundResult } from '../types/mahjong';
import { TileView } from './TileView';

interface ScoreModalProps {
  roundResult: RoundResult;
  players: Player[];
  onNextRound: () => void;
  isGameOver?: boolean;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  roundResult,
  players,
  onNextRound,
  isGameOver = false,
}) => {
  useEffect(() => {
    if (roundResult.type === 'win') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [roundResult]);

  if (roundResult.type === 'exhaustive_draw') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3">
        <div className="w-[450px] max-w-[92%] max-h-[94%] overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-700 rounded-2xl p-5 text-white shadow-2xl text-center">
          <h2 className="text-2xl font-black text-amber-400 mb-2 tracking-wide">
            荒 牌 流 局
          </h2>
          <p className="text-sm text-gray-300 mb-6">山牌が全てなくなりました (ノーテン罰符精算)</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {players.map((p, idx) => {
              const delta = roundResult.scoreDelta[idx];
              const isTenpai = roundResult.tenpaiList ? roundResult.tenpaiList[idx] : false;

              return (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/80 border border-gray-700"
                >
                  <div className="text-left">
                    <span className="font-bold text-sm block">{p.name}</span>
                    <span className={`text-xs ${isTenpai ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {isTenpai ? '聴牌 (テンパイ)' : '不聴 (ノーテン)'}
                    </span>
                  </div>
                  <span
                    className={`font-black text-sm tabular-nums ${
                      delta > 0
                        ? 'text-emerald-400'
                        : delta < 0
                        ? 'text-rose-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onNextRound}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            {isGameOver ? '最終結果を見る' : '次の局へ進む'}
          </button>
        </div>
      </div>
    );
  }

  const win = roundResult.winResult;
  if (!win) return null;

  const winner = players[win.winnerIndex];
  const fromPlayer = win.fromPlayerIndex !== undefined ? players[win.fromPlayerIndex] : null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3">
      <div className="w-[520px] max-w-[95%] max-h-[94%] overflow-y-auto bg-gradient-to-b from-[#192b21] to-[#0e1a14] border-2 border-amber-500/80 rounded-2xl p-4 sm:p-6 text-white shadow-2xl">
        {/* 和了ヘッダー */}
        <div className="text-center pb-4 border-b border-amber-500/30">
          <div className="inline-block bg-amber-500 text-black px-4 py-1 rounded-full text-xs font-black tracking-widest mb-2 shadow">
            {win.isTsumo ? 'ツ モ 和 了' : 'ロ ン 和 了'}
          </div>
          <h2 className="text-2xl font-black text-amber-300">
            {winner.name} のアガリ！
          </h2>
          {fromPlayer && !win.isTsumo && (
            <p className="text-xs text-rose-300 mt-0.5">放銃: {fromPlayer.name}</p>
          )}
        </div>

        {/* 手牌とアガリ牌のプレビュー */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="flex gap-1 items-end flex-wrap justify-center bg-black/40 p-2.5 rounded-xl border border-white/10 shadow-inner">
            {winner.hand.map((tile) => (
              <TileView key={tile.id} tile={tile} size="sm" />
            ))}
            <div className="ml-2 pl-2 border-l border-white/20 flex flex-col items-center">
              <span className="text-[10px] text-amber-300 font-bold mb-0.5">アガリ牌</span>
              <TileView tile={win.winningTile} size="sm" isDora />
            </div>
          </div>
        </div>

        {/* 成立役リスト */}
        <div className="bg-black/30 rounded-xl p-3 mb-4 max-h-36 overflow-y-auto border border-emerald-600/30">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {win.yakuList.map((y, idx) => (
              <div key={idx} className="flex justify-between items-center px-2 py-1 rounded bg-white/5">
                <span className="font-semibold text-gray-200">{y.name}</span>
                <span className="text-amber-400 font-black">
                  {y.isYakuman ? '役満' : `${y.han} 翻`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 総合得点とタイトル */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-900/60 to-emerald-950/60 p-4 rounded-xl border border-amber-500/50 mb-5">
          <div>
            <div className="text-xs text-amber-200 font-bold">
              {win.fu > 0 ? `${win.fu} 符 ` : ''}{win.han} 翻
            </div>
            <div className="text-xl font-black text-amber-300 tracking-wide">
              {win.title}
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-yellow-300 tabular-nums">
              {win.score.toLocaleString()}
            </span>
            <span className="text-xs text-yellow-100 ml-1">点</span>
          </div>
        </div>

        {/* 進行ボタン */}
        <button
          onClick={onNextRound}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-base rounded-xl shadow-xl transition-transform active:scale-95"
        >
          {isGameOver ? '最終結果を見る' : '次の局へ進む'}
        </button>
      </div>
    </div>
  );
};
