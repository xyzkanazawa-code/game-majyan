import React from 'react';
import { AvailableActions, Tile } from '../types/mahjong';
import { ActionAdvice } from '../logic/advisor';
import { TileView } from './TileView';

interface ActionControlsProps {
  actions: AvailableActions;
  onAction: (type: 'pass' | 'chi' | 'pon' | 'kan' | 'riichi' | 'tsumo' | 'ron', tiles?: Tile[]) => void;
  isRiichiDeclaring: boolean;
  onCancelRiichi: () => void;
  actionAdvice?: ActionAdvice | null;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  actions,
  onAction,
  isRiichiDeclaring,
  onCancelRiichi,
  actionAdvice,
}) => {
  const hasActions =
    actions.canRon ||
    actions.canTsumo ||
    actions.canRiichi.length > 0 ||
    actions.canPon.length > 0 ||
    actions.canChi.length > 0 ||
    actions.canKan.length > 0;

  if (isRiichiDeclaring) {
    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-red-950/90 border-2 border-red-500 p-3 rounded-2xl shadow-2xl backdrop-blur-md animate-pulse">
        <span className="text-white font-black text-sm">
          🔥 リーチ宣言中: 赤枠で光っている牌から捨てる牌を選んでください
        </span>
        <button
          onClick={onCancelRiichi}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-600 shadow cursor-pointer"
        >
          キャンセル
        </button>
      </div>
    );
  }

  if (!hasActions) return null;

  const rec = actionAdvice?.recommendedAction;

  const renderRecommendBadge = (label = '🌟おすすめ') => (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white animate-bounce">
      {label}
    </span>
  );

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/85 border-2 border-yellow-400/80 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* ロン */}
      {actions.canRon && (
        <button
          onClick={() => onAction('ron')}
          className="relative px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base rounded-xl shadow-lg ring-2 ring-red-400 active:scale-95 transition-all cursor-pointer"
        >
          {rec === 'ron' && renderRecommendBadge('🎉アガリ！')}
          ロン！
        </button>
      )}

      {/* ツモ */}
      {actions.canTsumo && (
        <button
          onClick={() => onAction('tsumo')}
          className="relative px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-base rounded-xl shadow-lg ring-2 ring-yellow-300 active:scale-95 transition-all cursor-pointer"
        >
          {rec === 'tsumo' && renderRecommendBadge('🎉アガリ！')}
          ツモ！
        </button>
      )}

      {/* リーチ */}
      {actions.canRiichi.length > 0 && (
        <button
          onClick={() => onAction('riichi')}
          className="relative px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-sm rounded-xl shadow ring-1 ring-orange-300 active:scale-95 transition-all cursor-pointer"
        >
          {rec === 'riichi' && renderRecommendBadge()}
          リーチ
        </button>
      )}

      {/* ポン */}
      {actions.canPon.length > 0 && (
        <button
          onClick={() => onAction('pon', actions.canPon[0])}
          className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow active:scale-95 transition-all cursor-pointer"
        >
          {rec === 'pon' && renderRecommendBadge()}
          ポン
        </button>
      )}

      {/* チー */}
      {actions.canChi.length > 0 && (
        <div className="flex gap-1.5">
          {actions.canChi.map((combo, idx) => (
            <button
              key={idx}
              onClick={() => onAction('chi', combo)}
              className="relative flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all cursor-pointer"
            >
              {rec === 'chi' && idx === 0 && renderRecommendBadge()}
              <span>チー</span>
              <div className="flex gap-0.5">
                {combo.map((t) => (
                  <TileView key={t.id} tile={t} size="sm" />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* カン */}
      {actions.canKan.length > 0 && (
        <button
          onClick={() => onAction('kan', actions.canKan[0])}
          className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow active:scale-95 transition-all cursor-pointer"
        >
          {rec === 'kan' && renderRecommendBadge()}
          カン
        </button>
      )}

      {/* パス (スルー) */}
      <button
        onClick={() => onAction('pass')}
        className={`relative px-4 py-2 font-bold text-xs rounded-xl border shadow active:scale-95 transition-all cursor-pointer ${
          rec === 'pass'
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
        }`}
      >
        {rec === 'pass' && renderRecommendBadge('🛡️パス推奨')}
        パス
      </button>
    </div>
  );
};
