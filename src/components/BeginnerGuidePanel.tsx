import React from 'react';
import { Lightbulb, Sparkles, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';
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
}

export const BeginnerGuidePanel: React.FC<BeginnerGuidePanelProps> = ({
  isBeginnerMode,
  onToggleBeginnerMode,
  discardAdvice,
  actionAdvice,
  isMyTurn,
  waitingTilesWhenNotTurn,
  onQuickDiscard,
}) => {
  return (
    <>
      {/* 画面右上の初心者モード ON/OFF 切り替えスイッチ */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={onToggleBeginnerMode}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg border transition-all active:scale-95 cursor-pointer ${
            isBeginnerMode
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-yellow-300 ring-2 ring-yellow-300/40'
              : 'bg-black/60 text-gray-300 border-white/20 hover:bg-black/80'
          }`}
        >
          <span>🔰 初心者ガイド: {isBeginnerMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 初心者モードOFFならパネルは非表示 */}
      {!isBeginnerMode ? null : (
        <div className="absolute top-14 left-4 z-25 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto">
          {/* 1. アクション（ポン・チー・カン・リーチ・ロン・ツモ）発生時の緊急ガイド */}
          {actionAdvice ? (
            <div
              className={`p-3.5 rounded-2xl border-2 shadow-2xl backdrop-blur-md transition-all animate-fade-in ${
                actionAdvice.urgency === 'win'
                  ? 'bg-amber-950/95 border-yellow-400 text-white'
                  : actionAdvice.urgency === 'good'
                  ? 'bg-emerald-950/95 border-emerald-400 text-white'
                  : 'bg-slate-900/95 border-amber-500/80 text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                <span className="text-xs font-black text-yellow-300 tracking-wide">
                  🔰 AIコーチのアクション案内
                </span>
              </div>
              <h4 className="text-sm font-black text-white mb-1">{actionAdvice.title}</h4>
              <p className="text-xs text-gray-200 leading-relaxed">{actionAdvice.description}</p>
            </div>
          ) : isMyTurn && discardAdvice ? (
            /* 2. 自分のツモ番：捨て牌アドバイス */
            <div className="p-3.5 rounded-2xl bg-gray-950/90 border-2 border-emerald-400/80 shadow-2xl backdrop-blur-md text-white">
              {/* ヘッダーと現在のシャンテン状況 */}
              <div className="flex items-center justify-between border-b border-emerald-700/50 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-xs font-black text-emerald-300">🔰 捨て牌アドバイス</span>
                </div>
                <span className="text-[11px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-600/50">
                  {discardAdvice.statusText}
                </span>
              </div>

              {/* おすすめ牌と理由 */}
              <div className="flex items-center gap-3 bg-black/50 p-2.5 rounded-xl border border-white/10 mb-2">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[10px] text-yellow-300 font-black mb-0.5">おすすめ</span>
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
                <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-500/40 px-2.5 py-1.5 rounded-xl mb-1.5">
                  <span className="text-[11px] font-black text-amber-300 shrink-0">
                    🎯 アガリ牌(待ち):
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {discardAdvice.waitingTiles.map((wt, i) => (
                      <TileView
                        key={i}
                        tile={{ id: 8000 + i, suit: wt.suit, value: wt.value }}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* リーチ警戒アラート */}
              {discardAdvice.dangerWarning && (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-200 bg-red-950/60 border border-red-500/40 px-2.5 py-1.5 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{discardAdvice.dangerWarning}</span>
                </div>
              )}
            </div>
          ) : (
            /* 3. 相手の番のとき：自分の待ち牌やミニ知識を表示 */
            <div className="p-3 rounded-2xl bg-gray-950/75 border border-emerald-500/40 shadow-xl backdrop-blur-xs text-white">
              <div className="flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">🔰 初心者サポート稼働中</span>
              </div>
              {waitingTilesWhenNotTurn.length > 0 ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-yellow-300 shrink-0">
                    🔥 テンパイ中！アガリ牌:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {waitingTilesWhenNotTurn.map((wt, i) => (
                      <TileView
                        key={i}
                        tile={{ id: 8500 + i, suit: wt.suit, value: wt.value }}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  あなたの番になると、切るべきおすすめの牌に「🌟おすすめ」マークが表示されます。ポンやチーのチャンスでも鳴くべきか案内します！
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
