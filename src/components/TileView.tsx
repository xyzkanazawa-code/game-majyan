import React from 'react';
import { Tile } from '../types/mahjong';
import { MahjongTileArt } from './MahjongTileArt';

interface TileViewProps {
  tile?: Tile;
  isBack?: boolean;
  isRotated?: boolean;       // リーチ牌や鳴き牌の横向き表示
  isSelected?: boolean;      // 自分の手牌選択中の浮き上がり
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg'; // サイズ調整
  customSize?: { w: number; h: number }; // 画面幅に応じた動的サイズ指定
  className?: string;
  isDora?: boolean;
}

export const TileView: React.FC<TileViewProps> = ({
  tile,
  isBack = false,
  isRotated = false,
  isSelected = false,
  onClick,
  size = 'md',
  customSize,
  className = '',
  isDora = false,
}) => {
  // サイズごとのピクセル寸法 (麻雀牌の標準的な縦横比 約 1:1.35)
  const dims = customSize || {
    xs: { w: 20, h: 27 },
    sm: { w: 30, h: 40 },
    md: { w: 40, h: 54 },
    lg: { w: 48, h: 64 },
  }[size];

  const outerStyle: React.CSSProperties = isRotated
    ? { width: `${dims.h}px`, height: `${dims.w}px` }
    : { width: `${dims.w}px`, height: `${dims.h}px` };

  const innerSizeStyle: React.CSSProperties = {
    width: `${dims.w}px`,
    height: `${dims.h}px`,
  };

  // 裏向き牌 (本格的な竹牌・琥珀イエローの牌背)
  if (isBack || !tile) {
    return (
      <div
        className={`relative select-none inline-flex items-center justify-center shrink-0 ${className}`}
        style={outerStyle}
      >
        <div
          className={`relative select-none inline-flex items-center justify-center shadow-md overflow-hidden rounded-[3px] shrink-0 ${
            isRotated ? 'rotate-90' : ''
          }`}
          style={{
            ...innerSizeStyle,
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 60%, #78350f 100%)',
            border: '1px solid #92400e',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
          }}
        >
          {/* 竹の目模様のテクスチャライン */}
          <div className="w-[86%] h-[88%] rounded-[2px] border border-amber-300/30 flex items-center justify-center bg-gradient-to-b from-amber-500/40 to-amber-700/60 shadow-inner">
            <div className="w-full h-full opacity-15 flex flex-col justify-around py-1">
              <div className="w-full h-[1px] bg-white"></div>
              <div className="w-full h-[1px] bg-white"></div>
              <div className="w-full h-[1px] bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative select-none inline-flex items-center justify-center shrink-0 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={outerStyle}
    >
      <div
        className={`relative select-none inline-flex items-center justify-center transition-all duration-150 overflow-visible shrink-0 ${
          isRotated ? 'rotate-90' : ''
        } ${
          isSelected
            ? '-translate-y-3 shadow-2xl ring-2 ring-amber-400 brightness-105'
            : onClick
            ? 'hover:-translate-y-1 hover:shadow-xl'
            : ''
        } ${isDora ? 'ring-2 ring-yellow-400' : ''}`}
        style={{
          ...innerSizeStyle,
          // 象牙・白ユリア樹脂の高級感あるグラデーションと面取り
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 60%, #eceae0 100%)',
          border: '1px solid #d4d0c5',
          borderTop: '1px solid #ffffff',
          borderBottom: dims.w >= 36 ? '3.5px solid #b8b3a0' : '2.5px solid #b8b3a0',
          borderRadius: dims.w >= 40 ? '6px' : '4px',
          boxShadow: isSelected
            ? '0 12px 20px -3px rgba(0, 0, 0, 0.5), inset 0 1px 2px #ffffff'
            : '0 3px 6px rgba(0, 0, 0, 0.28), inset 0 1px 1px #ffffff',
        }}
      >
        {/* 本格的な牌の彫刻アート */}
        <MahjongTileArt tile={tile} isDora={isDora} />

        {/* ドラバッジ */}
        {isDora && (
          <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1 py-0.2 rounded-full font-black shadow-md border border-white/60 leading-tight">
            ドラ
          </span>
        )}
      </div>
    </div>
  );
};
