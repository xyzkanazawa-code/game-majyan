// 麻雀ゲームのコア型定義

export type Suit = 'm' | 'p' | 's' | 'z'; // 萬子(m), 筒子(p), 索子(s), 字牌(z)
export type Wind = 0 | 1 | 2 | 3; // 0:東, 1:南, 2:西, 3:北

export interface Tile {
  id: number;          // 0 ~ 135 一意なID
  suit: Suit;
  value: number;       // 1 ~ 9 (字牌: 1:東, 2:南, 3:西, 4:北, 5:白, 6:發, 7:中)
  isRed?: boolean;     // 赤ドラフラグ (赤5m, 赤5p, 赤5s)
}

export type MeldType = 'chi' | 'pon' | 'kan_open' | 'kan_closed' | 'kan_added';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayerIndex: number; // どのプレイヤーから鳴いたか (0:自分, 1:下家, 2:対面, 3:上家)
  calledTile: Tile;        // 鳴いた牌
}

export interface Player {
  id: string;
  name: string;
  isAi: boolean;
  score: number;
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
  isRiichi: boolean;
  isDoubleRiichi?: boolean;
  riichiTurn?: number;
  isIppatsu?: boolean;     // 一発フラグ
  isMenzen: boolean;       // 門前フラグ (鳴きが暗槓のみならtrue)
  wind: Wind;              // 自風
}

export type ActionType = 'pass' | 'chi' | 'pon' | 'kan' | 'riichi' | 'tsumo' | 'ron';

export interface AvailableActions {
  canChi: Tile[][];      // チーできる組み合わせのリスト
  canPon: Tile[][];      // ポンできる組み合わせのリスト
  canKan: Tile[][];      // 暗槓・明槓・加槓できる牌のリスト
  canRiichi: Tile[];     // リーチ宣言できる打牌候補リスト
  canTsumo: boolean;     // ツモアガリ可能か
  canRon: boolean;       // ロンアガリ可能か
}

export interface YakuDetail {
  name: string;
  han: number;
  isYakuman?: boolean;
}

export interface WinResult {
  winnerIndex: number;
  fromPlayerIndex?: number; // ロンの場合の放銃者 (ツモなら未定義)
  isTsumo: boolean;
  yakuList: YakuDetail[];
  fu: number;
  han: number;
  score: number;
  title: string;           // "満貫", "跳満", "倍満", "三倍満", "数え役満", "役満" 等
  scoreDelta: number[];    // 各プレイヤーの点数増減 (4要素配列)
  uraDoraTiles?: Tile[];   // リーチ時の裏ドラ
  winningTile: Tile;
}

export interface RoundResult {
  type: 'win' | 'exhaustive_draw'; // 和了 または 荒牌流局
  winResult?: WinResult;
  drawReason?: string;
  tenpaiList?: boolean[];          // 流局時のテンパイ者 (ノーテン罰符用)
  scoreDelta: number[];            // 点数移動
}

export interface GameState {
  roundWind: Wind;                 // 場風 (東風戦なので 0:東)
  roundNumber: number;             // 局 (1:東1局, 2:東2局, 3:東3局, 4:東4局)
  honba: number;                   // 本場
  riichiSticks: number;            // 供託リーチ棒本数 (1本=1000点)
  dealerIndex: number;             // 親のプレイヤーインデックス (0~3)
  currentTurn: number;             // 現在ツモ・打牌権を持つプレイヤー (0~3)
  
  wall: Tile[];                    // 山牌
  deadWall: Tile[];                // 王牌 (14枚)
  doraIndicators: Tile[];          // 表ドラ表示牌
  uraDoraIndicators: Tile[];       // 裏ドラ表示牌
  
  players: Player[];               // 4人のプレイヤー
  
  phase: 'WAITING' | 'PLAYING' | 'WAITING_DISCARD_ACTION' | 'ROUND_RESULT' | 'GAME_OVER';
  lastDiscardTile?: Tile;
  lastDiscardPlayer?: number;
  currentDrawnTile?: Tile;
  
  turnCount: number;
  pendingActions: {
    [playerIndex: number]: AvailableActions;
  };
  
  roundResult?: RoundResult;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderIndex: number;
  text: string;
  isQuick: boolean;
  timestamp: number;
}
