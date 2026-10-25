import { describe, it, expect } from 'vitest';
import { createDeck, countDora, isSameTile } from './tiles';
import { calculateShanten, isTenpai, getWaitingTiles } from './shanten';
import { judgeYaku } from './yaku';
import { calculateScore } from './score';
import { getDiscardAdvice, getActionAdvice } from './advisor';
import { createInitialGame, startRound } from './gameEngine';
import { Tile } from '../types/mahjong';

describe('麻雀牌ロジック (tiles)', () => {
  it('136枚の牌が正しく生成され、赤ドラが3枚含まれること', () => {
    const deck = createDeck();
    expect(deck.length).toBe(136);

    const redTiles = deck.filter((t) => t.isRed);
    expect(redTiles.length).toBe(3);

    const redM = redTiles.find((t) => t.suit === 'm' && t.value === 5);
    const redP = redTiles.find((t) => t.suit === 'p' && t.value === 5);
    const redS = redTiles.find((t) => t.suit === 's' && t.value === 5);
    expect(redM).toBeDefined();
    expect(redP).toBeDefined();
    expect(redS).toBeDefined();
  });

  it('ドラのカウントが正しく動作すること', () => {
    // 1m 表示牌 -> ドラは 2m
    const indicator: Tile = { id: 1, suit: 'm', value: 1 };
    const doraTile: Tile = { id: 2, suit: 'm', value: 2 };
    const nonDoraTile: Tile = { id: 3, suit: 'm', value: 3 };

    expect(countDora(doraTile, [indicator])).toBe(1);
    expect(countDora(nonDoraTile, [indicator])).toBe(0);
  });
});

describe('向聴数・テンパイ判定 (shanten)', () => {
  it('一般手のアガリ形はシャンテン数 -1 になること', () => {
    // 123m 456p 789s 111z 22z (14枚)
    const hand: Tile[] = [
      { id: 1, suit: 'm', value: 1 },
      { id: 2, suit: 'm', value: 2 },
      { id: 3, suit: 'm', value: 3 },
      { id: 4, suit: 'p', value: 4 },
      { id: 5, suit: 'p', value: 5 },
      { id: 6, suit: 'p', value: 6 },
      { id: 7, suit: 's', value: 7 },
      { id: 8, suit: 's', value: 8 },
      { id: 9, suit: 's', value: 9 },
      { id: 10, suit: 'z', value: 1 },
      { id: 11, suit: 'z', value: 1 },
      { id: 12, suit: 'z', value: 1 },
      { id: 13, suit: 'z', value: 2 },
      { id: 14, suit: 'z', value: 2 },
    ];
    expect(calculateShanten(hand)).toBe(-1);
  });

  it('テンパイ形はシャンテン数 0 になり、待ち牌が特定できること', () => {
    // 23m 456p 789s 111z 22z (13枚、1m-4m待ち)
    const hand: Tile[] = [
      { id: 2, suit: 'm', value: 2 },
      { id: 3, suit: 'm', value: 3 },
      { id: 4, suit: 'p', value: 4 },
      { id: 5, suit: 'p', value: 5 },
      { id: 6, suit: 'p', value: 6 },
      { id: 7, suit: 's', value: 7 },
      { id: 8, suit: 's', value: 8 },
      { id: 9, suit: 's', value: 9 },
      { id: 10, suit: 'z', value: 1 },
      { id: 11, suit: 'z', value: 1 },
      { id: 12, suit: 'z', value: 1 },
      { id: 13, suit: 'z', value: 2 },
      { id: 14, suit: 'z', value: 2 },
    ];
    expect(isTenpai(hand)).toBe(true);

    const waits = getWaitingTiles(hand);
    expect(waits.some((w) => w.suit === 'm' && w.value === 1)).toBe(true);
    expect(waits.some((w) => w.suit === 'm' && w.value === 4)).toBe(true);
  });

  it('七対子のアガリ形が -1 になること', () => {
    // 11m 33m 55p 77p 22s 44s 11z
    const hand: Tile[] = [
      { id: 1, suit: 'm', value: 1 },
      { id: 2, suit: 'm', value: 1 },
      { id: 3, suit: 'm', value: 3 },
      { id: 4, suit: 'm', value: 3 },
      { id: 5, suit: 'p', value: 5 },
      { id: 6, suit: 'p', value: 5 },
      { id: 7, suit: 'p', value: 7 },
      { id: 8, suit: 'p', value: 7 },
      { id: 9, suit: 's', value: 2 },
      { id: 10, suit: 's', value: 2 },
      { id: 11, suit: 's', value: 4 },
      { id: 12, suit: 's', value: 4 },
      { id: 13, suit: 'z', value: 1 },
      { id: 14, suit: 'z', value: 1 },
    ];
    expect(calculateShanten(hand)).toBe(-1);
  });
});

describe('役判定 (yaku)', () => {
  it('断幺九 (タンヤオ) が成立すること', () => {
    // 234m 345p 456s 678s 55p
    const hand: Tile[] = [
      { id: 1, suit: 'm', value: 2 },
      { id: 2, suit: 'm', value: 3 },
      { id: 3, suit: 'm', value: 4 },
      { id: 4, suit: 'p', value: 3 },
      { id: 5, suit: 'p', value: 4 },
      { id: 6, suit: 'p', value: 5 },
      { id: 7, suit: 's', value: 4 },
      { id: 8, suit: 's', value: 5 },
      { id: 9, suit: 's', value: 6 },
      { id: 10, suit: 's', value: 6 },
      { id: 11, suit: 's', value: 7 },
      { id: 12, suit: 's', value: 8 },
      { id: 13, suit: 'p', value: 5 },
      { id: 14, suit: 'p', value: 5 },
    ];

    const result = judgeYaku({
      hand,
      winningTile: { id: 14, suit: 'p', value: 5 },
      isTsumo: true,
      isRiichi: false,
      melds: [],
      roundWind: 0,
      playerWind: 1,
      doraIndicators: [],
    });

    expect(result.yakuList.some((y) => y.name === '断幺九')).toBe(true);
  });
});

describe('点数計算 (score)', () => {
  it('子・満貫 (5翻) のロン和了で8,000点となること', () => {
    const score = calculateScore({
      han: 5,
      fu: 30,
      isYakuman: false,
      isParent: false,
      isTsumo: false,
      honba: 0,
      riichiSticks: 0,
      winnerIndex: 1,
      fromPlayerIndex: 0,
      yakuList: [{ name: '満貫手', han: 5 }],
      winningTile: { id: 1, suit: 'm', value: 1 },
    });

    expect(score.score).toBe(8000);
    expect(score.scoreDelta[1]).toBe(8000);
    expect(score.scoreDelta[0]).toBe(-8000);
  });

  it('親・満貫 (5翻) のロン和了で12,000点となること', () => {
    const score = calculateScore({
      han: 5,
      fu: 30,
      isYakuman: false,
      isParent: true,
      isTsumo: false,
      honba: 0,
      riichiSticks: 0,
      winnerIndex: 0,
      fromPlayerIndex: 2,
      yakuList: [{ name: '満貫手', han: 5 }],
      winningTile: { id: 1, suit: 'm', value: 1 },
    });

    expect(score.score).toBe(12000);
    expect(score.scoreDelta[0]).toBe(12000);
    expect(score.scoreDelta[2]).toBe(-12000);
  });
});

describe('初心者サポート・AIアドバイス (advisor)', () => {
  it('自分のツモ番でおすすめ捨て牌と理由が算出されること', () => {
    const game = startRound(
      createInitialGame([
        { id: '0', name: 'マサ', isAi: false },
        { id: '1', name: 'CPU1', isAi: true },
        { id: '2', name: 'CPU2', isAi: true },
        { id: '3', name: 'CPU3', isAi: true },
      ])
    );

    const advice = getDiscardAdvice(game, 0);
    expect(advice).not.toBeNull();
    expect(advice?.recommendedTile).toBeDefined();
    expect(advice?.reason.length).toBeGreaterThan(0);
  });

  it('役牌（發）のポンチャンスではポンが推奨されること', () => {
    const game = startRound(
      createInitialGame([
        { id: '0', name: 'マサ', isAi: false },
        { id: '1', name: 'CPU1', isAi: true },
        { id: '2', name: 'CPU2', isAi: true },
        { id: '3', name: 'CPU3', isAi: true },
      ])
    );
    const hatsu: Tile = { id: 99, suit: 'z', value: 6 };
    game.lastDiscardTile = hatsu;

    const actAdvice = getActionAdvice(
      {
        canRon: false,
        canTsumo: false,
        canRiichi: [],
        canPon: [[{ id: 97, suit: 'z', value: 6 }, { id: 98, suit: 'z', value: 6 }]],
        canChi: [],
        canKan: [],
      },
      game,
      0
    );

    expect(actAdvice?.recommendedAction).toBe('pon');
    expect(actAdvice?.urgency).toBe('good');
  });
});
