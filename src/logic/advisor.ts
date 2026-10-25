import { AvailableActions, GameState, Meld, Player, Suit, Tile, Wind } from '../types/mahjong';
import { calculateShanten, getWaitingTiles, indexToTileInfo, tileToIndex } from './shanten';
import { isSameTile } from './tiles';

export interface DiscardAdvice {
  recommendedTile: Tile;
  secondTile?: Tile;
  currentShanten: number;
  statusText: string;          // 例: "あと1枚でテンパイ（1シャンテン）"
  reason: string;              // おすすめ理由の解説
  effectiveTileCount: number;  // 有効牌（受け入れ）の枚数
  waitingTiles: { suit: Suit; value: number }[]; // テンパイ時の待ち牌
  dangerWarning?: string;      // リーチ者がいる場合の危険度アドバイス
}

export interface ActionAdvice {
  recommendedAction: 'ron' | 'tsumo' | 'riichi' | 'pon' | 'chi' | 'kan' | 'pass';
  title: string;
  description: string;
  urgency: 'win' | 'good' | 'caution';
}

/**
 * 牌の日本語名称（初心者向け読み仮名つき）を取得
 */
export function getTileJapaneseName(tile: { suit: Suit; value: number; isRed?: boolean }): string {
  const { suit, value, isRed } = tile;
  if (suit === 'z') {
    const honorNames = [
      '',
      '東 (トン)',
      '南 (ナン)',
      '西 (シャー)',
      '北 (ペー)',
      '白 (ハク)',
      '發 (ハツ)',
      '中 (チュン)',
    ];
    return honorNames[value] || '字牌';
  }

  const numKanji = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const suitKanji: Record<Suit, string> = { m: '萬', p: '筒', s: '索', z: '' };
  const redPrefix = isRed ? '赤' : '';
  return `${redPrefix}${numKanji[value]}${suitKanji[suit]}`;
}

/**
 * 13枚の手牌に対して、どの牌を引けばシャンテン数が進むか（有効牌の種類と残り枚数）を計算
 */
function calcEffectiveTiles(
  hand13: Tile[],
  melds: Meld[],
  visibleTileCounts: number[]
): { kinds: number; totalCount: number; tiles: { suit: Suit; value: number }[] } {
  const baseShanten = calculateShanten(hand13, melds);
  let kinds = 0;
  let totalCount = 0;
  const tiles: { suit: Suit; value: number }[] = [];

  for (let idx = 0; idx < 34; idx++) {
    const info = indexToTileInfo(idx);
    const testTile: Tile = { id: 99999, suit: info.suit, value: info.value };
    const newShanten = calculateShanten([...hand13, testTile], melds);
    if (newShanten < baseShanten) {
      kinds++;
      const remaining = Math.max(0, 4 - visibleTileCounts[idx]);
      totalCount += remaining;
      tiles.push(info);
    }
  }

  return { kinds, totalCount, tiles };
}

/**
 * 場に見えている牌＋自分の手牌の枚数カウント（34種）
 */
function getVisibleTileCounts(gameState: GameState, myPlayer: Player): number[] {
  const counts = new Array(34).fill(0);

  // 自分の手牌
  for (const t of myPlayer.hand) {
    counts[tileToIndex(t)]++;
  }

  // 全員の捨て牌と副露
  for (const p of gameState.players) {
    for (const d of p.discards) {
      counts[tileToIndex(d)]++;
    }
    for (const m of p.melds) {
      for (const mt of m.tiles) {
        counts[tileToIndex(mt)]++;
      }
    }
  }

  // ドラ表示牌
  for (const d of gameState.doraIndicators) {
    counts[tileToIndex(d)]++;
  }

  return counts;
}

/**
 * 捨て牌のアドバイスを生成
 */
export function getDiscardAdvice(gameState: GameState, playerIndex: number): DiscardAdvice | null {
  const player = gameState.players[playerIndex];
  if (!player || player.hand.length % 3 !== 2) return null;

  const hand = player.hand;
  const visibleCounts = getVisibleTileCounts(gameState, player);

  // 他家にリーチ者がいるか確認
  const riichiPlayers = gameState.players.filter((p, idx) => idx !== playerIndex && p.isRiichi);

  // 各打牌候補を評価
  interface CandidateEval {
    tile: Tile;
    shantenAfter: number;
    effectiveCount: number;
    effectiveKinds: number;
    score: number;
    reason: string;
    isSafeAgainstRiichi: boolean;
    waits: { suit: Suit; value: number }[];
  }

  const evaluations: CandidateEval[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i < hand.length; i++) {
    const candidate = hand[i];
    const key = `${candidate.suit}-${candidate.value}-${candidate.isRed ? 'r' : 'n'}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const restHand = hand.filter((_, idx) => idx !== i);
    const shantenAfter = calculateShanten(restHand, player.melds);
    const eff = calcEffectiveTiles(restHand, player.melds, visibleCounts);
    const waits = shantenAfter === 0 ? getWaitingTiles(restHand, player.melds) : [];

    // リーチ者に対する現物（安全牌）かどうか
    const isSafeAgainstRiichi =
      riichiPlayers.length > 0 &&
      riichiPlayers.every((rp) => rp.discards.some((d) => isSameTile(d, candidate)));

    // 評価スコア算出
    let score = -shantenAfter * 1000 + eff.totalCount * 10 + eff.kinds * 3;
    let reason = '';

    const sameCountInHand = hand.filter((t) => isSameTile(t, candidate)).length;
    const isHonor = candidate.suit === 'z';
    const isYakuTile =
      isHonor &&
      (candidate.value >= 5 ||
        candidate.value === gameState.roundWind + 1 ||
        candidate.value === player.wind + 1);

    if (isHonor) {
      if (sameCountInHand === 1) {
        if (!isYakuTile) {
          score += 35;
          reason = '役にならない孤立した字牌（オタ風）なので、最初に整理するのがセオリーです。';
        } else {
          score += 18;
          reason = '1枚だけ浮いている字牌です。重なる前に早めに処理すると受け入れが広がります。';
        }
      } else if (sameCountInHand === 2 && isYakuTile) {
        score -= 80; // 役牌の対子は大事にする
      }
    } else {
      // 数牌の孤立度チェック
      const hasNeighbor = restHand.some(
        (t) => t.suit === candidate.suit && Math.abs(t.value - candidate.value) <= 2
      );
      if (!hasNeighbor && sameCountInHand === 1) {
        if (candidate.value === 1 || candidate.value === 9) {
          score += 28;
          reason = '周りにくっつく牌がない端牌（1・9）です。手牌をスリムにしつつタンヤオも狙いやすくなります。';
        } else {
          score += 15;
          reason = '周囲に近くの数字がない孤立牌です。他のまとまっている部分を残すのが有利です。';
        }
      }
    }

    // 赤ドラ・ドラはなるべく残す
    if (candidate.isRed) {
      score -= 45;
    }

    // テンパイ打牌の場合の理由付け
    if (shantenAfter === 0 && waits.length > 0) {
      const waitNames = waits.map((w) => getTileJapaneseName(w)).join('・');
      reason = `これを切ると【${waitNames}】待ち（計${eff.totalCount}枚）のテンパイになります！`;
      if (player.isMenzen && !player.isRiichi) {
        reason += '「リーチ」ボタンを押してから切るのがおすすめです！';
      }
    } else if (!reason) {
      if (eff.totalCount > 0) {
        reason = `これを切ると手牌の受け入れが一番広くなります（有効牌 ${eff.kinds}種 ${eff.totalCount}枚）。`;
      } else {
        reason = '不要な牌を整理して、次のツモに備えましょう。';
      }
    }

    // リーチ者がいて自分が2シャンテン以上なら安全牌優先度アップ
    if (riichiPlayers.length > 0 && shantenAfter >= 2 && isSafeAgainstRiichi) {
      score += 120;
      reason = '相手がリーチしています！この牌は相手がすでに捨てている「現物（100%安全な牌）」なので、ロンされる心配がありません。';
    }

    evaluations.push({
      tile: candidate,
      shantenAfter,
      effectiveCount: eff.totalCount,
      effectiveKinds: eff.kinds,
      score,
      reason,
      isSafeAgainstRiichi,
      waits,
    });
  }

  evaluations.sort((a, b) => b.score - a.score);
  const best = evaluations[0];
  const second = evaluations[1];

  // 現在のシャンテン数表示テキスト
  let statusText = '';
  if (best.shantenAfter === 0) {
    statusText = '🔥 テンパイ（あと1枚でアガリ！）';
  } else if (best.shantenAfter === 1) {
    statusText = '✨ 1シャンテン（あと1枚でテンパイ！）';
  } else if (best.shantenAfter === 2) {
    statusText = '🌱 2シャンテン（順調に手が育っています）';
  } else {
    statusText = `🀄 ${best.shantenAfter}シャンテン（まずは孤立した字牌や1・9牌を整理しましょう）`;
  }

  let dangerWarning: string | undefined;
  if (riichiPlayers.length > 0) {
    const names = riichiPlayers.map((p) => p.name).join('・');
    if (best.isSafeAgainstRiichi) {
      dangerWarning = `🛡️ ${names}がリーチ中ですが、【${getTileJapaneseName(best.tile)}】は安全な現物です。`;
    } else {
      dangerWarning = `⚠️ ${names}がリーチ中です！相手の捨て牌にある同じ牌（現物）を切るとロンされません。`;
    }
  }

  return {
    recommendedTile: best.tile,
    secondTile: second?.tile,
    currentShanten: best.shantenAfter,
    statusText,
    reason: best.reason,
    effectiveTileCount: best.effectiveCount,
    waitingTiles: best.waits,
    dangerWarning,
  };
}

/**
 * ポン・チー・カン・リーチ・ロン・ツモの初心者向けアクション案内を生成
 */
export function getActionAdvice(
  actions: AvailableActions,
  gameState: GameState,
  playerIndex: number
): ActionAdvice | null {
  const player = gameState.players[playerIndex];
  if (!player) return null;

  // 1. ロン
  if (actions.canRon) {
    return {
      recommendedAction: 'ron',
      title: '🎉 ロン（アガリ）できます！',
      description: '相手が捨てた牌でアガリ形が完成しました！迷わず「ロン！」ボタンを押して点数を獲得しましょう！',
      urgency: 'win',
    };
  }

  // 2. ツモ
  if (actions.canTsumo) {
    return {
      recommendedAction: 'tsumo',
      title: '🎉 ツモ（アガリ）できます！',
      description: '自分で引いた牌でアガリ形が完成しました！「ツモ！」ボタンを押してアガリましょう！',
      urgency: 'win',
    };
  }

  // 3. リーチ
  if (actions.canRiichi.length > 0) {
    return {
      recommendedAction: 'riichi',
      title: '🔥 リーチ（立直）の大チャンス！',
      description:
        'あと1枚でアガれる「テンパイ」状態です！「リーチ」ボタンを押すと『立直』という役がつき、アガった時に裏ドラもめくれます！',
      urgency: 'good',
    };
  }

  // 4. カン
  if (actions.canKan.length > 0) {
    const kanTile = actions.canKan[0][0];
    return {
      recommendedAction: 'kan',
      title: `💡 【${getTileJapaneseName(kanTile)}】が4枚揃いました（カン）`,
      description:
        '同じ牌4枚で「カン」をすると、新しいドラが1枚増えて高得点のチャンスになります！もう1枚山から牌を引けます。',
      urgency: 'good',
    };
  }

  // 5. ポン・チーの判定（役があるかどうかでおすすめ度を分岐！）
  if (actions.canPon.length > 0 || actions.canChi.length > 0) {
    const discardTile = gameState.lastDiscardTile;
    if (!discardTile) return null;

    // すでに役牌を鳴いているかチェック
    const alreadyHasYakuMeld = player.melds.some((m) => {
      const t = m.tiles[0];
      return (
        t.suit === 'z' &&
        (t.value >= 5 || t.value === gameState.roundWind + 1 || t.value === player.wind + 1)
      );
    });

    // 今回ポンできる牌が役牌（白・發・中・場風・自風）かチェック
    const isCurrentPonYaku =
      actions.canPon.length > 0 &&
      discardTile.suit === 'z' &&
      (discardTile.value >= 5 ||
        discardTile.value === gameState.roundWind + 1 ||
        discardTile.value === player.wind + 1);

    // 手牌＋副露がすべて中張牌（2〜8）でタンヤオが狙えるかチェック
    const allTiles = [...player.hand, ...player.melds.flatMap((m) => m.tiles), discardTile];
    const yaochuCount = allTiles.filter(
      (t) => t.suit === 'z' || t.value === 1 || t.value === 9
    ).length;
    const isTanyaoLikely = yaochuCount <= 1;

    if (isCurrentPonYaku) {
      return {
        recommendedAction: 'pon',
        title: `👍 【${getTileJapaneseName(discardTile)}】のポンがおすすめです！`,
        description: `【${getTileJapaneseName(discardTile)}】は3枚揃えるだけで「役牌（ヤクハイ）」という役が確定します！鳴いても確実にアガれるので積極的に「ポン」しましょう！`,
        urgency: 'good',
      };
    }

    if (alreadyHasYakuMeld) {
      const actType = actions.canPon.length > 0 ? 'pon' : 'chi';
      const actName = actType === 'pon' ? 'ポン' : 'チー';
      return {
        recommendedAction: actType,
        title: `👍 役が確定しているので「${actName}」でOK！`,
        description:
          'すでに役牌を鳴いて役が確定しているため、さらに鳴いてアガリへスピードアップするのがおすすめです！',
        urgency: 'good',
      };
    }

    if (isTanyaoLikely) {
      const actType = actions.canPon.length > 0 ? 'pon' : 'chi';
      const actName = actType === 'pon' ? 'ポン' : 'チー';
      return {
        recommendedAction: actType,
        title: `💡 タンヤオ狙いで「${actName}」できます`,
        description:
          '2〜8の数字牌だけで揃える「タンヤオ（断幺九）」が狙えそうです！1・9・字牌をすべて捨てきればアガれます。迷ったら「パス」でも大丈夫です。',
        urgency: 'good',
      };
    }

    // 役が見えにくい鳴きの場合（初心者が一番ハマりやすい「役なし」を防ぐアドバイス！）
    return {
      recommendedAction: 'pass',
      title: '⚠️ ここは「パス」がおすすめです（役なし注意）',
      description:
        'ポンやチーをすると「リーチ」ができなくなります。白・發・中などの役牌や、2〜8だけで揃えるタンヤオなどの「役」がないと最後アガれなくなるため、ここは「パス」して自分のツモを待つのが安全です！',
      urgency: 'caution',
    };
  }

  return null;
}
