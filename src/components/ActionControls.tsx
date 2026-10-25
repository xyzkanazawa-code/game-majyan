import React from 'react';
import { AvailableActions, Tile } from '../types/mahjong';
import { TileView } from './TileView';

interface ActionControlsProps {
  actions: AvailableActions;
  onAction: (type: 'pass' | 'chi' | 'pon' | 'kan' | 'riichi' | 'tsumo' | 'ron', tiles?: Tile[]) => void;
  isRiichiDeclaring: boolean;
  onCancelRiichi: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  actions,
  onAction,
  isRiichiDeclaring,
  onCancelRiichi,
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
          🔥 リーチ宣言中: 捨てる牌を選択してください
        </span>
        <button
          onClick={onCancelRiichi}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-600 shadow"
        >
          キャンセル
        </button>
      </div>
    );
  }

  if (!hasActions) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/85 border-2 border-yellow-400/80 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
      {/* ロン */}
      {actions.canRon && (
        <button
          onClick={() => onAction('ron')}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-base rounded-xl shadow-lg ring-2 ring-red-400 active:scale-95 transition-all"
        >
          ロン！
        </button>
      )}

      {/* ツモ */}
      {actions.canTsumo && (
        <button
          onClick={() => onAction('tsumo')}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-base rounded-xl shadow-lg ring-2 ring-yellow-300 active:scale-95 transition-all"
        >
          ツモ！
        </button>
      )}

      {/* リーチ */}
      {actions.canRiichi.length > 0 && (
        <button
          onClick={() => onAction('riichi')}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-sm rounded-xl shadow ring-1 ring-orange-300 active:scale-95 transition-all"
        >
          リーチ
        </button>
      )}

      {/* ポン */}
      {actions.canPon.length > 0 && (
        <button
          onClick={() => onAction('pon', actions.canPon[0])}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow active:scale-95 transition-all"
        >
          ポン
        </button>
      )}

      {/* チー */}
      {actions.canChi.length > 0 && (
        <div className="flex gap-1">
          {actions.canChi.map((combo, idx) => (
            <button
              key={idx}
              onClick={() => onAction('chi', combo)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all"
            >
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
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow active:scale-95 transition-all"
        >
          カン
        </button>
      )}

      {/* パス (スルー) */}
      <button
        onClick={() => onAction('pass')}
        className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl border border-gray-600 shadow active:scale-95 transition-all"
      >
        パス
      </button>
    </div>
  );
};
