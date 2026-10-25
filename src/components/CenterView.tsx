import React from 'react';
import { Player, Tile, Wind } from '../types/mahjong';
import { TileView } from './TileView';

interface CenterViewProps {
  roundWind: Wind;
  roundNumber: number;
  honba: number;
  riichiSticks: number;
  doraIndicators: Tile[];
  remainingTiles: number;
  players: Player[];
  dealerIndex: number;
  currentTurn: number;
}

export const CenterView: React.FC<CenterViewProps> = ({
  roundWind,
  roundNumber,
  honba,
  riichiSticks,
  doraIndicators,
  remainingTiles,
  players,
  dealerIndex,
  currentTurn,
}) => {
  const windKanji = ['東', '南', '西', '北'];

  return (
    <div className="relative w-72 h-44 bg-gradient-to-b from-[#1c382b] to-[#12241b] rounded-xl border-2 border-amber-600/60 shadow-2xl p-2.5 flex flex-col justify-between text-white select-none">
      {/* 上部: 局情報・残り牌・本場 */}
      <div className="flex items-center justify-between border-b border-emerald-700/50 pb-1.5 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded font-black text-xs">
            {windKanji[roundWind]} {roundNumber} 局
          </span>
          <span className="text-amber-300">
            {honba} 本場
          </span>
        </div>

        <div className="flex items-center gap-2">
          {riichiSticks > 0 && (
            <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/50 px-1.5 py-0.5 rounded text-[11px] text-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              供託: {riichiSticks * 1000}
            </div>
          )}
          <div className="text-gray-300 text-[11px]">
            残 <span className="text-yellow-400 font-bold text-xs">{remainingTiles}</span> 枚
          </div>
        </div>
      </div>

      {/* 中央部: ドラ表示牌 */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <span className="text-[11px] font-bold text-amber-400 mr-1">ドラ</span>
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-md border border-amber-500/30">
          {doraIndicators.map((tile, idx) => (
            <TileView key={tile.id || idx} tile={tile} size="sm" isDora />
          ))}
          {/* 未開示のドラ枠 (最大5枚) */}
          {Array.from({ length: Math.max(0, 5 - doraIndicators.length) }).map((_, idx) => (
            <TileView key={`hidden-${idx}`} isBack size="sm" />
          ))}
        </div>
      </div>

      {/* 下部: 4家の簡易ステータス & 手番インジケーター */}
      <div className="grid grid-cols-4 gap-1 text-[11px] pt-1 border-t border-emerald-700/50">
        {players.map((p, idx) => {
          const isCurrent = idx === currentTurn;
          const isDealer = idx === dealerIndex;

          return (
            <div
              key={p.id || idx}
              className={`flex flex-col items-center justify-center p-1 rounded transition-all ${
                isCurrent
                  ? 'bg-yellow-500/30 ring-1 ring-yellow-400 shadow-md font-bold'
                  : 'bg-black/30'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-gray-300 font-bold">
                  {windKanji[p.wind]}
                </span>
                {isDealer && (
                  <span className="text-[9px] bg-red-600 text-white px-0.5 rounded font-black">
                    親
                  </span>
                )}
                {p.isRiichi && (
                  <span className="text-[9px] bg-blue-500 text-white px-0.5 rounded font-bold">
                    立
                  </span>
                )}
              </div>
              <span className="text-amber-200 text-xs font-semibold tabular-nums">
                {p.score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
