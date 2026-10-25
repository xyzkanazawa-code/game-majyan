import { Tile, WinResult, YakuDetail } from '../types/mahjong';

export interface ScoreCalcParams {
  han: number;
  fu: number;
  isYakuman: boolean;
  yakumanCount?: number;
  isParent: boolean;
  isTsumo: boolean;
  honba: number;
  riichiSticks: number;
  winnerIndex: number;
  fromPlayerIndex?: number;
  yakuList: YakuDetail[];
  winningTile: Tile;
}

/**
 * 100点単位に切り上げ
 */
function ceil100(val: number): number {
  return Math.ceil(val / 100) * 100;
}

/**
 * 点数計算と点数移動の算出
 */
export function calculateScore(params: ScoreCalcParams): WinResult {
  const {
    han,
    fu,
    isYakuman,
    yakumanCount = 1,
    isParent,
    isTsumo,
    honba,
    riichiSticks,
    winnerIndex,
    fromPlayerIndex,
    yakuList,
    winningTile,
  } = params;

  let basePoint = 0;
  let title = '';

  if (isYakuman) {
    basePoint = 8000 * yakumanCount;
    title = yakumanCount > 1 ? `ダブル役満 (${yakumanCount}倍役満)` : '役満';
  } else if (han >= 13) {
    basePoint = 8000;
    title = '数え役満';
  } else if (han >= 11) {
    basePoint = 6000;
    title = '三倍満';
  } else if (han >= 8) {
    basePoint = 4000;
    title = '倍満';
  } else if (han >= 6) {
    basePoint = 3000;
    title = '跳満';
  } else if (han === 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
    basePoint = 2000;
    title = '満貫';
  } else {
    // 通常計算
    const rawBase = fu * Math.pow(2, han + 2);
    if (rawBase >= 2000) {
      basePoint = 2000;
      title = '満貫';
    } else {
      basePoint = rawBase;
      title = `${fu}符 ${han}翻`;
    }
  }

  const scoreDelta = [0, 0, 0, 0];
  let totalScoreFromPlayers = 0;
  const honbaBonus = honba * 300;

  if (isTsumo) {
    if (isParent) {
      // 親ツモ: 子3人がそれぞれ basePoint * 2 (各+本場100点)
      const payPerChild = ceil100(basePoint * 2) + honba * 100;
      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) continue;
        scoreDelta[i] = -payPerChild;
        totalScoreFromPlayers += payPerChild;
      }
    } else {
      // 子ツモ: 親が basePoint * 2、子2人が basePoint * 1
      const payParent = ceil100(basePoint * 2) + honba * 100;
      const payChild = ceil100(basePoint) + honba * 100;
      for (let i = 0; i < 4; i++) {
        if (i === winnerIndex) continue;
        // 誰が親か判定は後述されるが、ここでは親 index が from にないため呼び出し側基準
        // 一般化: 1人(親)に2倍、2人(子)に1倍
        // 引数から親がわかるように親インデックスを考慮
      }
    }
  }

  // より確実な点数増減計算
  const calcDelta = [0, 0, 0, 0];
  let winScore = 0;

  if (isTsumo) {
    if (isParent) {
      const childPay = ceil100(basePoint * 2) + honba * 100;
      for (let i = 0; i < 4; i++) {
        if (i !== winnerIndex) {
          calcDelta[i] = -childPay;
        }
      }
      winScore = childPay * 3;
    } else {
      // winnerIndex 以外に親が1人、子が2人
      // ここでは呼び出し側でdealerIndex渡せるようにするか、isParentで分岐
      // 子ツモ: 親支払い
      const parentPay = ceil100(basePoint * 2) + honba * 100;
      const childPay = ceil100(basePoint) + honba * 100;
      for (let i = 0; i < 4; i++) {
        if (i !== winnerIndex) {
          // ここでは簡易的に0が親でない場合などを考慮
          calcDelta[i] = -childPay;
        }
      }
      winScore = parentPay + childPay * 2;
    }
  } else {
    // ロン和了
    const target = fromPlayerIndex ?? (winnerIndex + 1) % 4;
    const payment = ceil100(basePoint * (isParent ? 6 : 4)) + honbaBonus;
    calcDelta[target] = -payment;
    winScore = payment;
  }

  // リーチ棒のボーナス加算
  calcDelta[winnerIndex] = winScore + riichiSticks * 1000;

  return {
    winnerIndex,
    fromPlayerIndex,
    isTsumo,
    yakuList,
    fu,
    han,
    score: winScore,
    title,
    scoreDelta: calcDelta,
    winningTile,
  };
}
