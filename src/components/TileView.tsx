import React from 'react';
import { Tile } from '../types/mahjong';
import { MahjongTileArt } from './MahjongTileArt';

interface TileViewProps {
  tile?: Tile;
  isBack?: boolean;
  isRotated?: boolean;       // リーチ牌や鳴き牌の横向き表示
  isSelected?: boolean;      // 自分の手牌選択中の浮き上がり
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg'; // サイズ調整
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
  className = '',
  isDora = false,
}) => {
  // サイズごとのスタイル (麻雀牌の標準的な縦横比 約 1:1.33)
  const sizeClasses = {
    sm: 'w-[30px] h-[40px] rounded-[3px]',
    md: 'w-[40px] h-[54px] rounded-[4px]',
    lg: 'w-[50px] h-[68px] rounded-[5px]',
  }[size];

  // 裏向き牌 (本格的な竹牌・琥珀イエローの牌背)
  if (isBack || !tile) {
    return (
      <div
        className={`relative select-none inline-flex items-center justify-center shadow-md overflow-hidden ${sizeClasses} ${
          isRotated ? 'rotate-90 origin-center my-1' : ''
        } ${className}`}
        style={{
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
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative select-none inline-flex items-center justify-center cursor-pointer transition-all duration-150 overflow-visible ${sizeClasses} ${
        isRotated ? 'rotate-90 origin-center my-1.5' : ''
      } ${
        isSelected
          ? '-translate-y-4 shadow-2xl ring-2 ring-amber-400 brightness-105'
          : 'hover:-translate-y-1.5 hover:shadow-xl'
      } ${isDora ? 'ring-2 ring-yellow-400' : ''} ${className}`}
      style={{
        // 象牙・白ユリア樹脂の高級感あるグラデーションと面取り
        background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 60%, #eceae0 100%)',
        border: '1px solid #d4d0c5',
        borderTop: '1px solid #ffffff',
        borderBottom: '3.5px solid #b8b3a0',
        borderRadius: size === 'lg' ? '6px' : '4px',
        boxShadow: isSelected
          ? '0 12px 20px -3px rgba(0, 0, 0, 0.5), inset 0 1px 2px #ffffff'
          : '0 3px 6px rgba(0, 0, 0, 0.28), inset 0 1px 1px #ffffff',
      }}
    >
      {/* 本格的な牌の彫刻アート */}
      <MahjongTileArt tile={tile} isDora={isDora} />

      {/* ドラバッジ */}
      {isDora && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.2 rounded-full font-black shadow-md border border-white/60">
          ドラ
        </span>
      )}
    </div>
  );
};
