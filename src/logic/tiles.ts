import { Suit, Tile } from '../types/mahjong';

/**
 * 麻雀牌136枚を生成（赤ドラ3枚含む）
 */
export function createDeck(): Tile[] {
  const deck: Tile[] = [];
  let id = 0;

  const suits: Suit[] = ['m', 'p', 's'];
  
  // 数牌: 萬子(m), 筒子(p), 索子(s) 各1〜9 を4枚ずつ (計108枚)
  for (const suit of suits) {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        // 赤ドラ: 各5の1枚目を赤ドラとする
        const isRed = (value === 5 && i === 0);
        deck.push({
          id: id++,
          suit,
          value,
          isRed,
        });
      }
    }
  }

  // 字牌: 1:東, 2:南, 3:西, 4:北, 5:白, 6:發, 7:中 各4枚 (計28枚)
  for (let value = 1; value <= 7; value++) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: id++,
        suit: 'z',
        value,
        isRed: false,
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates アルゴリズムによるシャッフル
 */
export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 牌の比較キー（ソート・理牌用）
 */
export function getTileSortKey(tile: Tile): number {
  const suitOrder: Record<Suit, number> = { m: 100, p: 200, s: 300, z: 400 };
  return suitOrder[tile.suit] + tile.value * 10 + (tile.isRed ? 0 : 1);
}

/**
 * 手牌の理牌（ソート）
 */
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => getTileSortKey(a) - getTileSortKey(b));
}

/**
 * 牌の文字列表記 (例: 1m, 5mr, 9p, 1z, 7z)
 */
export function getTileString(tile: Tile): string {
  return `${tile.value}${tile.suit}${tile.isRed ? 'r' : ''}`;
}

/**
 * 2つの牌が同一種か判定 (赤ドラの違いは同一種とみなす)
 */
export function isSameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

/**
 * ドラ表示牌から、対象となるドラの (suit, value) を取得
 */
export function getDoraTarget(indicator: Tile): { suit: Suit; value: number } {
  if (indicator.suit === 'z') {
    if (indicator.value >= 1 && indicator.value <= 4) {
      // 風牌: 東(1) -> 南(2) -> 西(3) -> 北(4) -> 東(1)
      return { suit: 'z', value: indicator.value === 4 ? 1 : indicator.value + 1 };
    } else {
      // 三元牌: 白(5) -> 發(6) -> 中(7) -> 白(5)
      return { suit: 'z', value: indicator.value === 7 ? 5 : indicator.value + 1 };
    }
  } else {
    // 数牌: 1 -> 2 -> ... -> 9 -> 1
    return {
      suit: indicator.suit,
      value: indicator.value === 9 ? 1 : indicator.value + 1,
    };
  }
}

/**
 * 指定の牌がドラであるかの判定および該当ドラ枚数
 */
export function countDora(tile: Tile, doraIndicators: Tile[], uraIndicators: Tile[] = []): number {
  let count = 0;

  // 赤ドラ加算
  if (tile.isRed) {
    count++;
  }

  // 表ドラ
  for (const indicator of doraIndicators) {
    const target = getDoraTarget(indicator);
    if (tile.suit === target.suit && tile.value === target.value) {
      count++;
    }
  }

  // 裏ドラ
  for (const indicator of uraIndicators) {
    const target = getDoraTarget(indicator);
    if (tile.suit === target.suit && tile.value === target.value) {
      count++;
    }
  }

  return count;
}
