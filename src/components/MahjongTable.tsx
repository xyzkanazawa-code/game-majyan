import React, { useState, useEffect } from 'react';
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
}) => {
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [isRiichiDeclaring, setIsRiichiDeclaring] = useState(false);

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

  // 最新チャットの吹き出し表示用 (直近3秒以内のメッセージ)
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
      // リーチ宣言可能な牌かチェック
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
      // ダブルクリックまたは選択状態からの再タップで打牌
      sounds.playDiscard();
      onDiscard(tile, false);
      setSelectedTileId(null);
    } else {
      // 1回目のタップで選択（持ち上げ）
      setSelectedTileId(tile.id);
    }
  };

  // リーチ宣言モードの開始
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0c2417] via-[#091d12] to-[#040e08] flex items-center justify-center p-2 select-none">
      {/* 卓の木枠とマット */}
      <div className="relative w-full max-w-[1200px] h-full max-h-[820px] bg-[#143d27] rounded-3xl border-[10px] border-[#382414] shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4 overflow-hidden">
        
        {/* ルームID表示 (マルチ対戦時) */}
        {roomId && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/40 text-xs text-amber-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            合言葉: <span className="text-yellow-200 tracking-wider font-mono">{roomId}</span>
          </div>
        )}

        {/* ─── 対面 (上) ─── */}
        <div className="w-full flex flex-col items-center relative">
          <div className="relative flex items-center gap-4">
            <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(2))} position="top" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-300">{topPlayer.name}</span>
              <span className="text-xs font-black text-amber-300 tabular-nums">
                {topPlayer.score.toLocaleString()} 点
              </span>
            </div>
            {/* 対面の手牌 (裏向き) */}
            <div className="flex gap-0.5">
              {topPlayer.hand.map((tile) => (
                <TileView key={tile.id} isBack size="sm" />
              ))}
            </div>
            {/* 対面の鳴き牌 */}
            <MeldView melds={topPlayer.melds} size="sm" />
          </div>
        </div>

        {/* ─── 卓中央部 (左・中央・右) ─── */}
        <div className="w-full flex-1 flex items-center justify-between px-2">
          {/* 上家 (左) */}
          <div className="relative flex flex-col items-center justify-center w-28">
            <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(3))} position="left" />
            <span className="text-xs font-bold text-gray-300">{leftPlayer.name}</span>
            <span className="text-xs font-black text-amber-300 tabular-nums mb-2">
              {leftPlayer.score.toLocaleString()} 点
            </span>
            <div className="flex flex-col gap-0.5">
              {leftPlayer.hand.slice(0, 10).map((tile) => (
                <TileView key={tile.id} isBack size="sm" isRotated />
              ))}
            </div>
            <div className="mt-2">
              <MeldView melds={leftPlayer.melds} size="sm" />
            </div>
          </div>

          {/* 卓中央 (捨て牌河 4面 & 中央ステータスボード) */}
          <div className="flex flex-col items-center justify-center gap-2">
            {/* 対面の河 */}
            <div className="rotate-180">
              <RiverView
                discards={topPlayer.discards}
                riichiTurn={topPlayer.riichiTurn}
                lastDiscardId={gameState.lastDiscardTile?.id}
              />
            </div>

            {/* 左・中央インジケーター・右の河 */}
            <div className="flex items-center gap-3">
              <div className="-rotate-90">
                <RiverView
                  discards={leftPlayer.discards}
                  riichiTurn={leftPlayer.riichiTurn}
                  lastDiscardId={gameState.lastDiscardTile?.id}
                />
              </div>

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

              <div className="rotate-90">
                <RiverView
                  discards={rightPlayer.discards}
                  riichiTurn={rightPlayer.riichiTurn}
                  lastDiscardId={gameState.lastDiscardTile?.id}
                />
              </div>
            </div>

            {/* 自分の河 */}
            <div>
              <RiverView
                discards={me.discards}
                riichiTurn={me.riichiTurn}
                lastDiscardId={gameState.lastDiscardTile?.id}
              />
            </div>
          </div>

          {/* 下家 (右) */}
          <div className="relative flex flex-col items-center justify-center w-28">
            <SpeechBubble message={getLatestPlayerChat(getRelativeIndex(1))} position="right" />
            <span className="text-xs font-bold text-gray-300">{rightPlayer.name}</span>
            <span className="text-xs font-black text-amber-300 tabular-nums mb-2">
              {rightPlayer.score.toLocaleString()} 点
            </span>
            <div className="flex flex-col gap-0.5">
              {rightPlayer.hand.slice(0, 10).map((tile) => (
                <TileView key={tile.id} isBack size="sm" isRotated />
              ))}
            </div>
            <div className="mt-2">
              <MeldView melds={rightPlayer.melds} size="sm" />
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
          />

          <div className="w-full flex items-end justify-between px-6">
            {/* 自分の情報 */}
            <div className="flex flex-col items-start bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
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
            <div className="flex items-end gap-1 pb-1">
              {/* 配牌・手牌 */}
              {me.hand
                .filter((t) => t.id !== gameState.currentDrawnTile?.id)
                .map((tile) => {
                  const isSelectableRiichi = isRiichiDeclaring && myActions.canRiichi.some((t) => t.id === tile.id);

                  return (
                    <TileView
                      key={tile.id}
                      tile={tile}
                      size="lg"
                      isSelected={selectedTileId === tile.id}
                      onClick={() => handleTileClick(tile)}
                      className={isSelectableRiichi ? 'ring-2 ring-red-500 animate-pulse' : ''}
                    />
                  );
                })}

              {/* ツモ牌 (少し間を空けて右に表示) */}
              {gameState.currentDrawnTile && gameState.currentTurn === myPlayerIndex && (
                <div className="ml-3 pl-2 border-l border-white/20">
                  <TileView
                    tile={gameState.currentDrawnTile}
                    size="lg"
                    isSelected={selectedTileId === gameState.currentDrawnTile.id}
                    onClick={() => handleTileClick(gameState.currentDrawnTile!)}
                  />
                </div>
              )}
            </div>

            {/* 自分の鳴き牌 */}
            <div className="min-w-28 flex justify-end">
              <MeldView melds={me.melds} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* チャット機能 */}
      <ChatOverlay
        messages={chatMessages}
        onSendMessage={onSendChatMessage}
        myPlayerName={me.name}
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
        <GameOverModal
          players={gameState.players}
          onRestart={onRestart}
        />
      )}
    </div>
  );
};
