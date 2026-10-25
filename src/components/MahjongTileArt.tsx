import React from 'react';
import { Suit, Tile } from '../types/mahjong';

interface TileArtProps {
  tile: Tile;
  isDora?: boolean;
}

/**
 * 本格的な麻雀牌ベクターSVG描画コンポーネント
 */
export const MahjongTileArt: React.FC<TileArtProps> = ({ tile }) => {
  const { suit, value, isRed } = tile;

  // ─── 萬子 (Manzu) ───
  if (suit === 'm') {
    const kanjiNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const numChar = kanjiNums[value];
    const textColor = isRed ? '#dc2626' : '#b91c1c';
    const wanColor = isRed ? '#ef4444' : '#991b1b';

    return (
      <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
        {/* 数字の漢字 */}
        <text
          x="24"
          y="27"
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize="24"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
          fontWeight="900"
          style={{ textShadow: '0 0.5px 0.5px rgba(0,0,0,0.15)' }}
        >
          {numChar}
        </text>
        {/* 萬 の文字 */}
        <text
          x="24"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          fill={wanColor}
          fontSize="18"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
          fontWeight="bold"
        >
          萬
        </text>
        {/* 赤ドラのダイヤ装飾 */}
        {isRed && (
          <circle cx="41" cy="7" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />
        )}
      </svg>
    );
  }

  // ─── 筒子 (Pinzu) ───
  if (suit === 'p') {
    // ピンズの単体円パーツ
    const renderCircle = (cx: number, cy: number, r: number, color: string, ringColor = '#1e3a8a') => (
      <g key={`${cx}-${cy}`}>
        {/* 外輪 */}
        <circle cx={cx} cy={cy} r={r} fill={color} stroke={ringColor} strokeWidth={r * 0.25} />
        {/* 内芯の花・星 */}
        <circle cx={cx} cy={cy} r={r * 0.35} fill="#ffffff" />
        <circle cx={cx} cy={cy} r={r * 0.15} fill={color} />
      </g>
    );

    const blue = isRed ? '#dc2626' : '#1d4ed8';
    const red = isRed ? '#ef4444' : '#dc2626';
    const green = isRed ? '#b91c1c' : '#15803d';

    // 1筒 (巨大な車輪・花紋様)
    if (value === 1) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          <g transform="translate(24, 32)">
            {/* 外輪の花弁ギザギザ */}
            <circle cx="0" cy="0" r="18" fill="none" stroke={blue} strokeWidth="2.5" strokeDasharray="3 1.5" />
            <circle cx="0" cy="0" r="15" fill={blue} stroke="#1e3a8a" strokeWidth="1" />
            {/* 放射状の花びら */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={i}
                x1="0"
                y1="-6"
                x2="0"
                y2="-13"
                stroke="#ffffff"
                strokeWidth="1.5"
                transform={`rotate(${i * 30})`}
              />
            ))}
            {/* 中央の真紅の芯 */}
            <circle cx="0" cy="0" r="6" fill={red} stroke="#fbbf24" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          </g>
          {isRed && <circle cx="41" cy="7" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />}
        </svg>
      );
    }

    // 2筒
    if (value === 2) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(24, 18, 9, green)}
          {renderCircle(24, 46, 9, blue)}
        </svg>
      );
    }

    // 3筒
    if (value === 3) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(14, 16, 7.5, blue)}
          {renderCircle(24, 32, 7.5, red)}
          {renderCircle(34, 48, 7.5, green)}
        </svg>
      );
    }

    // 4筒
    if (value === 4) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(15, 18, 8, blue)}
          {renderCircle(33, 18, 8, green)}
          {renderCircle(15, 46, 8, green)}
          {renderCircle(33, 46, 8, blue)}
        </svg>
      );
    }

    // 5筒 (四隅 + 中央赤)
    if (value === 5) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(14, 17, 7, blue)}
          {renderCircle(34, 17, 7, green)}
          {renderCircle(24, 32, 8, red, isRed ? '#fbbf24' : '#991b1b')}
          {renderCircle(14, 47, 7, green)}
          {renderCircle(34, 47, 7, blue)}
          {isRed && <circle cx="41" cy="7" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />}
        </svg>
      );
    }

    // 6筒
    if (value === 6) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(15, 16, 7, green)}
          {renderCircle(33, 16, 7, green)}
          {renderCircle(15, 32, 7, red)}
          {renderCircle(33, 32, 7, red)}
          {renderCircle(15, 48, 7, red)}
          {renderCircle(33, 48, 7, red)}
        </svg>
      );
    }

    // 7筒 (斜め3 + 下4)
    if (value === 7) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(12, 12, 5.5, green)}
          {renderCircle(24, 18, 5.5, green)}
          {renderCircle(36, 24, 5.5, green)}
          {renderCircle(15, 37, 6.5, red)}
          {renderCircle(33, 37, 6.5, red)}
          {renderCircle(15, 51, 6.5, red)}
          {renderCircle(33, 51, 6.5, red)}
        </svg>
      );
    }

    // 8筒
    if (value === 8) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(15, 14, 5.5, blue)}
          {renderCircle(33, 14, 5.5, blue)}
          {renderCircle(15, 26, 5.5, blue)}
          {renderCircle(33, 26, 5.5, blue)}
          {renderCircle(15, 38, 5.5, blue)}
          {renderCircle(33, 38, 5.5, blue)}
          {renderCircle(15, 50, 5.5, blue)}
          {renderCircle(33, 50, 5.5, blue)}
        </svg>
      );
    }

    // 9筒 (3x3)
    if (value === 9) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderCircle(13, 16, 6, blue)}
          {renderCircle(24, 16, 6, blue)}
          {renderCircle(35, 16, 6, blue)}
          {renderCircle(13, 32, 6, red)}
          {renderCircle(24, 32, 6, red)}
          {renderCircle(35, 32, 6, red)}
          {renderCircle(13, 48, 6, green)}
          {renderCircle(24, 48, 6, green)}
          {renderCircle(35, 48, 6, green)}
        </svg>
      );
    }
  }

  // ─── 索子 (Souzu) ───
  if (suit === 's') {
    // 竹の節パーツ
    const renderBamboo = (x: number, y: number, w: number, h: number, color: string, hasRedBand = false) => (
      <g key={`${x}-${y}`}>
        {/* 竹の棒本体 */}
        <rect x={x} y={y} width={w} height={h} rx={w * 0.4} fill={color} stroke="#064e3b" strokeWidth="0.5" />
        {/* 竹の節の溝 */}
        <line x1={x + 0.5} y1={y + h * 0.33} x2={x + w - 0.5} y2={y + h * 0.33} stroke="#ffffff" strokeWidth="0.8" />
        <line x1={x + 0.5} y1={y + h * 0.66} x2={x + w - 0.5} y2={y + h * 0.66} stroke="#ffffff" strokeWidth="0.8" />
        {/* 中央の帯 */}
        {hasRedBand && (
          <rect x={x} y={y + h * 0.4} width={w} height={h * 0.2} fill="#ef4444" />
        )}
      </g>
    );

    const green = isRed ? '#dc2626' : '#15803d';
    const red = '#dc2626';

    // 1索 (伝統的で優美な孔雀)
    if (value === 1) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-0.5 select-none pointer-events-none">
          {/* 孔雀の尾羽（放射状の美しい扇） */}
          <path d="M 24 38 C 14 30, 8 20, 10 12 C 12 6, 20 8, 24 24" fill="#15803d" opacity="0.9" />
          <path d="M 24 38 C 34 30, 40 20, 38 12 C 36 6, 28 8, 24 24" fill="#15803d" opacity="0.9" />
          <path d="M 24 38 C 20 24, 18 12, 24 8 C 30 12, 28 24, 24 38" fill="#16a34a" />

          {/* 羽根の目玉紋様 */}
          <circle cx="13" cy="13" r="3" fill="#dc2626" />
          <circle cx="13" cy="13" r="1.5" fill="#fbbf24" />
          <circle cx="35" cy="13" r="3" fill="#dc2626" />
          <circle cx="35" cy="13" r="1.5" fill="#fbbf24" />
          <circle cx="24" cy="11" r="3.5" fill="#dc2626" />
          <circle cx="24" cy="11" r="1.8" fill="#fbbf24" />

          {/* 孔雀の胴体と首 */}
          <path d="M 24 44 C 20 40, 20 32, 24 28 C 27 25, 29 20, 28 17 C 26 15, 23 17, 23 19" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
          {/* 頭部と冠羽 */}
          <circle cx="28" cy="17" r="2.5" fill="#047857" />
          <path d="M 29 15 L 32 12" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          {/* 止まり木 */}
          <rect x="12" y="48" width="24" height="4" rx="2" fill="#b45309" />
          {/* 脚 */}
          <line x1="22" y1="44" x2="21" y2="48" stroke="#78350f" strokeWidth="1.5" />
          <line x1="26" y1="44" x2="27" y2="48" stroke="#78350f" strokeWidth="1.5" />

          {isRed && <circle cx="41" cy="7" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />}
        </svg>
      );
    }

    // 2索
    if (value === 2) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(21, 10, 6, 20, green)}
          {renderBamboo(21, 34, 6, 20, green)}
        </svg>
      );
    }

    // 3索
    if (value === 3) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(21, 9, 6, 19, green)}
          {renderBamboo(13, 35, 6, 19, green)}
          {renderBamboo(29, 35, 6, 19, green)}
        </svg>
      );
    }

    // 4索
    if (value === 4) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(14, 9, 5.5, 20, green)}
          {renderBamboo(28, 9, 5.5, 20, green)}
          {renderBamboo(14, 35, 5.5, 20, green)}
          {renderBamboo(28, 35, 5.5, 20, green)}
        </svg>
      );
    }

    // 5索
    if (value === 5) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(13, 9, 5, 19, green)}
          {renderBamboo(30, 9, 5, 19, green)}
          {renderBamboo(21.5, 22.5, 5, 19, isRed ? '#dc2626' : red, true)}
          {renderBamboo(13, 36, 5, 19, green)}
          {renderBamboo(30, 36, 5, 19, green)}
          {isRed && <circle cx="41" cy="7" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />}
        </svg>
      );
    }

    // 6索
    if (value === 6) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(11, 9, 5, 20, green)}
          {renderBamboo(21.5, 9, 5, 20, green)}
          {renderBamboo(32, 9, 5, 20, green)}
          {renderBamboo(11, 35, 5, 20, green)}
          {renderBamboo(21.5, 35, 5, 20, green)}
          {renderBamboo(32, 35, 5, 20, green)}
        </svg>
      );
    }

    // 7索
    if (value === 7) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(21.5, 8, 5, 15, red, true)}
          {renderBamboo(11, 25, 5, 16, green)}
          {renderBamboo(21.5, 25, 5, 16, green)}
          {renderBamboo(32, 25, 5, 16, green)}
          {renderBamboo(11, 43, 5, 16, green)}
          {renderBamboo(21.5, 43, 5, 16, green)}
          {renderBamboo(32, 43, 5, 16, green)}
        </svg>
      );
    }

    // 8索
    if (value === 8) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {/* ハの字型に傾いた竹 */}
          <g transform="translate(14, 18) rotate(15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(34, 18) rotate(-15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(20, 20) rotate(-15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(28, 20) rotate(15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(14, 46) rotate(15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(34, 46) rotate(-15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(20, 44) rotate(-15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
          <g transform="translate(28, 44) rotate(15)">
            {renderBamboo(-2.5, -9, 5, 18, green)}
          </g>
        </svg>
      );
    }

    // 9索 (3x3)
    if (value === 9) {
      return (
        <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
          {renderBamboo(11, 8, 5, 14, green)}
          {renderBamboo(21.5, 8, 5, 14, red, true)}
          {renderBamboo(32, 8, 5, 14, green)}
          {renderBamboo(11, 25, 5, 14, green)}
          {renderBamboo(21.5, 25, 5, 14, red, true)}
          {renderBamboo(32, 25, 5, 14, green)}
          {renderBamboo(11, 42, 5, 14, green)}
          {renderBamboo(21.5, 42, 5, 14, red, true)}
          {renderBamboo(32, 42, 5, 14, green)}
        </svg>
      );
    }
  }

  // ─── 字牌 (Jihai) ───
  if (suit === 'z') {
    switch (value) {
      case 1: // 東
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#18181b"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              東
            </text>
          </svg>
        );
      case 2: // 南
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#18181b"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              南
            </text>
          </svg>
        );
      case 3: // 西
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#18181b"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              西
            </text>
          </svg>
        );
      case 4: // 北
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#18181b"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              北
            </text>
          </svg>
        );
      case 5: // 白 (伝統の二重枠)
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <rect
              x="10"
              y="12"
              width="28"
              height="40"
              rx="4"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="2.5"
            />
            <rect
              x="13"
              y="15"
              width="22"
              height="34"
              rx="2.5"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1"
            />
          </svg>
        );
      case 6: // 發
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#15803d"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              發
            </text>
          </svg>
        );
      case 7: // 中
        return (
          <svg viewBox="0 0 48 64" className="w-full h-full p-1 select-none pointer-events-none">
            <text
              x="24"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#dc2626"
              fontSize="34"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif"
              fontWeight="900"
            >
              中
            </text>
          </svg>
        );
      default:
        return null;
    }
  }

  return null;
};
