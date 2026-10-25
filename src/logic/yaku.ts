import { Meld, Suit, Tile, Wind, YakuDetail } from '../types/mahjong';
import { countDora, isSameTile } from './tiles';
import { countTiles, indexToTileInfo, tileToIndex } from './shanten';

export interface HandStructure {
  head: { suit: Suit; value: number };
  melds: {
    type: 'shuntsu' | 'koutsu' | 'kantsu';
    suit: Suit;
    value: number; // 順子なら最小値、刻子・槓子ならその値
    isOpen: boolean;
  }[];
}

/**
 * 手牌＋アガリ牌を面子構造（4面子1雀頭）に分解する
 */
export function decomposeStandardHand(
  handTiles: Tile[],
  openMelds: Meld[] = []
): HandStructure[] {
  const counts = countTiles(handTiles);
  const structures: HandStructure[] = [];

  const convertedOpenMelds = openMelds.map((m) => {
    if (m.type === 'chi') {
      const minVal = Math.min(...m.tiles.map((t) => t.value));
      return {
        type: 'shuntsu' as const,
        suit: m.tiles[0].suit,
        value: minVal,
        isOpen: true,
      };
    } else if (m.type === 'pon') {
      return {
        type: 'koutsu' as const,
        suit: m.tiles[0].suit,
        value: m.tiles[0].value,
        isOpen: true,
      };
    } else {
      // 槓子
      return {
        type: 'kantsu' as const,
        suit: m.tiles[0].suit,
        value: m.tiles[0].value,
        isOpen: m.type !== 'kan_closed',
      };
    }
  });

  // 雀頭を全探索
  for (let headIdx = 0; headIdx < 34; headIdx++) {
    if (counts[headIdx] >= 2) {
      counts[headIdx] -= 2;
      const head = indexToTileInfo(headIdx);
      const currentMelds = [...convertedOpenMelds];

      findMelds(0, currentMelds, counts, head, structures);

      counts[headIdx] += 2;
    }
  }

  return structures;
}

function findMelds(
  startIdx: number,
  currentMelds: HandStructure['melds'],
  c: number[],
  head: { suit: Suit; value: number },
  results: HandStructure[]
) {
  if (currentMelds.length === 4) {
    // 4面子揃ったか
    let allUsed = true;
    for (let i = 0; i < 34; i++) {
      if (c[i] > 0) {
        allUsed = false;
        break;
      }
    }
    if (allUsed) {
      results.push({ head, melds: [...currentMelds] });
    }
    return;
  }

  // 最初の牌を探す
  let firstIdx = -1;
  for (let i = startIdx; i < 34; i++) {
    if (c[i] > 0) {
      firstIdx = i;
      break;
    }
  }

  if (firstIdx === -1) return;

  const info = indexToTileInfo(firstIdx);

  // 1. 暗刻
  if (c[firstIdx] >= 3) {
    c[firstIdx] -= 3;
    currentMelds.push({
      type: 'koutsu',
      suit: info.suit,
      value: info.value,
      isOpen: false,
    });
    findMelds(firstIdx, currentMelds, c, head, results);
    currentMelds.pop();
    c[firstIdx] += 3;
  }

  // 2. 順子 (数牌のみ)
  if (info.suit !== 'z' && info.value <= 7) {
    const idx2 = firstIdx + 1;
    const idx3 = firstIdx + 2;
    if (c[idx2] >= 1 && c[idx3] >= 1) {
      c[firstIdx]--;
      c[idx2]--;
      c[idx3]--;
      currentMelds.push({
        type: 'shuntsu',
        suit: info.suit,
        value: info.value,
        isOpen: false,
      });
      findMelds(firstIdx, currentMelds, c, head, results);
      currentMelds.pop();
      c[firstIdx]++;
      c[idx2]++;
      c[idx3]++;
    }
  }
}

export interface YakuCheckParams {
  hand: Tile[];              // 手牌 (アガリ牌を含む14枚)
  winningTile: Tile;         // アガリ牌
  isTsumo: boolean;
  isRiichi: boolean;
  isDoubleRiichi?: boolean;
  isIppatsu?: boolean;
  melds: Meld[];
  roundWind: Wind;           // 0:東, 1:南, ...
  playerWind: Wind;          // 0:東, 1:南, ...
  doraIndicators: Tile[];
  uraDoraIndicators?: Tile[];
}

/**
 * 成立役の判定
 */
export function judgeYaku(params: YakuCheckParams): {
  yakuList: YakuDetail[];
  totalHan: number;
  isYakuman: boolean;
  fu: number;
} {
  const { hand, winningTile, isTsumo, isRiichi, isDoubleRiichi, isIppatsu, melds, roundWind, playerWind, doraIndicators, uraDoraIndicators = [] } = params;
  const isMenzen = melds.length === 0 || melds.every((m) => m.type === 'kan_closed');
  const counts = countTiles(hand);

  // 1. 国士無双判定
  const terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let kokushiKinds = 0;
  let kokushiHasPair = false;
  for (const idx of terminals) {
    if (counts[idx] >= 1) kokushiKinds++;
    if (counts[idx] >= 2) kokushiHasPair = true;
  }
  if (isMenzen && kokushiKinds === 13 && kokushiHasPair) {
    return {
      yakuList: [{ name: '国士無双', han: 13, isYakuman: true }],
      totalHan: 13,
      isYakuman: true,
      fu: 30,
    };
  }

  // 2. 七対子判定
  let pairCount = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 2) pairCount++;
  }
  const isChitoitsu = isMenzen && pairCount === 7;

  // 役満候補チェック (字一色、清老頭、大三元、緑一色、四暗刻)
  const yakumanList: YakuDetail[] = [];

  // 字一色
  let isTsuiso = true;
  for (let i = 0; i < 27; i++) {
    if (counts[i] > 0) isTsuiso = false;
  }
  if (isTsuiso) yakumanList.push({ name: '字一色', han: 13, isYakuman: true });

  // 清老頭 (1,9のみ)
  const oneNines = [0, 8, 9, 17, 18, 26];
  let isChinroto = true;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0 && !oneNines.includes(i)) isChinroto = false;
  }
  if (isChinroto) yakumanList.push({ name: '清老頭', han: 13, isYakuman: true });

  // 大三元 (白・發・中がすべて3枚以上)
  if (counts[31] >= 3 && counts[32] >= 3 && counts[33] >= 3) {
    yakumanList.push({ name: '大三元', han: 13, isYakuman: true });
  }

  // 緑一色 (2s,3s,4s,6s,8s,發 のみ)
  const ryuisoTiles = [19, 20, 21, 23, 25, 32];
  let isRyuiso = true;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0 && !ryuisoTiles.includes(i)) isRyuiso = false;
  }
  if (isRyuiso) yakumanList.push({ name: '緑一色', han: 13, isYakuman: true });

  if (yakumanList.length > 0) {
    return {
      yakuList: yakumanList,
      totalHan: yakumanList.length * 13,
      isYakuman: true,
      fu: 30,
    };
  }

  // 七対子の通常判定
  if (isChitoitsu) {
    const yakuList: YakuDetail[] = [{ name: '七対子', han: 2 }];
    if (isDoubleRiichi) yakuList.push({ name: 'ダブル立直', han: 2 });
    else if (isRiichi) yakuList.push({ name: '立直', han: 1 });
    if (isIppatsu) yakuList.push({ name: '一発', han: 1 });
    if (isTsumo) yakuList.push({ name: '門前清自摸和', han: 1 });

    // タンヤオ
    let isTanyao = true;
    for (const idx of terminals) {
      if (counts[idx] > 0) isTanyao = false;
    }
    if (isTanyao) yakuList.push({ name: '断幺九', han: 1 });

    // 混老頭
    let isHonroto = true;
    for (let i = 0; i < 34; i++) {
      if (counts[i] > 0 && !terminals.includes(i)) isHonroto = false;
    }
    if (isHonroto) yakuList.push({ name: '混老頭', han: 2 });

    // 混一色 / 清一色
    const suitsInHand = new Set(hand.map((t) => t.suit));
    const hasHonor = suitsInHand.has('z');
    const colorCount = (suitsInHand.has('m') ? 1 : 0) + (suitsInHand.has('p') ? 1 : 0) + (suitsInHand.has('s') ? 1 : 0);
    if (colorCount === 1) {
      if (hasHonor) yakuList.push({ name: '混一色', han: 3 });
      else yakuList.push({ name: '清一色', han: 6 });
    }

    // ドラ計算
    let doraCount = 0;
    for (const tile of hand) {
      doraCount += countDora(tile, doraIndicators, isRiichi ? uraDoraIndicators : []);
    }
    if (doraCount > 0) {
      yakuList.push({ name: `ドラ ${doraCount}`, han: doraCount });
    }

    const totalHan = yakuList.reduce((acc, y) => acc + y.han, 0);
    return { yakuList, totalHan, isYakuman: false, fu: 25 };
  }

  // 一般手の分解と最高役の選定
  const structures = decomposeStandardHand(hand, melds);
  if (structures.length === 0) {
    // 役なしまたは判定不可
    return { yakuList: [], totalHan: 0, isYakuman: false, fu: 20 };
  }

  let bestResult = { yakuList: [] as YakuDetail[], totalHan: 0, fu: 20 };

  for (const s of structures) {
    const curYaku: YakuDetail[] = [];

    // 四暗刻チェック
    if (isMenzen) {
      const darkKoutsu = s.melds.filter((m) => (m.type === 'koutsu' || m.type === 'kantsu') && !m.isOpen);
      if (darkKoutsu.length === 4) {
        // ツモなら四暗刻
        if (isTsumo || (s.head.suit === winningTile.suit && s.head.value === winningTile.value)) {
          return {
            yakuList: [{ name: '四暗刻', han: 13, isYakuman: true }],
            totalHan: 13,
            isYakuman: true,
            fu: 40,
          };
        }
      }
    }

    // 立直・ツモ等
    if (isDoubleRiichi) curYaku.push({ name: 'ダブル立直', han: 2 });
    else if (isRiichi) curYaku.push({ name: '立直', han: 1 });
    if (isIppatsu) curYaku.push({ name: '一発', han: 1 });
    if (isMenzen && isTsumo) curYaku.push({ name: '門前清自摸和', han: 1 });

    // タンヤオ (1,9,字牌なし)
    let isTanyao = true;
    for (const idx of terminals) {
      if (counts[idx] > 0) isTanyao = false;
    }
    if (isTanyao) curYaku.push({ name: '断幺九', han: 1 });

    // 役牌判定
    // 三元牌: 白(5), 發(6), 中(7)
    for (const m of s.melds) {
      if (m.type === 'koutsu' || m.type === 'kantsu') {
        if (m.suit === 'z') {
          if (m.value === 5) curYaku.push({ name: '役牌 白', han: 1 });
          if (m.value === 6) curYaku.push({ name: '役牌 發', han: 1 });
          if (m.value === 7) curYaku.push({ name: '役牌 中', han: 1 });
          if (m.value === roundWind + 1) curYaku.push({ name: '場風牌', han: 1 });
          if (m.value === playerWind + 1) curYaku.push({ name: '自風牌', han: 1 });
        }
      }
    }

    // 平和判定
    // 門前、全て順子、雀頭が役牌でない、両面待ち
    if (isMenzen) {
      const allShuntsu = s.melds.every((m) => m.type === 'shuntsu');
      const isHeadYaku = s.head.suit === 'z' && (
        s.head.value === 5 || s.head.value === 6 || s.head.value === 7 ||
        s.head.value === roundWind + 1 || s.head.value === playerWind + 1
      );

      // 両面待ちチェック
      let isRyanmen = false;
      if (allShuntsu && !isHeadYaku) {
        for (const m of s.melds) {
          if (m.suit === winningTile.suit) {
            if ((m.value === winningTile.value && winningTile.value <= 6) ||
                (m.value + 2 === winningTile.value && winningTile.value >= 4)) {
              isRyanmen = true;
            }
          }
        }
      }

      if (allShuntsu && !isHeadYaku && isRyanmen) {
        curYaku.push({ name: '平和', han: 1 });
      }
    }

    // 対々和 (全て刻子・槓子)
    const isToitoi = s.melds.every((m) => m.type === 'koutsu' || m.type === 'kantsu');
    if (isToitoi) curYaku.push({ name: '対々和', han: 2 });

    // 三暗刻
    const darkKoutsu = s.melds.filter((m) => (m.type === 'koutsu' || m.type === 'kantsu') && !m.isOpen);
    if (darkKoutsu.length === 3) curYaku.push({ name: '三暗刻', han: 2 });

    // 混一色 / 清一色
    const suitsInHand = new Set(hand.map((t) => t.suit));
    const hasHonor = suitsInHand.has('z');
    const colorCount = (suitsInHand.has('m') ? 1 : 0) + (suitsInHand.has('p') ? 1 : 0) + (suitsInHand.has('s') ? 1 : 0);
    if (colorCount === 1) {
      if (hasHonor) {
        curYaku.push({ name: '混一色', han: isMenzen ? 3 : 2 });
      } else {
        curYaku.push({ name: '清一色', han: isMenzen ? 6 : 5 });
      }
    }

    // 一気通貫 (同色で 123, 456, 789)
    for (const suit of ['m', 'p', 's'] as Suit[]) {
      const sh = s.melds.filter((m) => m.type === 'shuntsu' && m.suit === suit);
      const vals = new Set(sh.map((m) => m.value));
      if (vals.has(1) && vals.has(4) && vals.has(7)) {
        curYaku.push({ name: '一気通貫', han: isMenzen ? 2 : 1 });
        break;
      }
    }

    // 三色同順 (m, p, s の同順子)
    const shuntsuMelds = s.melds.filter((m) => m.type === 'shuntsu');
    for (let val = 1; val <= 7; val++) {
      const hasM = shuntsuMelds.some((m) => m.suit === 'm' && m.value === val);
      const hasP = shuntsuMelds.some((m) => m.suit === 'p' && m.value === val);
      const hasS = shuntsuMelds.some((m) => m.suit === 's' && m.value === val);
      if (hasM && hasP && hasS) {
        curYaku.push({ name: '三色同順', han: isMenzen ? 2 : 1 });
        break;
      }
    }

    // 一盃口 (門前で同種同順子2組)
    if (isMenzen) {
      let isIpeko = false;
      for (let i = 0; i < shuntsuMelds.length; i++) {
        for (let j = i + 1; j < shuntsuMelds.length; j++) {
          if (shuntsuMelds[i].suit === shuntsuMelds[j].suit && shuntsuMelds[i].value === shuntsuMelds[j].value) {
            isIpeko = true;
          }
        }
      }
      if (isIpeko) curYaku.push({ name: '一盃口', han: 1 });
    }

    // 符計算
    const fu = calculateFu(s, winningTile, isTsumo, isMenzen, roundWind, playerWind, curYaku.some((y) => y.name === '平和'));

    // ドラ加算
    let doraCount = 0;
    for (const tile of hand) {
      doraCount += countDora(tile, doraIndicators, isRiichi ? uraDoraIndicators : []);
    }
    if (doraCount > 0 && curYaku.length > 0) {
      curYaku.push({ name: `ドラ ${doraCount}`, han: doraCount });
    }

    const curHan = curYaku.reduce((acc, y) => acc + y.han, 0);
    if (curHan > bestResult.totalHan || (curHan === bestResult.totalHan && fu > bestResult.fu)) {
      bestResult = { yakuList: curYaku, totalHan: curHan, fu };
    }
  }

  return {
    yakuList: bestResult.yakuList,
    totalHan: bestResult.totalHan,
    isYakuman: false,
    fu: bestResult.fu,
  };
}

/**
 * 符計算
 */
function calculateFu(
  s: HandStructure,
  winningTile: Tile,
  isTsumo: boolean,
  isMenzen: boolean,
  roundWind: Wind,
  playerWind: Wind,
  isPinfu: boolean
): number {
  if (isPinfu) {
    return isTsumo ? 20 : 30; // 平和ツモ20符固定、ロン30符
  }

  let fu = 20; // 底符
  if (isMenzen && !isTsumo) fu += 10; // 門前ロン
  if (isTsumo) fu += 2; // ツモ符

  // 雀頭の符
  if (s.head.suit === 'z') {
    if (s.head.value >= 5 && s.head.value <= 7) fu += 2; // 三元牌
    if (s.head.value === roundWind + 1) fu += 2; // 場風
    if (s.head.value === playerWind + 1) fu += 2; // 自風
  }

  // 面子の符
  for (const m of s.melds) {
    if (m.type === 'koutsu') {
      const isYaochu = m.suit === 'z' || m.value === 1 || m.value === 9;
      let koutsuFu = isYaochu ? 4 : 2;
      if (!m.isOpen) koutsuFu *= 2; // 暗刻は2倍
      fu += koutsuFu;
    } else if (m.type === 'kantsu') {
      const isYaochu = m.suit === 'z' || m.value === 1 || m.value === 9;
      let kantsuFu = isYaochu ? 16 : 8;
      if (!m.isOpen) kantsuFu *= 2; // 暗槓は2倍
      fu += kantsuFu;
    }
  }

  // 待ちの符 (単騎、嵌張、辺張は +2符)
  let waitFu = 0;
  if (s.head.suit === winningTile.suit && s.head.value === winningTile.value) {
    waitFu = 2; // 単騎待ち
  } else {
    for (const m of s.melds) {
      if (m.type === 'shuntsu' && m.suit === winningTile.suit) {
        if (m.value + 1 === winningTile.value) {
          waitFu = 2; // 嵌張待ち
        } else if ((m.value === 1 && winningTile.value === 3) || (m.value === 7 && winningTile.value === 7)) {
          waitFu = 2; // 辺張待ち
        }
      }
    }
  }
  fu += waitFu;

  // 1の位切り上げ (例: 22符 -> 30符)
  return Math.ceil(fu / 10) * 10;
}
