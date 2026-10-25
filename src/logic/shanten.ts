import { Meld, Tile } from '../types/mahjong';

/**
 * 34種の牌インデックスへの変換
 * 0-8: 萬子 1-9
 * 9-17: 筒子 1-9
 * 18-26: 索子 1-9
 * 27-33: 字牌 1-7 (東南西北白發中)
 */
export function tileToIndex(tile: Tile): number {
  if (tile.suit === 'm') return tile.value - 1;
  if (tile.suit === 'p') return 9 + tile.value - 1;
  if (tile.suit === 's') return 18 + tile.value - 1;
  return 27 + tile.value - 1;
}

export function indexToTileInfo(idx: number): { suit: 'm' | 'p' | 's' | 'z'; value: number } {
  if (idx < 9) return { suit: 'm', value: idx + 1 };
  if (idx < 18) return { suit: 'p', value: idx - 9 + 1 };
  if (idx < 27) return { suit: 's', value: idx - 18 + 1 };
  return { suit: 'z', value: idx - 27 + 1 };
}

/**
 * 手牌から34種のカウント配列を作成
 */
export function countTiles(tiles: Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const t of tiles) {
    counts[tileToIndex(t)]++;
  }
  return counts;
}

/**
 * 七対子のシャンテン数 (門前限定)
 */
export function calcChitoitsuShanten(counts: number[]): number {
  let pairs = 0;
  let kinds = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) pairs++;
    if (counts[i] >= 1) kinds++;
  }
  let shanten = 6 - pairs;
  if (kinds < 7) {
    shanten += 7 - kinds;
  }
  return shanten;
}

/**
 * 国士無双のシャンテン数 (門前限定)
 */
export function calcKokushiShanten(counts: number[]): number {
  const terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let kinds = 0;
  let hasPair = false;

  for (const idx of terminals) {
    if (counts[idx] >= 1) kinds++;
    if (counts[idx] >= 2) hasPair = true;
  }

  return 13 - kinds - (hasPair ? 1 : 0);
}

/**
 * 一般手（面子手）のシャンテン数計算
 */
export function calcStandardShanten(counts: number[], meldCount: number = 0): number {
  const targetMelds = 4 - meldCount;
  let minShanten = 8;

  // 再帰探索で最大面子数と搭子数を探索
  function search(idx: number, melds: number, taatsu: number, hasHead: boolean, c: number[]) {
    // 枝刈り
    const currentShanten = 8 - 2 * (meldCount + melds) - taatsu - (hasHead ? 1 : 0);
    if (currentShanten < minShanten) {
      minShanten = currentShanten;
    }

    if (idx >= 34) return;

    // 現在の牌がない場合は次へ
    if (c[idx] === 0) {
      search(idx + 1, melds, taatsu, hasHead, c);
      return;
    }

    // 1. 雀頭候補 (2枚以上)
    if (!hasHead && c[idx] >= 2) {
      c[idx] -= 2;
      search(idx, melds, taatsu, true, c);
      c[idx] += 2;
    }

    // 2. 刻子 (3枚以上)
    if (c[idx] >= 3 && meldCount + melds < 4) {
      c[idx] -= 3;
      search(idx, melds + 1, taatsu, hasHead, c);
      c[idx] += 3;
    }

    // 3. 順子 (数牌かつ i, i+1, i+2)
    const suitOfIdx = idx < 9 ? 0 : idx < 18 ? 1 : idx < 27 ? 2 : 3;
    const numInSuit = idx % 9;
    if (suitOfIdx < 3 && numInSuit <= 6 && meldCount + melds < 4) {
      if (c[idx] >= 1 && c[idx + 1] >= 1 && c[idx + 2] >= 1) {
        c[idx]--;
        c[idx + 1]--;
        c[idx + 2]--;
        search(idx, melds + 1, taatsu, hasHead, c);
        c[idx]++;
        c[idx + 1]++;
        c[idx + 2]++;
      }
    }

    // 4. 搭子・対子 (面子+搭子の合計は 4 - meldCount まで有効)
    if (meldCount + melds + taatsu < 4) {
      // 対子 (雀頭として使わない搭子扱い)
      if (c[idx] >= 2) {
        c[idx] -= 2;
        search(idx, melds, taatsu + 1, hasHead, c);
        c[idx] += 2;
      }
      // 辺張・両面搭子 (i, i+1)
      if (suitOfIdx < 3 && numInSuit <= 7 && c[idx] >= 1 && c[idx + 1] >= 1) {
        c[idx]--;
        c[idx + 1]--;
        search(idx, melds, taatsu + 1, hasHead, c);
        c[idx]++;
        c[idx + 1]++;
      }
      // 嵌張搭子 (i, i+2)
      if (suitOfIdx < 3 && numInSuit <= 6 && c[idx] >= 1 && c[idx + 2] >= 1) {
        c[idx]--;
        c[idx + 2]--;
        search(idx, melds, taatsu + 1, hasHead, c);
        c[idx]++;
        c[idx + 2]++;
      }
    }

    // 搭子・面子として使わず次へ
    search(idx + 1, melds, taatsu, hasHead, c);
  }

  const cCopy = [...counts];
  search(0, 0, 0, false, cCopy);
  return minShanten;
}

/**
 * 総合シャンテン数を計算 (-1: アガリ, 0: テンパイ, 1: 一向聴, ...)
 */
export function calculateShanten(hand: Tile[], melds: Meld[] = []): number {
  const counts = countTiles(hand);
  const meldCount = melds.length;
  const isMenzen = meldCount === 0;

  let minShanten = calcStandardShanten(counts, meldCount);

  // 門前の場合は七対子・国士無双も評価
  if (isMenzen && hand.length >= 13) {
    const chitoi = calcChitoitsuShanten(counts);
    if (chitoi < minShanten) {
      minShanten = chitoi;
    }
    const kokushi = calcKokushiShanten(counts);
    if (kokushi < minShanten) {
      minShanten = kokushi;
    }
  }

  return minShanten;
}

/**
 * テンパイしているか判定
 */
export function isTenpai(hand: Tile[], melds: Meld[] = []): boolean {
  return calculateShanten(hand, melds) <= 0;
}

/**
 * アガリ牌（待ち牌）リストを取得（テンパイ時に有効）
 */
export function getWaitingTiles(hand: Tile[], melds: Meld[] = []): { suit: 'm' | 'p' | 's' | 'z'; value: number }[] {
  const waits: { suit: 'm' | 'p' | 's' | 'z'; value: number }[] = [];
  const currentShanten = calculateShanten(hand, melds);
  if (currentShanten > 0) return waits; // テンパイしていない

  // 34種の牌を1枚ずつ足してみて、シャンテン数が -1 (アガリ) になる牌を特定
  for (let idx = 0; idx < 34; idx++) {
    const info = indexToTileInfo(idx);
    const testTile: Tile = { id: 9999, suit: info.suit, value: info.value };
    const testHand = [...hand, testTile];
    if (calculateShanten(testHand, melds) === -1) {
      waits.push(info);
    }
  }

  return waits;
}
