import React, { useState } from 'react';
import { Lightbulb, Sparkles, ShieldAlert, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { ActionAdvice, DiscardAdvice, getTileJapaneseName } from '../logic/advisor';
import { Tile } from '../types/mahjong';
import { TileView } from './TileView';

interface BeginnerGuidePanelProps {
  isBeginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  discardAdvice: DiscardAdvice | null;
  actionAdvice: ActionAdvice | null;
  isMyTurn: boolean;
  waitingTilesWhenNotTurn: { suit: 'm' | 'p' | 's' | 'z'; value: number }[];
  onQuickDiscard?: (tile: Tile) => void;
  docked?: boolean; // スマホ縦画面用のドック表示モード
}

export const BeginnerGuidePanel: React.FC<BeginnerGuidePanelProps> = ({
  isBeginnerMode,
  discardAdvice,
  actionAdvice,
  isMyTurn,
  waitingTilesWhenNotTurn,
  onQuickDiscard,
  docked = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isBeginnerMode) return null;

  // ─── スマホ縦画面用：卓の上に重ならずスッキリ収まるドック型ガイド ───
  if (docked) {
    return (
      <div className="w-full px-2 pt-1 shrink-0 z-20">
        {actionAdvice ? (
          <div
            className={`px-3 py-2 rounded-xl border-2 shadow-lg flex items-center gap-2.5 ${
              actionAdvice.urgency === 'win'
                ? 'bg-amber-950/95 border-yellow-400 text-white'
                : actionAdvice.urgency === 'good'
                ? 'bg-emerald-950/95 border-emerald-400 text-white'
                : 'bg-slate-900/95 border-amber-500/80 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-yellow-300 truncate">
                {actionAdvice.title}
              </div>
              <p className="text-[11px] text-gray-200 leading-tight line-clamp-2">
                {actionAdvice.description}
              </p>
            </div>
          </div>
        ) : isMyTurn && discardAdvice ? (
          <div className="px-2.5 py-2 rounded-xl bg-gray-950/95 border border-emerald-400/80 shadow-lg text-white">
            {/* 1行目: 見出し + シャンテン数 */}
            <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-emerald-800/60">
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="text-[11px] font-black text-emerald-300">
                  🔰 捨て牌アドバイス
                </span>
              </div>
              <span className="text-[10px] bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-600/50 truncate">
                {discardAdvice.statusText}
              </span>
            </div>

            {/* 2行目: おすすめ牌(タップで即打牌) + 理由 */}
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => onQuickDiscard && onQuickDiscard(discardAdvice.recommendedTile)}
                className="flex flex-col items-center shrink-0 bg-black/60 px-2 py-1 rounded-lg border border-yellow-400/50 cursor-pointer active:scale-95"
              >
                <span className="text-[9px] text-yellow-300 font-black mb-0.5 whitespace-nowrap">
                  おすすめ
                </span>
                <TileView tile={discardAdvice.recommendedTile} size="xs" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-yellow-300 truncate">
                  【{getTileJapaneseName(discardAdvice.recommendedTile)}】を切るのがおすすめ！
                </div>
                <p className="text-[11px] text-gray-200 leading-tight line-clamp-2">
                  {discardAdvice.reason}
                </p>
                {discardAdvice.dangerWarning && (
                  <div className="flex items-center gap-1 text-[10px] text-red-300 font-bold mt-0.5 truncate">
                    <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate">{discardAdvice.dangerWarning}</span>
                  </div>
                )}
              </div>

              {/* テンパイ時の待ち牌 */}
              {discardAdvice.waitingTiles.length > 0 && (
                <div className="flex flex-col items-center bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded-lg shrink-0">
                  <span className="text-[9px] font-black text-amber-300 mb-0.5">🎯 待ち牌</span>
                  <div className="flex gap-0.5">
                    {discardAdvice.waitingTiles.slice(0, 4).map((wt, i) => (
                      <TileView
                        key={i}
                        tile={{ id: 8000 + i, suit: wt.suit, value: wt.value }}
                        size="xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-gray-950/80 border border-emerald-500/40 text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-emerald-300 shrink-0">
                🔰 AIコーチ:
              </span>
              {waitingTilesWhenNotTurn.length > 0 ? (
                <span className="text-[11px] font-black text-yellow-300 truncate">
                  🔥 テンパイ中！アガリ牌が出たらロン！
                </span>
              ) : (
                <span className="text-[11px] text-gray-300 truncate">
                  手番になると切るべき牌に「🌟おすすめ」が表示されます
                </span>
              )}
            </div>
            {waitingTilesWhenNotTurn.length > 0 && (
              <div className="flex gap-0.5 shrink-0">
                {waitingTilesWhenNotTurn.slice(0, 5).map((wt, i) => (
                  <TileView
                    key={i}
                    tile={{ id: 8500 + i, suit: wt.suit, value: wt.value }}
                    size="xs"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── 横画面・PC用フローティングガイド（折りたたみ可能） ───
  return (
    <div className="absolute top-12 left-3 z-25 w-76 max-w-[42%] pointer-events-auto">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-950/90 border border-emerald-400/70 text-emerald-300 text-xs font-black shadow-lg cursor-pointer hover:bg-gray-900"
        >
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
          <span>🔰 アドバイスを表示</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      ) : actionAdvice ? (
        <div
          className={`p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-all ${
            actionAdvice.urgency === 'win'
              ? 'bg-amber-950/95 border-yellow-400 text-white'
              : actionAdvice.urgency === 'good'
              ? 'bg-emerald-950/95 border-emerald-400 text-white'
              : 'bg-slate-900/95 border-amber-500/80 text-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <span className="text-xs font-black text-yellow-300">
                🔰 AIコーチのアクション案内
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
              title="折りたたむ"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-black text-white mb-1">{actionAdvice.title}</h4>
          <p className="text-xs text-gray-200 leading-relaxed">{actionAdvice.description}</p>
        </div>
      ) : isMyTurn && discardAdvice ? (
        <div className="p-3 rounded-2xl bg-gray-950/92 border-2 border-emerald-400/80 shadow-2xl backdrop-blur-md text-white">
          {/* ヘッダーと現在のシャンテン状況 */}
          <div className="flex items-center justify-between gap-2 border-b border-emerald-700/50 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-xs font-black text-emerald-300">🔰 捨て牌アドバイス</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-600/50 truncate">
                {discardAdvice.statusText}
              </span>
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
                title="折りたたむ"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* おすすめ牌と理由 */}
          <div className="flex items-center gap-2.5 bg-black/50 p-2 rounded-xl border border-white/10 mb-1.5">
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[10px] text-yellow-300 font-black mb-0.5 whitespace-nowrap">
                おすすめ
              </span>
              <TileView
                tile={discardAdvice.recommendedTile}
                size="sm"
                onClick={() => onQuickDiscard && onQuickDiscard(discardAdvice.recommendedTile)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-yellow-300 mb-0.5">
                【{getTileJapaneseName(discardAdvice.recommendedTile)}】を切るのがおすすめ！
              </div>
              <p className="text-[11px] text-gray-200 leading-snug">{discardAdvice.reason}</p>
            </div>
          </div>

          {/* テンパイ時の待ち牌プレビュー */}
          {discardAdvice.waitingTiles.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-xl mb-1">
              <span className="text-[11px] font-black text-amber-300 shrink-0">
                🎯 待ち:
              </span>
              <div className="flex gap-1 flex-wrap">
                {discardAdvice.waitingTiles.map((wt, i) => (
                  <TileView
                    key={i}
                    tile={{ id: 8000 + i, suit: wt.suit, value: wt.value }}
                    size="xs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* リーチ警戒アラート */}
          {discardAdvice.dangerWarning && (
            <div className="flex items-start gap-1.5 text-[11px] text-amber-200 bg-red-950/60 border border-red-500/40 px-2.5 py-1 rounded-lg">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>{discardAdvice.dangerWarning}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2.5 rounded-2xl bg-gray-950/80 border border-emerald-500/40 shadow-xl backdrop-blur-xs text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-300">🔰 初心者サポート稼働中</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
              title="折りたたむ"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
          {waitingTilesWhenNotTurn.length > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-yellow-300 shrink-0">
                🔥 テンパイ！待ち牌:
              </span>
              <div className="flex gap-1 flex-wrap">
                {waitingTilesWhenNotTurn.map((wt, i) => (
                  <TileView
                    key={i}
                    tile={{ id: 8500 + i, suit: wt.suit, value: wt.value }}
                    size="xs"
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-300 leading-snug">
              手番になると切るべき牌に「🌟おすすめ」が表示されます。鳴きの判断も案内します！
            </p>
          )}
        </div>
      )}
    </div>
  );
};
