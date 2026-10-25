import React, { useState, useEffect, useRef } from 'react';
import {
  ActionType,
  ChatMessage,
  GameState,
  Tile,
} from './types/mahjong';
import {
  advanceToNextTurn,
  createInitialGame,
  executeCall,
  handleWin,
  processDiscard,
  startRound,
} from './logic/gameEngine';
import { chooseCpuAction, chooseCpuDiscard } from './logic/cpu';
import { PeerRoomManager, NetworkMessage } from './network/peerManager';
import { Lobby } from './components/Lobby';
import { MahjongTable } from './components/MahjongTable';
import { sounds } from './utils/audio';

export const App: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);

  const peerManagerRef = useRef<PeerRoomManager | null>(null);
  const isCpuThinkingRef = useRef<boolean>(false);

  // 1人プレイ開始
  const handleStartSolo = (playerName: string) => {
    const initialGame = createInitialGame([
      { id: 'player-0', name: playerName, isAi: false },
      { id: 'player-1', name: '下家 (風神)', isAi: true },
      { id: 'player-2', name: '対面 (雷神)', isAi: true },
      { id: 'player-3', name: '上家 (雀鬼)', isAi: true },
    ]);

    const roundGame = startRound(initialGame);
    setGameState(roundGame);
    setMyPlayerIndex(0);
    setRoomId('');
    setIsHost(true);
    setView('game');
    setChatMessages([
      {
        id: 'init-msg',
        senderId: 'system',
        senderName: '卓マスター',
        senderIndex: -1,
        text: '東風戦アリアルールを開始しました！ご武運を！🀄',
        isQuick: false,
        timestamp: Date.now(),
      },
    ]);
  };

  // 部屋作成 (ホスト)
  const handleCreateRoom = async (playerName: string) => {
    const generatedRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const pm = new PeerRoomManager();
    peerManagerRef.current = pm;

    const initialGame = createInitialGame([
      { id: 'player-0', name: playerName, isAi: false },
      { id: 'player-1', name: 'CPU (下家)', isAi: true },
      { id: 'player-2', name: 'CPU (対面)', isAi: true },
      { id: 'player-3', name: 'CPU (上家)', isAi: true },
    ]);

    await pm.init(
      generatedRoomId,
      true,
      (msg: NetworkMessage) => handleNetworkMessage(msg),
      () => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `join-${Date.now()}`,
            senderId: 'system',
            senderName: 'システム',
            senderIndex: -1,
            text: `新しいプレイヤーが対戦卓に参加しました！`,
            isQuick: false,
            timestamp: Date.now(),
          },
        ]);
      }
    );

    const roundGame = startRound(initialGame);
    setGameState(roundGame);
    setMyPlayerIndex(0);
    setRoomId(generatedRoomId);
    setIsHost(true);
    setView('game');
  };

  // 部屋参加 (ゲスト)
  const handleJoinRoom = async (playerName: string, joinRoomId: string) => {
    const pm = new PeerRoomManager();
    peerManagerRef.current = pm;

    await pm.init(joinRoomId, false, (msg: NetworkMessage) => handleNetworkMessage(msg));

    setMyPlayerIndex(1);
    setRoomId(joinRoomId);
    setIsHost(false);
    setView('game');

    pm.sendToHost({
      type: 'PLAYER_JOINED',
      playerIndex: 1,
      playerName,
    });
  };

  // ネットワークメッセージ受信処理
  const handleNetworkMessage = (msg: NetworkMessage) => {
    if (msg.type === 'STATE_SYNC') {
      setGameState(msg.state);
    } else if (msg.type === 'CHAT_MESSAGE') {
      setChatMessages((prev) => [...prev, msg.chat]);
      sounds.playChat();
    } else if (msg.type === 'DISCARD_REQUEST') {
      if (isHost && gameState) {
        handleDiscard(msg.tile, msg.isRiichi, msg.playerIndex);
      }
    } else if (msg.type === 'ACTION_REQUEST') {
      if (isHost && gameState) {
        handleAction(msg.action, msg.tiles, msg.playerIndex);
      }
    }
  };

  // チャット送信
  const handleSendChatMessage = (text: string, isQuick: boolean = false) => {
    if (!gameState) return;
    const myPlayer = gameState.players[myPlayerIndex];
    const newChat: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random()}`,
      senderId: myPlayer.id,
      senderName: myPlayer.name,
      senderIndex: myPlayerIndex,
      text,
      isQuick,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newChat]);

    if (peerManagerRef.current) {
      if (isHost) {
        peerManagerRef.current.broadcast({ type: 'CHAT_MESSAGE', chat: newChat });
      } else {
        peerManagerRef.current.sendToHost({ type: 'CHAT_MESSAGE', chat: newChat });
      }
    }
  };

  // 打牌処理
  const handleDiscard = (tile: Tile, declareRiichi: boolean, pIndex = myPlayerIndex) => {
    if (!gameState) return;

    if (!isHost) {
      peerManagerRef.current?.sendToHost({
        type: 'DISCARD_REQUEST',
        playerIndex: pIndex,
        tile,
        isRiichi: declareRiichi,
      });
      return;
    }

    const nextState = processDiscard(gameState, pIndex, tile, declareRiichi);
    setGameState(nextState);

    if (peerManagerRef.current) {
      peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
    }
  };

  // アクション処理 (ポン・チー・カン・ツモ・ロン・パス)
  const handleAction = (action: ActionType, tiles?: Tile[], pIndex = myPlayerIndex) => {
    if (!gameState) return;

    if (!isHost) {
      peerManagerRef.current?.sendToHost({
        type: 'ACTION_REQUEST',
        playerIndex: pIndex,
        action,
        tiles,
      });
      return;
    }

    if (action === 'pass') {
      // 自分のツモ番でリーチや暗槓をパスした場合は、アクションボタンを消して自分の打牌を継続
      if (gameState.phase === 'PLAYING' && gameState.currentTurn === pIndex) {
        const nextState: GameState = {
          ...gameState,
          pendingActions: {},
        };
        setGameState(nextState);
        if (peerManagerRef.current) {
          peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
        }
        return;
      }

      // 他家の打牌への鳴きをパスした場合は次の手番へ進める
      const nextState = advanceToNextTurn(gameState);
      setGameState(nextState);
      if (peerManagerRef.current) {
        peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
      }
    } else if (action === 'tsumo') {
      const nextState = handleWin(gameState, pIndex, true);
      setGameState(nextState);
      if (peerManagerRef.current) {
        peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
      }
    } else if (action === 'ron') {
      const nextState = handleWin(gameState, pIndex, false, gameState.lastDiscardPlayer);
      setGameState(nextState);
      if (peerManagerRef.current) {
        peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
      }
    } else if (action === 'chi' || action === 'pon' || action === 'kan') {
      if (tiles) {
        const nextState = executeCall(gameState, pIndex, action, tiles);
        setGameState(nextState);
        if (peerManagerRef.current) {
          peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
        }
      }
    }
  };

  // 次の局へ進む
  const handleNextRound = () => {
    if (!gameState || !isHost) return;
    const nextRoundState = startRound(gameState);
    setGameState(nextRoundState);
    if (peerManagerRef.current) {
      peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextRoundState });
    }
  };

  // 再戦
  const handleRestart = () => {
    setView('lobby');
    setGameState(null);
    peerManagerRef.current?.destroy();
    peerManagerRef.current = null;
  };

  // CPUの思考と自動打牌タイマー (ホスト側でのみ実行)
  useEffect(() => {
    if (!gameState || !isHost) return;

    // 1. ツモ番がCPUの場合
    if (gameState.phase === 'PLAYING') {
      const currentPlayer = gameState.players[gameState.currentTurn];
      if (currentPlayer.isAi && !isCpuThinkingRef.current) {
        isCpuThinkingRef.current = true;

        const actions = gameState.pendingActions[gameState.currentTurn];
        if (actions?.canTsumo) {
          setTimeout(() => {
            handleAction('tsumo', undefined, gameState.currentTurn);
            isCpuThinkingRef.current = false;
          }, 800);
          return;
        }

        setTimeout(() => {
          if (!gameState) {
            isCpuThinkingRef.current = false;
            return;
          }
          const { discardTile, declareRiichi } = chooseCpuDiscard(
            currentPlayer,
            gameState.currentDrawnTile
          );
          if (declareRiichi) {
            sounds.playRiichi();
          } else {
            sounds.playDiscard();
          }
          handleDiscard(discardTile, declareRiichi, gameState.currentTurn);
          isCpuThinkingRef.current = false;
        }, 900);
      }
    }

    // 2. 他家打牌に対するCPUの鳴き・ロン判断
    if (gameState.phase === 'WAITING_DISCARD_ACTION') {
      const humanActions = gameState.pendingActions[myPlayerIndex];
      const humanHasAction =
        humanActions &&
        (humanActions.canRon ||
          humanActions.canPon.length > 0 ||
          humanActions.canChi.length > 0 ||
          humanActions.canKan.length > 0);

      if (!humanHasAction && !isCpuThinkingRef.current) {
        isCpuThinkingRef.current = true;
        setTimeout(() => {
          let resolved = false;

          for (let idx = 0; idx < 4; idx++) {
            if (idx === gameState.lastDiscardPlayer) continue;
            const act = gameState.pendingActions[idx];
            const p = gameState.players[idx];
            if (act && p.isAi) {
              const choice = chooseCpuAction(act, p);
              if (choice.type === 'ron') {
                sounds.playWin();
                handleAction('ron', undefined, idx);
                resolved = true;
                break;
              } else if (choice.type === 'pon' || choice.type === 'chi' || choice.type === 'kan') {
                sounds.playCall();
                handleAction(choice.type, choice.tiles, idx);
                resolved = true;
                break;
              }
            }
          }

          if (!resolved) {
            const nextState = advanceToNextTurn(gameState);
            setGameState(nextState);
            if (peerManagerRef.current) {
              peerManagerRef.current.broadcast({ type: 'STATE_SYNC', state: nextState });
            }
          }
          isCpuThinkingRef.current = false;
        }, 700);
      }
    }
  }, [gameState, isHost, myPlayerIndex]);

  if (view === 'lobby' || !gameState) {
    return (
      <Lobby
        onStartSolo={handleStartSolo}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isBeginnerMode={isBeginnerMode}
        onToggleBeginnerMode={() => setIsBeginnerMode((prev) => !prev)}
      />
    );
  }

  return (
    <MahjongTable
      gameState={gameState}
      myPlayerIndex={myPlayerIndex}
      onDiscard={(tile, declareRiichi) => handleDiscard(tile, declareRiichi, myPlayerIndex)}
      onAction={(action, tiles) => handleAction(action, tiles, myPlayerIndex)}
      onNextRound={handleNextRound}
      onRestart={handleRestart}
      chatMessages={chatMessages}
      onSendChatMessage={handleSendChatMessage}
      roomId={roomId}
      isBeginnerMode={isBeginnerMode}
      onToggleBeginnerMode={() => setIsBeginnerMode((prev) => !prev)}
    />
  );
};

export default App;
