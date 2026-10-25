import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RotateCw, Smartphone, FlipHorizontal, MessageSquare } from 'lucide-react';
import {
  ActionType,
  ChatMessage,
  GameState,
  Player,
  Tile,
} from '../types/mahjong';
import { TileView } from './TileView';
import { RiverView } from './RiverView';
import { MeldView } from './MeldView';
import { CenterView } from './CenterView';
import { ActionControls } from './ActionControls';
import { ScoreModal } from './ScoreModal';
import { GameOverModal } from './GameOverModal';
import { ChatOverlay, SpeechBubble } from './ChatOverlay';
import { BeginnerGuidePanel } from './BeginnerGuidePanel';
import { getActionAdvice, getDiscardAdvice } from '../logic/advisor';
import { getWaitingTiles } from '../logic/shanten';
import { sounds } from '../utils/audio';

interface MahjongTableProps {
  gameState: GameState;
  myPlayerIndex: number;
  onDiscard: (tile: Tile, declareRiichi: boolean) => void;
  onAction: (action: ActionType, tiles?: Tile[]) => void;
  onNextRound: () => void;
  onRestart: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string, isQuick?: boolean) => void;
  roomId?: string;
  isBeginnerMode: boolean;
  onToggleBeginnerMode: () => void;
}

export const MahjongTable: React.FC<MahjongTableProps> = ({
  gameState,
  myPlayerIndex,
  onDiscard,
  onAction,
  onNextRound,
  onRestart,
  chatMessages,
  onSendChatMessage,
  roomId,
  isBeginnerMode,
  onToggleBeginnerMode,
}) => {
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [isRiichiDeclaring, setIsRiichiDeclaring] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 画面向き制御: 'auto' (端末の縦横に従う) | 'landscape' (強制横画面) | 'portrait' (強制縦画面)
  const [orientationMode, setOrientationMode] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  // 強制横画面時の回転方向 (90deg または -90deg)
  const [rotateClockwise, setRotateClockwise] = useState<boolean>(true);

  // ビューポート実寸の追跡 (スマホ内ブラウザやアドレスバー伸縮に完全追従)
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  // 縦画面時の卓エリア実寸追跡
  const portraitTableAreaRef = useRef<HTMLDivElement>(null);
  const [portraitAreaSize, setPortraitAreaSize] = useState<{ w: number; h: number }>({
    w: 360,
    h: 360,
  });

  useEffect(() => {
    const updateViewport = () => {
      const w = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewport({ w: Math.round(w), h: Math.round(h) });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  const isWindowPortrait = viewport.w < viewport.h;
  const isLandscapeLayout =
    orientationMode === 'landscape' || (orientationMode === 'auto' && !isWindowPortrait);

  // 縦長ウィンドウのまま横画面モードにした場合はコンテナ全体を90度回転
  const isCssRotated = isWindowPortrait && isLandscapeLayout;
  const logicalW = isCssRotated ? viewport.h : viewport.w;
  const logicalH = isCssRotated ? viewport.w : viewport.h;

  // 縦画面モードの中央卓コンテナのサイズ監視
  useEffect(() => {
    if (isLandscapeLayout) return;
    const el = portraitTableAreaRef.current;
    if (!el) return;

    const updateArea = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPortraitAreaSize({ w: rect.width, h: rect.height });
      }
    };

    updateArea();
    const ro = new ResizeObserver(updateArea);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLandscapeLayout, viewport.w, viewport.h, isBeginnerMode]);

  const me = gameState.players[myPlayerIndex];
  const isMyTurn = gameState.currentTurn === myPlayerIndex && gameState.phase === 'PLAYING';
  const myActions = gameState.pendingActions[myPlayerIndex] || {
    canChi: [],
    canPon: [],
    canKan: [],
    canRiichi: [],
    canTsumo: false,
    canRon: false,
  };

  // 初心者モード用のアドバイス計算
  const discardAdvice = useMemo(() => {
    if (!isBeginnerMode || !isMyTurn) return null;
    return getDiscardAdvice(gameState, myPlayerIndex);
  }, [isBeginnerMode, isMyTurn, gameState, myPlayerIndex]);

  const actionAdvice = useMemo(() => {
    if (!isBeginnerMode) return null;
    const hasAnyAction =
      myActions.canRon ||
      myActions.canTsumo ||
      myActions.canRiichi.length > 0 ||
      myActions.canPon.length > 0 ||
      myActions.canChi.length > 0 ||
      myActions.canKan.length > 0;
    if (!hasAnyAction) return null;
    return getActionAdvice(myActions, gameState, myPlayerIndex);
  }, [isBeginnerMode, myActions, gameState, myPlayerIndex]);

  const waitingTilesWhenNotTurn = useMemo(() => {
    if (!isBeginnerMode || isMyTurn) return [];
    if (me.hand.length % 3 !== 1) return [];
    return getWaitingTiles(me.hand, me.melds);
  }, [isBeginnerMode, isMyTurn, me.hand, me.melds]);

  // プレイヤーの相対位置計算 (0:自分, 1:下家(右), 2:対面(上), 3:上家(左))
  const getPlayerByRelativePos = (offset: number): Player => {
    const idx = (myPlayerIndex + offset) % 4;
    return gameState.players[idx];
  };

  const getRelativeIndex = (offset: number): number => {
    return (myPlayerIndex + offset) % 4;
  };

  const rightPlayer = getPlayerByRelativePos(1);
  const topPlayer = getPlayerByRelativePos(2);
  const leftPlayer = getPlayerByRelativePos(3);

  // 最新チャットの吹き出し表示用
  const getLatestPlayerChat = (pIndex: number): ChatMessage | undefined => {
    const now = Date.now();
    return chatMessages
      .slice()
      .reverse()
      .find((m) => m.senderIndex === pIndex && now - m.timestamp < 4000);
  };

  // 牌をクリックしたときの処理
  const handleTileClick = (tile: Tile) => {
    if (!isMyTurn) return;

    if (isRiichiDeclaring) {
      const isCandidate = myActions.canRiichi.some((t) => t.id === tile.id);
      if (isCandidate) {
        sounds.playRiichi();
        onDiscard(tile, true);
        setIsRiichiDeclaring(false);
        setSelectedTileId(null);
      }
      return;
    }

    if (selectedTileId === tile.id) {
      sounds.playDiscard();
      onDiscard(tile, false);
      setSelectedTileId(null);
    } else {
      setSelectedTileId(tile.id);
    }
  };

  // アクションボタン処理
  const handleActionClick = (type: ActionType, tiles?: Tile[]) => {
    if (type === 'riichi') {
      setIsRiichiDeclaring(true);
    } else {
      if (type === 'tsumo' || type === 'ron') {
        sounds.playWin();
      } else if (type === 'chi' || type === 'pon' || type === 'kan') {
        sounds.playCall();
      }
      onAction(type, tiles);
    }
  };

  // 横画面・縦画面の切り替え処理
  const handleToggleOrientation = async () => {
    if (isLandscapeLayout) {
      try {
        await (screen.orientation as any)?.unlock?.();
      } catch {
        // ignore
      }
      setOrientationMode('portrait');
    } else {
      try {
        await (screen.orientation as any)?.lock?.('landscape');
      } catch {
        // LINEブラウザやiOS等ではCSS回転で対応
      }
      setOrientationMode('landscape');
    }
  };

  const recommendedTileId = discardAdvice?.recommendedTile.id;

  // ─── スケール計算 ───
  // 1) 縦画面用の中央麻雀卓ボード (基準: 640x480)
  const PORTRAIT_BOARD_W = 640;
  const PORTRAIT_BOARD_H = 480;
  const portraitBoardScale = Math.min(
    Math.max(0.35, (portraitAreaSize.w - 8) / PORTRAIT_BOARD_W),
    Math.max(0.35, (portraitAreaSize.h - 8) / PORTRAIT_BOARD_H),
    1.1
  );

  // 縦画面の手牌1枚あたりの動的サイズ (14枚すべてが必ず画面幅に収まるように計算)
  const portraitHandTileW = Math.max(
    21,
    Math.min(48, Math.floor((logicalW - 32) / 14))
  );
  const portraitHandTileH = Math.round(portraitHandTileW * 1.38);

  // 2) 横画面用の全体麻雀卓ボード (基準: 1120x620)
  const LANDSCAPE_BOARD_W = 1120;
  const LANDSCAPE_BOARD_H = 620;
  const landscapeBoardScale = Math.min(
    Math.max(0.35, (logicalW - 12) / LANDSCAPE_BOARD_W),
    Math.max(0.35, (logicalH - 12) / LANDSCAPE_BOARD_H),
    1.15
  );

  // ルートラッパーのスタイル (強制横画面時は90度回転して画面全体にフィット)
  const rootWrapperStyle: React.CSSProperties = isCssRotated
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: `${viewport.h}px`,
        height: `${viewport.w}px`,
        transform: `translate(-50%, -50%) rotate(${rotateClockwise ? 90 : -90}deg)`,
        transformOrigin: 'center center',
      }
    : {
        position: 'fixed',
        inset: 0,
        width: `${viewport.w}px`,
        height: `${viewport.h}px`,
      };

  // 手牌リストの描画ヘルパー
  const renderMyHandTiles = (tileCustomSize?: { w: number; h: number }, isCompact = false) => {
    const baseHand = me.hand.filter((t) => t.id !== gameState.currentDrawnTile?.id);
    const drawnTile =
      gameState.currentDrawnTile && gameState.currentTurn === myPlayerIndex
        ? gameState.currentDrawnTile
        : null;

    return (
      <div className={`flex items-end justify-center ${isCompact ? 'gap-[1.5px]' : 'gap-1'}`}>
        {baseHand.map((tile) => {
          const isSelectableRiichi =
            isRiichiDeclaring && myActions.canRiichi.some((t) => t.id === tile.id);
          const isRecommended =
            isBeginnerMode && isMyTurn && !isRiichiDeclaring && tile.id === recommendedTileId;

          return (
            <div key={tile.id} className="relative flex flex-col items-center">
              {isRecommended && (
                <span
                  className={`absolute ${
                    isCompact ? '-top-4 text-[8px] px-1 py-0' : '-top-6 text-[10px] px-1.5 py-0.5'
                  } z-20 whitespace-nowrap bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black rounded-full shadow-lg border border-white animate-bounce pointer-events-none`}
                >
                  🌟おすすめ
                </span>
              )}
              <TileView
                tile={tile}
                size="lg"
                customSize={tileCustomSize}
                isSelected={selectedTileId === tile.id}
                onClick={() => handleTileClick(tile)}
                className={
                  isSelectableRiichi
                    ? 'ring-2 ring-red-500 animate-pulse rounded-[4px]'
                    : isRecommended
                    ? 'ring-2 ring-yellow-400 rounded-[4px]'
                    : ''
                }
              />
            </div>
          );
        })}

        {drawnTile && (
          <div
            className={`${
              isCompact ? 'ml-1.5 pl-1.5' : 'ml-3 pl-2'
            } border-l border-white/25 relative flex flex-col items-center`}
          >
            {isBeginnerMode &&
              isMyTurn &&
              !isRiichiDeclaring &&
              drawnTile.id === recommendedTileId && (
                <span
                  className={`absolute ${
                    isCompact ? '-top-4 text-[8px] px-1 py-0' : '-top-6 text-[10px] px-1.5 py-0.5'
                  } z-20 whitespace-nowrap bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black rounded-full shadow-lg border border-white animate-bounce pointer-events-none`}
                >
                  🌟おすすめ
                </span>
              )}
            <TileView
              tile={drawnTile}
              size="lg"
              customSize={tileCustomSize}
              isSelected={selectedTileId === drawnTile.id}
              onClick={() => handleTileClick(drawnTile)}
              className={
                isRiichiDeclaring && myActions.canRiichi.some((t) => t.id === drawnTile.id)
                  ? 'ring-2 ring-red-500 animate-pulse rounded-[4px]'
                  : isBeginnerMode &&
                    isMyTurn &&
                    !isRiichiDeclaring &&
                    drawnTile.id === recommendedTileId
                  ? 'ring-2 ring-yellow-400 rounded-[4px]'
                  : ''
              }
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={rootWrapperStyle}
      className="overflow-hidden bg-gradient-to-br from-[#0c2417] via-[#091d12] to-[#040e08] select-none flex flex-col"
    >
      {!isLandscapeLayout ? (
        /* =========================================================
         * 📱 縦画面モード (スマホ縦持ちで全体が100%収まる専用レイアウト)
         * ========================================================= */
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          {/* 1. 上部コントロールバー */}
          <div className="w-full px-2 py-1.5 bg-black/60 border-b border-white/10 flex items-center justify-between gap-1 shrink-0 z-30">
            <div className="flex items-center gap-1.5 min-w-0">
              {roomId ? (
                <div className="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 text-[10px] text-amber-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>合言葉:{roomId}</span>
                </div>
              ) : (
                <span className="text-xs font-black text-amber-300 tracking-wide pl-1">
                  🀄 電脳麻雀卓
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* 横画面回転ボタン */}
              <button
                onClick={handleToggleOrientation}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[11px] font-black shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>横画面にする</span>
              </button>

              {/* 初心者ガイド切替 */}
              <button
                onClick={onToggleBeginnerMode}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black border transition-all active:scale-95 cursor-pointer ${
                  isBeginnerMode
                    ? 'bg-emerald-500 text-black border-yellow-300'
                    : 'bg-black/60 text-gray-300 border-white/20'
                }`}
              >
                🔰ガイド:{isBeginnerMode ? 'ON' : 'OFF'}
              </button>

              {/* チャット開閉ボタン */}
              <button
                onClick={() => setIsChatOpen((prev) => !prev)}
                className="relative p-1.5 rounded-full bg-emerald-700 text-white border border-emerald-400/50 shadow active:scale-95 cursor-pointer"
                title="チャット"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {chatMessages.length > 0 && !isChatOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                )}
              </button>
            </div>
          </div>

          {/* 2. 初心者ガイド (ドック表示・卓に被らない) */}
          <BeginnerGuidePanel
            isBeginnerMode={isBeginnerMode}
            onToggleBeginnerMode={onToggleBeginnerMode}
            discardAdvice={discardAdvice}
            actionAdvice={actionAdvice}
            isMyTurn={isMyTurn}
            waitingTilesWhenNotTurn={waitingTilesWhenNotTurn}
            docked={true}
            onQuickDiscard={(tile) => {
              if (isMyTurn) {
                sounds.playDiscard();
                onDiscard(tile, false);
                setSelectedTileId(null);
              }
            }}
          />

          {/* 3. 中央麻雀卓エリア (自動スケーリングで4人全員＋河＋中央盤が100%収まる) */}
          <div
            ref={portraitTableAreaRef}
            className="w-full flex-1 relative overflow-hidden flex items-center justify-center"
          >
            <div
              style={{
                width: `${PORTRAIT_BOARD_W}px`,
                height: `${PORTRAIT_BOARD_H}px`,
                transform: `scale(${portraitBoardScale})`,
                transformOrigin: 'center center',
              }}
              className="bg-[#143d27] rounded-3xl border-[8px] border-[#382414] shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between p-3 shrink-0"
            >
              {/* 対面 (上) */}
              <div className="w-full flex items-center justify-center gap-3 relative">
                <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(2))} position="top" />
                <div className="flex items-center gap-1.5 bg-black/35 px-2.5 py-0.5 rounded-lg border border-white/10">
                  <span className="text-xs font-bold text-gray-200">{topPlayer.name}</span>
                  <span className="text-xs font-black text-amber-300 tabular-nums">
                    {topPlayer.score.toLocaleString()}点
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {topPlayer.hand.map((tile) => (
                    <TileView key={tile.id} isBack size="xs" />
                  ))}
                </div>
                <MeldView melds={topPlayer.melds} size="xs" />
              </div>

              {/* 左(上家) ・ 中央4河&センター ・ 右(下家) */}
              <div className="w-full flex-1 flex items-center justify-between px-1">
                {/* 上家 (左) */}
                <div className="relative flex flex-col items-center justify-center w-16">
                  <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(3))} position="left" />
                  <span className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    {leftPlayer.name}
                  </span>
                  <span className="text-[11px] font-black text-amber-300 tabular-nums mb-1">
                    {leftPlayer.score.toLocaleString()}
                  </span>
                  <div className="flex flex-col gap-[1px]">
                    {leftPlayer.hand.slice(0, 13).map((tile) => (
                      <TileView
                        key={tile.id}
                        isBack
                        customSize={{ w: 15, h: 21 }}
                        isRotated
                      />
                    ))}
                  </div>
                  <div className="mt-1">
                    <MeldView melds={leftPlayer.melds} size="xs" />
                  </div>
                </div>

                {/* 中央 (4人の河 + CenterView) */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <RiverView
                    discards={topPlayer.discards}
                    riichiTurn={topPlayer.riichiTurn}
                    lastDiscardId={gameState.lastDiscardTile?.id}
                    rotation={180}
                  />

                  <div className="flex items-center gap-1.5">
                    <RiverView
                      discards={leftPlayer.discards}
                      riichiTurn={leftPlayer.riichiTurn}
                      lastDiscardId={gameState.lastDiscardTile?.id}
                      rotation={270}
                    />

                    <CenterView
                      roundWind={gameState.roundWind}
                      roundNumber={gameState.roundNumber}
                      honba={gameState.honba}
                      riichiSticks={gameState.riichiSticks}
                      doraIndicators={gameState.doraIndicators}
                      remainingTiles={gameState.wall.length}
                      players={gameState.players}
                      dealerIndex={gameState.dealerIndex}
                      currentTurn={gameState.currentTurn}
                    />

                    <RiverView
                      discards={rightPlayer.discards}
                      riichiTurn={rightPlayer.riichiTurn}
                      lastDiscardId={gameState.lastDiscardTile?.id}
                      rotation={90}
                    />
                  </div>

                  <RiverView
                    discards={me.discards}
                    riichiTurn={me.riichiTurn}
                    lastDiscardId={gameState.lastDiscardTile?.id}
                    rotation={0}
                  />
                </div>

                {/* 下家 (右) */}
                <div className="relative flex flex-col items-center justify-center w-16">
                  <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(1))} position="right" />
                  <span className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    {rightPlayer.name}
                  </span>
                  <span className="text-[11px] font-black text-amber-300 tabular-nums mb-1">
                    {rightPlayer.score.toLocaleString()}
                  </span>
                  <div className="flex flex-col gap-[1px]">
                    {rightPlayer.hand.slice(0, 13).map((tile) => (
                      <TileView
                        key={tile.id}
                        isBack
                        customSize={{ w: 15, h: 21 }}
                        isRotated
                      />
                    ))}
                  </div>
                  <div className="mt-1">
                    <MeldView melds={rightPlayer.melds} size="xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 下部：自分のステータス・鳴き牌・アクション・全幅14枚手牌 */}
          <div className="w-full px-1.5 pt-1.5 pb-2.5 bg-gradient-to-t from-black/90 via-[#081c11]/95 to-[#0c2618]/90 border-t-2 border-[#382414] flex flex-col items-center shrink-0 z-20 relative">
            <SpeechBubble message={getLatestPlayerChat(myPlayerIndex)} position="bottom" />

            {/* アクションボタンバー (コンパクト表示) */}
            <ActionControls
              actions={myActions}
              onAction={handleActionClick}
              isRiichiDeclaring={isRiichiDeclaring}
              onCancelRiichi={() => setIsRiichiDeclaring(false)}
              actionAdvice={actionAdvice}
              compact={true}
            />

            {/* 自分の情報バー & 鳴き牌 */}
            <div className="w-full flex items-center justify-between gap-2 px-1.5 mb-1">
              <div className="flex items-center gap-2 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-xs font-black text-emerald-400">{me.name}</span>
                <span className="text-sm font-black text-amber-300 tabular-nums">
                  {me.score.toLocaleString()}{' '}
                  <span className="text-[10px] text-gray-300">点</span>
                </span>
                {me.isRiichi && (
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">
                    リーチ
                  </span>
                )}
                {isMyTurn && (
                  <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-black animate-pulse">
                    あなたの番 (2回タップで打牌)
                  </span>
                )}
              </div>

              {/* 自分の鳴き牌 */}
              <div className="flex justify-end">
                <MeldView melds={me.melds} size="xs" />
              </div>
            </div>

            {/* 自分の手牌 (画面横幅いっぱいに14枚すべて表示) */}
            <div className="w-full flex items-end justify-center pt-4 pb-0.5 overflow-visible">
              {renderMyHandTiles({ w: portraitHandTileW, h: portraitHandTileH }, true)}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================
         * 💻 横画面モード (スマホ横回転・タブレット・PC用フルスケール卓)
         * ========================================================= */
        <div className="w-full h-full flex items-center justify-center overflow-hidden p-1">
          <div
            style={{
              width: `${LANDSCAPE_BOARD_W}px`,
              height: `${LANDSCAPE_BOARD_H}px`,
              transform: `scale(${landscapeBoardScale})`,
              transformOrigin: 'center center',
            }}
            className="relative bg-[#143d27] rounded-3xl border-[10px] border-[#382414] shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col justify-between p-3 overflow-hidden shrink-0"
          >
            {/* 左上: ルームID */}
            {roomId && (
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 text-xs text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                合言葉: <span className="text-yellow-200 tracking-wider font-mono">{roomId}</span>
              </div>
            )}

            {/* 右上: 画面回転・反転・初心者ガイド・チャット */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              {isCssRotated && (
                <button
                  onClick={() => setRotateClockwise((prev) => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900/85 hover:bg-gray-800 text-amber-300 border border-amber-400/50 text-xs font-bold shadow cursor-pointer active:scale-95"
                  title="上下の向きを反転"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>向き反転</span>
                </button>
              )}

              <button
                onClick={handleToggleOrientation}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black text-xs font-black shadow cursor-pointer active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>縦画面に戻す</span>
              </button>

              <button
                onClick={onToggleBeginnerMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg border transition-all active:scale-95 cursor-pointer ${
                  isBeginnerMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black border-yellow-300 ring-2 ring-yellow-300/40'
                    : 'bg-black/60 text-gray-300 border-white/20 hover:bg-black/80'
                }`}
              >
                <span>🔰 初心者ガイド: {isBeginnerMode ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setIsChatOpen((prev) => !prev)}
                className="relative p-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/50 shadow-lg active:scale-95 cursor-pointer"
                title="チャットを開く"
              >
                <MessageSquare className="w-4 h-4" />
                {chatMessages.length > 0 && !isChatOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                )}
              </button>
            </div>

            {/* 🔰 初心者ガイドパネル */}
            <BeginnerGuidePanel
              isBeginnerMode={isBeginnerMode}
              onToggleBeginnerMode={onToggleBeginnerMode}
              discardAdvice={discardAdvice}
              actionAdvice={actionAdvice}
              isMyTurn={isMyTurn}
              waitingTilesWhenNotTurn={waitingTilesWhenNotTurn}
              docked={false}
              onQuickDiscard={(tile) => {
                if (isMyTurn) {
                  sounds.playDiscard();
                  onDiscard(tile, false);
                  setSelectedTileId(null);
                }
              }}
            />

            {/* ─── 対面 (上) ─── */}
            <div className="w-full flex flex-col items-center relative">
              <div className="relative flex items-center gap-3">
                <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(2))} position="top" />
                <div className="flex flex-col items-center bg-black/35 px-2.5 py-1 rounded-lg border border-white/10">
                  <span className="text-xs font-bold text-gray-200">{topPlayer.name}</span>
                  <span className="text-xs font-black text-amber-300 tabular-nums">
                    {topPlayer.score.toLocaleString()} 点
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {topPlayer.hand.map((tile) => (
                    <TileView key={tile.id} isBack size="sm" />
                  ))}
                </div>
                <MeldView melds={topPlayer.melds} size="xs" />
              </div>
            </div>

            {/* ─── 卓中央部 (左・中央・右) ─── */}
            <div className="w-full flex-1 flex items-center justify-between px-4 min-h-0">
              {/* 上家 (左) */}
              <div className="relative flex flex-col items-center justify-center w-24">
                <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(3))} position="left" />
                <span className="text-xs font-bold text-gray-200">{leftPlayer.name}</span>
                <span className="text-xs font-black text-amber-300 tabular-nums mb-1.5">
                  {leftPlayer.score.toLocaleString()} 点
                </span>
                <div className="flex flex-col gap-0.5">
                  {leftPlayer.hand.slice(0, 13).map((tile) => (
                    <TileView key={tile.id} isBack customSize={{ w: 18, h: 25 }} isRotated />
                  ))}
                </div>
                <div className="mt-1.5">
                  <MeldView melds={leftPlayer.melds} size="xs" />
                </div>
              </div>

              {/* 卓中央 (捨て牌河 4面 & 中央ステータスボード) */}
              <div className="flex flex-col items-center justify-center gap-1.5 scale-[0.92] origin-center">
                <RiverView
                  discards={topPlayer.discards}
                  riichiTurn={topPlayer.riichiTurn}
                  lastDiscardId={gameState.lastDiscardTile?.id}
                  rotation={180}
                />

                <div className="flex items-center gap-2">
                  <RiverView
                    discards={leftPlayer.discards}
                    riichiTurn={leftPlayer.riichiTurn}
                    lastDiscardId={gameState.lastDiscardTile?.id}
                    rotation={270}
                  />

                  <CenterView
                    roundWind={gameState.roundWind}
                    roundNumber={gameState.roundNumber}
                    honba={gameState.honba}
                    riichiSticks={gameState.riichiSticks}
                    doraIndicators={gameState.doraIndicators}
                    remainingTiles={gameState.wall.length}
                    players={gameState.players}
                    dealerIndex={gameState.dealerIndex}
                    currentTurn={gameState.currentTurn}
                  />

                  <RiverView
                    discards={rightPlayer.discards}
                    riichiTurn={rightPlayer.riichiTurn}
                    lastDiscardId={gameState.lastDiscardTile?.id}
                    rotation={90}
                  />
                </div>

                <RiverView
                  discards={me.discards}
                  riichiTurn={me.riichiTurn}
                  lastDiscardId={gameState.lastDiscardTile?.id}
                  rotation={0}
                />
              </div>

              {/* 下家 (右) */}
              <div className="relative flex flex-col items-center justify-center w-24">
                <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(1))} position="right" />
                <span className="text-xs font-bold text-gray-200">{rightPlayer.name}</span>
                <span className="text-xs font-black text-amber-300 tabular-nums mb-1.5">
                  {rightPlayer.score.toLocaleString()} 点
                </span>
                <div className="flex flex-col gap-0.5">
                  {rightPlayer.hand.slice(0, 13).map((tile) => (
                    <TileView key={tile.id} isBack customSize={{ w: 18, h: 25 }} isRotated />
                  ))}
                </div>
                <div className="mt-1.5">
                  <MeldView melds={rightPlayer.melds} size="xs" />
                </div>
              </div>
            </div>

            {/* ─── 自家 (下・自分) ─── */}
            <div className="w-full flex flex-col items-center relative pt-1">
              <SpeechBubble message={getLatestPlayerChat(myPlayerIndex)} position="bottom" />

              {/* アクションボタンバー */}
              <ActionControls
                actions={myActions}
                onAction={handleActionClick}
                isRiichiDeclaring={isRiichiDeclaring}
                onCancelRiichi={() => setIsRiichiDeclaring(false)}
                actionAdvice={actionAdvice}
              />

              <div className="w-full flex items-end justify-between px-3">
                {/* 自分の情報 */}
                <div className="flex flex-col items-start bg-black/45 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-emerald-400">{me.name}</span>
                    {me.isRiichi && (
                      <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">
                        リーチ
                      </span>
                    )}
                    {isMyTurn && (
                      <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-black animate-pulse">
                        あなたの番
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-amber-300 tabular-nums">
                    {me.score.toLocaleString()} <span className="text-xs text-gray-300">点</span>
                  </span>
                </div>

                {/* 自分の手牌 & ツモ牌 */}
                <div className="pb-0.5">
                  {renderMyHandTiles({ w: 46, h: 62 }, false)}
                </div>

                {/* 自分の鳴き牌 */}
                <div className="min-w-24 flex justify-end shrink-0">
                  <MeldView melds={me.melds} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チャットウィンドウ (縦画面・強制横画面どちらの向きにも追従) */}
      <ChatOverlay
        messages={chatMessages}
        onSendMessage={onSendChatMessage}
        myPlayerName={me.name}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />

      {/* 和了・流局モーダル */}
      {gameState.phase === 'ROUND_RESULT' && gameState.roundResult && (
        <ScoreModal
          roundResult={gameState.roundResult}
          players={gameState.players}
          onNextRound={onNextRound}
          isGameOver={gameState.roundNumber > 4}
        />
      )}

      {/* 終局モーダル */}
      {gameState.phase === 'GAME_OVER' && (
        <GameOverModal players={gameState.players} onRestart={onRestart} />
      )}
    </div>
  );
};
