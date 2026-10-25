import {
  ActionType,
  AvailableActions,
  GameState,
  Meld,
  Player,
  RoundResult,
  Tile,
  Wind,
} from '../types/mahjong';
import { createDeck, isSameTile, shuffleDeck, sortTiles } from './tiles';
import { calculateShanten, getWaitingTiles, isTenpai } from './shanten';
import { judgeYaku } from './yaku';
import { calculateScore } from './score';

/**
 * 新規ゲームの初期状態を生成
 */
export function createInitialGame(
  playerConfigs: { id: string; name: string; isAi: boolean }[]
): GameState {
  const players: Player[] = playerConfigs.map((cfg, idx) => ({
    id: cfg.id,
    name: cfg.name,
    isAi: cfg.isAi,
    score: 25000,
    hand: [],
    melds: [],
    discards: [],
    isRiichi: false,
    isMenzen: true,
    wind: idx as Wind,
  }));

  return {
    roundWind: 0, // 東風戦
    roundNumber: 1, // 東1局
    honba: 0,
    riichiSticks: 0,
    dealerIndex: 0,
    currentTurn: 0,
    wall: [],
    deadWall: [],
    doraIndicators: [],
    uraDoraIndicators: [],
    players,
    phase: 'WAITING',
    turnCount: 0,
    pendingActions: {},
  };
}

/**
 * 局の開始 (配牌とドラめくり)
 */
export function startRound(state: GameState): GameState {
  const rawDeck = shuffleDeck(createDeck());

  // 王牌14枚を取り分け
  const deadWall = rawDeck.slice(0, 14);
  const wall = rawDeck.slice(14);

  // 表ドラ表示牌 (王牌の3番目を開示)
  const doraIndicators = [deadWall[2]];
  const uraDoraIndicators = [deadWall[3]];

  // 各プレイヤーの自風を更新 (dealerIndexから順に東・南・西・北)
  const updatedPlayers: Player[] = state.players.map((p, idx) => {
    const relativeWind = ((idx - state.dealerIndex + 4) % 4) as Wind;
    return {
      ...p,
      hand: [],
      melds: [],
      discards: [],
      isRiichi: false,
      isDoubleRiichi: false,
      riichiTurn: undefined,
      isIppatsu: false,
      isMenzen: true,
      wind: relativeWind,
    };
  });

  // 各プレイヤーに13枚ずつ配牌
  let currentDeck = [...wall];
  for (let i = 0; i < 4; i++) {
    const hand = currentDeck.slice(0, 13);
    currentDeck = currentDeck.slice(13);
    updatedPlayers[i].hand = sortTiles(hand);
  }

  // 親に14枚目をツモらせる
  const dealerDrawn = currentDeck[0];
  currentDeck = currentDeck.slice(1);
  updatedPlayers[state.dealerIndex].hand.push(dealerDrawn);

  const newState: GameState = {
    ...state,
    wall: currentDeck,
    deadWall,
    doraIndicators,
    uraDoraIndicators,
    players: updatedPlayers,
    currentTurn: state.dealerIndex,
    currentDrawnTile: dealerDrawn,
    lastDiscardTile: undefined,
    lastDiscardPlayer: undefined,
    phase: 'PLAYING',
    roundResult: undefined,
    turnCount: 1,
    pendingActions: {},
  };

  // 親のツモアガリ・リーチ可能チェック
  checkDrawActions(newState, state.dealerIndex, dealerDrawn);

  return newState;
}

/**
 * ツモ番でのプレイヤーのアクションチェック（ツモ和了・リーチ・暗槓）
 */
export function checkDrawActions(state: GameState, playerIndex: number, drawnTile: Tile) {
  const player = state.players[playerIndex];
  const hand = player.hand;

  // ツモ和了判定
  const yaku = judgeYaku({
    hand,
    winningTile: drawnTile,
    isTsumo: true,
    isRiichi: player.isRiichi,
    isDoubleRiichi: player.isDoubleRiichi,
    isIppatsu: player.isIppatsu,
    melds: player.melds,
    roundWind: state.roundWind,
    playerWind: player.wind,
    doraIndicators: state.doraIndicators,
    uraDoraIndicators: state.uraDoraIndicators,
  });

  const canTsumo = yaku.totalHan > 0;

  // リーチ宣言可能打牌のリスト
  const canRiichi: Tile[] = [];
  if (player.isMenzen && !player.isRiichi && player.score >= 1000) {
    for (const t of hand) {
      const rest = hand.filter((x) => x.id !== t.id);
      if (calculateShanten(rest, player.melds) === 0) {
        const waits = getWaitingTiles(rest, player.melds);
        if (waits.length > 0) {
          canRiichi.push(t);
        }
      }
    }
  }

  // 暗槓可能チェック
  const canKan: Tile[][] = [];
  if (player.isMenzen && !player.isRiichi) {
    const tileCounts: Record<string, Tile[]> = {};
    for (const t of hand) {
      const key = `${t.suit}-${t.value}`;
      if (!tileCounts[key]) tileCounts[key] = [];
      tileCounts[key].push(t);
    }
    for (const list of Object.values(tileCounts)) {
      if (list.length === 4) {
        canKan.push(list);
      }
    }
  }

  state.pendingActions = {
    [playerIndex]: {
      canTsumo,
      canRiichi,
      canRon: false,
      canPon: [],
      canChi: [],
      canKan,
    },
  };
}

/**
 * プレイヤーによる打牌処理
 */
export function processDiscard(
  state: GameState,
  playerIndex: number,
  discardTile: Tile,
  declareRiichi: boolean
): GameState {
  const player = state.players[playerIndex];

  // 手牌から該当牌を取り除く
  const newHand = player.hand.filter((t) => t.id !== discardTile.id);

  // リーチ処理
  let isRiichi = player.isRiichi;
  let isDoubleRiichi = player.isDoubleRiichi;
  let riichiTurn = player.riichiTurn;
  let newScore = player.score;
  let riichiSticks = state.riichiSticks;

  if (declareRiichi && !isRiichi) {
    isRiichi = true;
    riichiTurn = player.discards.length;
    isDoubleRiichi = player.discards.length === 0;
    newScore -= 1000;
    riichiSticks += 1;
  }

  // 一発フラグは一巡経過または鳴きが入ると解除される
  const updatedPlayers = state.players.map((p, idx) => {
    if (idx === playerIndex) {
      return {
        ...p,
        hand: sortTiles(newHand),
        discards: [...p.discards, discardTile],
        score: newScore,
        isRiichi,
        isDoubleRiichi,
        riichiTurn,
        isIppatsu: declareRiichi, // リーチ直後に一発フラグ点灯
      };
    } else {
      return p;
    }
  });

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    lastDiscardTile: discardTile,
    lastDiscardPlayer: playerIndex,
    currentDrawnTile: undefined,
    riichiSticks,
    pendingActions: {},
  };

  // 他家3人のロン・鳴き可能判定
  checkOtherPlayerActions(nextState, playerIndex, discardTile);

  // もし誰もアクション可能でなければ、次家へツモ権を移行
  const hasActions = Object.values(nextState.pendingActions).some(
    (act) => act.canRon || act.canPon.length > 0 || act.canChi.length > 0
  );

  if (!hasActions) {
    return advanceToNextTurn(nextState);
  } else {
    nextState.phase = 'WAITING_DISCARD_ACTION';
    return nextState;
  }
}

/**
 * 他プレイヤーに対する鳴き・ロン判定
 */
function checkOtherPlayerActions(state: GameState, discardPlayerIndex: number, discardTile: Tile) {
  const pending: { [idx: number]: AvailableActions } = {};

  for (let idx = 0; idx < 4; idx++) {
    if (idx === discardPlayerIndex) continue;
    const p = state.players[idx];

    // 1. ロン判定
    const testHand = [...p.hand, discardTile];
    const shanten = calculateShanten(testHand, p.melds);
    let canRon = false;

    if (shanten === -1) {
      // 役があるか確認
      const yaku = judgeYaku({
        hand: testHand,
        winningTile: discardTile,
        isTsumo: false,
        isRiichi: p.isRiichi,
        isDoubleRiichi: p.isDoubleRiichi,
        isIppatsu: p.isIppatsu,
        melds: p.melds,
        roundWind: state.roundWind,
        playerWind: p.wind,
        doraIndicators: state.doraIndicators,
        uraDoraIndicators: state.uraDoraIndicators,
      });

      if (yaku.totalHan > 0) {
        canRon = true;
      }
    }

    // 2. ポン判定 (リーチ中は不可)
    const canPon: Tile[][] = [];
    if (!p.isRiichi) {
      const matches = p.hand.filter((t) => isSameTile(t, discardTile));
      if (matches.length >= 2) {
        canPon.push([matches[0], matches[1]]);
      }
    }

    // 3. チー判定 (下家のみかつリーチ中でない)
    const canChi: Tile[][] = [];
    const isShimocha = (discardPlayerIndex + 1) % 4 === idx;
    if (isShimocha && !p.isRiichi && discardTile.suit !== 'z') {
      const v = discardTile.value;
      const s = discardTile.suit;
      const hand = p.hand;

      // [v-2, v-1]
      const t1 = hand.find((t) => t.suit === s && t.value === v - 2);
      const t2 = hand.find((t) => t.suit === s && t.value === v - 1);
      if (t1 && t2) canChi.push([t1, t2]);

      // [v-1, v+1]
      const t3 = hand.find((t) => t.suit === s && t.value === v - 1);
      const t4 = hand.find((t) => t.suit === s && t.value === v + 1);
      if (t3 && t4) canChi.push([t3, t4]);

      // [v+1, v+2]
      const t5 = hand.find((t) => t.suit === s && t.value === v + 1);
      const t6 = hand.find((t) => t.suit === s && t.value === v + 2);
      if (t5 && t6) canChi.push([t5, t6]);
    }

    if (canRon || canPon.length > 0 || canChi.length > 0) {
      pending[idx] = {
        canRon,
        canPon,
        canChi,
        canKan: [],
        canRiichi: [],
        canTsumo: false,
      };
    }
  }

  state.pendingActions = pending;
}

/**
 * 次のプレイヤーのツモへ進める
 */
export function advanceToNextTurn(state: GameState): GameState {
  // 山牌チェック (王牌14枚残しなので、wallが空になったら荒牌流局)
  if (state.wall.length === 0) {
    return handleExhaustiveDraw(state);
  }

  const nextPlayerIndex = (state.currentTurn + 1) % 4;
  const drawnTile = state.wall[0];
  const remainingWall = state.wall.slice(1);

  const updatedPlayers = state.players.map((p, idx) => {
    if (idx === nextPlayerIndex) {
      return {
        ...p,
        hand: [...p.hand, drawnTile],
      };
    }
    return p;
  });

  const nextState: GameState = {
    ...state,
    wall: remainingWall,
    players: updatedPlayers,
    currentTurn: nextPlayerIndex,
    currentDrawnTile: drawnTile,
    phase: 'PLAYING',
    turnCount: state.turnCount + 1,
    pendingActions: {},
  };

  // ツモアガリ等のアクション判定
  checkDrawActions(nextState, nextPlayerIndex, drawnTile);

  return nextState;
}

/**
 * 鳴き（ポン・チー・カン）の実行
 */
export function executeCall(
  state: GameState,
  playerIndex: number,
  type: 'chi' | 'pon' | 'kan',
  tiles: Tile[]
): GameState {
  const discardTile = state.lastDiscardTile!;
  const fromPlayer = state.lastDiscardPlayer!;

  const player = state.players[playerIndex];
  // 手牌から使用した牌を除く
  const usedIds = new Set(tiles.map((t) => t.id));
  const remainingHand = player.hand.filter((t) => !usedIds.has(t.id));

  const newMeld: Meld = {
    type: type === 'chi' ? 'chi' : type === 'pon' ? 'pon' : 'kan_open',
    tiles: [...tiles, discardTile],
    fromPlayerIndex: fromPlayer,
    calledTile: discardTile,
  };

  // 鳴きが入ると全プレイヤーの一発フラグが消滅
  const updatedPlayers = state.players.map((p, idx) => {
    if (idx === playerIndex) {
      return {
        ...p,
        hand: remainingHand,
        melds: [...p.melds, newMeld],
        isMenzen: false,
        isIppatsu: false,
      };
    } else {
      return {
        ...p,
        isIppatsu: false,
      };
    }
  });

  return {
    ...state,
    players: updatedPlayers,
    currentTurn: playerIndex,
    currentDrawnTile: undefined,
    phase: 'PLAYING',
    pendingActions: {},
  };
}

/**
 * 和了（ロン・ツモ）の精算処理
 */
export function handleWin(
  state: GameState,
  winnerIndex: number,
  isTsumo: boolean,
  fromPlayerIndex?: number
): GameState {
  const winner = state.players[winnerIndex];
  const winningTile = isTsumo ? state.currentDrawnTile! : state.lastDiscardTile!;
  const isParent = winnerIndex === state.dealerIndex;

  const yaku = judgeYaku({
    hand: winner.hand,
    winningTile,
    isTsumo,
    isRiichi: winner.isRiichi,
    isDoubleRiichi: winner.isDoubleRiichi,
    isIppatsu: winner.isIppatsu,
    melds: winner.melds,
    roundWind: state.roundWind,
    playerWind: winner.wind,
    doraIndicators: state.doraIndicators,
    uraDoraIndicators: state.uraDoraIndicators,
  });

  const winResult = calculateScore({
    han: yaku.totalHan,
    fu: yaku.fu,
    isYakuman: yaku.isYakuman,
    isParent,
    isTsumo,
    honba: state.honba,
    riichiSticks: state.riichiSticks,
    winnerIndex,
    fromPlayerIndex,
    yakuList: yaku.yakuList,
    winningTile,
  });

  // 点数の反映
  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    score: p.score + winResult.scoreDelta[idx],
  }));

  const roundResult: RoundResult = {
    type: 'win',
    winResult,
    scoreDelta: winResult.scoreDelta,
  };

  // 連荘判定: 親のアガリなら連荘（本場+1）、子のアガリなら輪荘（親移動、本場リセット）
  let nextDealer = state.dealerIndex;
  let nextRound = state.roundNumber;
  let nextHonba = state.honba + 1;
  let nextWind = state.roundWind;

  if (!isParent) {
    nextDealer = (state.dealerIndex + 1) % 4;
    nextRound = state.roundNumber + 1;
    nextHonba = 0;
  }

  // 東4局終了またはトビ
  const isGameOver = nextRound > 4 || updatedPlayers.some((p) => p.score < 0);

  return {
    ...state,
    players: updatedPlayers,
    riichiSticks: 0,
    dealerIndex: nextDealer,
    roundNumber: nextRound,
    honba: nextHonba,
    roundWind: nextWind,
    phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
    roundResult,
  };
}

/**
 * 荒牌流局の精算処理 (ノーテン罰符)
 */
export function handleExhaustiveDraw(state: GameState): GameState {
  // 各自のテンパイ確認
  const tenpaiList = state.players.map((p) => isTenpai(p.hand, p.melds));
  const tenpaiCount = tenpaiList.filter(Boolean).length;

  const scoreDelta = [0, 0, 0, 0];
  if (tenpaiCount > 0 && tenpaiCount < 4) {
    const gainPerTenpai = 3000 / tenpaiCount;
    const payPerNoten = 3000 / (4 - tenpaiCount);

    for (let i = 0; i < 4; i++) {
      scoreDelta[i] = tenpaiList[i] ? gainPerTenpai : -payPerNoten;
    }
  }

  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    score: p.score + scoreDelta[idx],
  }));

  const isParentTenpai = tenpaiList[state.dealerIndex];
  let nextDealer = state.dealerIndex;
  let nextRound = state.roundNumber;
  let nextHonba = state.honba + 1;

  // 親がノーテンなら輪荘
  if (!isParentTenpai) {
    nextDealer = (state.dealerIndex + 1) % 4;
    nextRound = state.roundNumber + 1;
  }

  const isGameOver = nextRound > 4 || updatedPlayers.some((p) => p.score < 0);

  const roundResult: RoundResult = {
    type: 'exhaustive_draw',
    tenpaiList,
    scoreDelta,
  };

  return {
    ...state,
    players: updatedPlayers,
    dealerIndex: nextDealer,
    roundNumber: nextRound,
    honba: nextHonba,
    phase: isGameOver ? 'GAME_OVER' : 'ROUND_RESULT',
    roundResult,
  };
}
