import { ActionType, AvailableActions, Meld, Player, Tile } from '../types/mahjong';
import { calculateShanten, countTiles, getWaitingTiles } from './shanten';
import { isSameTile } from './tiles';

/**
 * CPUの打牌選択アルゴリズム
 */
export function chooseCpuDiscard(
  player: Player,
  drawnTile?: Tile
): { discardTile: Tile; declareRiichi: boolean } {
  // すでにリーチ中ならツモ切り
  if (player.isRiichi) {
    return {
      discardTile: drawnTile || player.hand[player.hand.length - 1],
      declareRiichi: false,
    };
  }

  const hand = player.hand;
  const currentShanten = calculateShanten(hand, player.melds);

  // 門前でテンパイかつリーチ可能かチェック
  if (player.isMenzen && currentShanten === 0 && !player.isRiichi && player.score >= 1000) {
    // どの牌を切るとテンパイを維持できるか
    for (const tile of hand) {
      const remainingHand = hand.filter((t) => t.id !== tile.id);
      if (calculateShanten(remainingHand, player.melds) === 0) {
        const waits = getWaitingTiles(remainingHand, player.melds);
        if (waits.length > 0) {
          // リーチ宣言して打牌
          return {
            discardTile: tile,
            declareRiichi: true,
          };
        }
      }
    }
  }

  // シャンテン数を最小化し、受け入れの広い打牌を選択
  let bestTile = drawnTile || hand[hand.length - 1];
  let bestShanten = 999;
  let bestScore = -9999;

  for (let i = 0; i < hand.length; i++) {
    const candidate = hand[i];
    const restHand = hand.filter((_, idx) => idx !== i);
    const shanten = calculateShanten(restHand, player.melds);

    // 評価値計算
    let score = -shanten * 1000;

    // 孤立字牌・端牌の整理優先度
    if (candidate.suit === 'z') {
      const count = hand.filter((t) => t.suit === 'z' && t.value === candidate.value).length;
      if (count === 1) {
        score += 20; // 孤立字牌は早めに切る
      }
    } else {
      if (candidate.value === 1 || candidate.value === 9) {
        score += 10; // 端牌
      }
    }

    // 赤ドラは大事にする
    if (candidate.isRed) {
      score -= 50;
    }

    if (shanten < bestShanten || (shanten === bestShanten && score > bestScore)) {
      bestShanten = shanten;
      bestScore = score;
      bestTile = candidate;
    }
  }

  return {
    discardTile: bestTile,
    declareRiichi: false,
  };
}

/**
 * CPUの鳴き・ロン判断
 */
export function chooseCpuAction(
  actions: AvailableActions,
  player: Player
): { type: ActionType; tiles?: Tile[] } {
  // ロンできる場合は最優先でロン
  if (actions.canRon) {
    return { type: 'ron' };
  }

  // ツモできる場合
  if (actions.canTsumo) {
    return { type: 'tsumo' };
  }

  // リーチ中は鳴かない
  if (player.isRiichi) {
    return { type: 'pass' };
  }

  // 役牌のポン（白・發・中）
  if (actions.canPon && actions.canPon.length > 0) {
    const ponOption = actions.canPon.find((combo) => {
      const t = combo[0];
      return t.suit === 'z' && (t.value === 5 || t.value === 6 || t.value === 7);
    });
    if (ponOption) {
      return { type: 'pon', tiles: ponOption };
    }
  }

  // 暗槓・加槓のチャンス
  if (actions.canKan && actions.canKan.length > 0) {
    // 役牌や向聴数が下がらない場合はカン
    const kanOption = actions.canKan[0];
    return { type: 'kan', tiles: kanOption };
  }

  // 通常はパス
  return { type: 'pass' };
}
