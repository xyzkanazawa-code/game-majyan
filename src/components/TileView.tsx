import React from 'react';
import { Tile } from '../types/mahjong';

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
  // サイズごとのスタイル
  const sizeClasses = {
    sm: 'w-7 h-10 text-xs rounded-sm',
    md: 'w-9 h-13 text-sm rounded',
    lg: 'w-11 h-16 text-base rounded-md',
  }[size];

  // 裏向き牌
  if (isBack || !tile) {
    return (
      <div
        className={`relative select-none inline-flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-900 shadow-md ${sizeClasses} ${
          isRotated ? 'rotate-90 origin-center my-1' : ''
        } ${className}`}
      >
        <div className="w-[85%] h-[88%] rounded-sm bg-gradient-to-b from-amber-500 to-amber-700 border border-amber-400/40 opacity-90 shadow-inner flex items-center justify-center">
          <div className="w-2 h-2 rounded-full border border-amber-300/40"></div>
        </div>
      </div>
    );
  }

  // 牌の描画内容の決定
  const renderTileContent = () => {
    const { suit, value, isRed } = tile;

    // 赤ドラ判定
    const isRedTile = isRed;

    // 萬子 (m)
    if (suit === 'm') {
      const kanjiNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      const numChar = kanjiNums[value];
      const textColor = isRedTile ? 'text-red-600 font-extrabold' : 'text-red-700 font-bold';
      return (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className={`text-[1.1em] ${textColor}`}>{numChar}</span>
          <span className="text-[0.85em] text-red-700 font-semibold mt-[1px]">萬</span>
          {isRedTile && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          )}
        </div>
      );
    }

    // 筒子 (p)
    if (suit === 'p') {
      const pinColor = isRedTile ? 'text-red-500 font-black' : 'text-blue-700 font-bold';
      return (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className={`text-[1.3em] ${pinColor}`}>{value}</span>
          <div className="flex items-center justify-center mt-[-2px]">
            <span className={`text-[0.9em] ${isRedTile ? 'text-red-600' : 'text-blue-600'}`}>●</span>
          </div>
          {isRedTile && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          )}
        </div>
      );
    }

    // 索子 (s)
    if (suit === 's') {
      if (value === 1) {
        // 1索 (孔雀・鳥の象徴)
        return (
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-[1.25em] text-emerald-700">🀐</span>
          </div>
        );
      }
      const souColor = isRedTile ? 'text-red-600 font-black' : 'text-emerald-700 font-bold';
      return (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className={`text-[1.3em] ${souColor}`}>{value}</span>
          <span className="text-[0.7em] text-emerald-800 tracking-tighter">|||</span>
          {isRedTile && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          )}
        </div>
      );
    }

    // 字牌 (z): 1:東, 2:南, 3:西, 4:北, 5:白, 6:發, 7:中
    if (suit === 'z') {
      switch (value) {
        case 1:
          return <span className="text-[1.2em] font-bold text-gray-900">東</span>;
        case 2:
          return <span className="text-[1.2em] font-bold text-gray-900">南</span>;
        case 3:
          return <span className="text-[1.2em] font-bold text-gray-900">西</span>;
        case 4:
          return <span className="text-[1.2em] font-bold text-gray-900">北</span>;
        case 5:
          // 白 (枠のみ、または空白)
          return (
            <div className="w-[60%] h-[70%] border-2 border-blue-600 rounded-[2px] bg-white flex items-center justify-center shadow-xs">
              <span className="text-[0.6em] text-blue-500 font-bold opacity-30">白</span>
            </div>
          );
        case 6:
          // 發
          return <span className="text-[1.2em] font-bold text-emerald-700">發</span>;
        case 7:
          // 中
          return <span className="text-[1.2em] font-extrabold text-red-600">中</span>;
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`relative select-none inline-flex items-center justify-center cursor-pointer transition-all duration-150 ${sizeClasses} ${
        isRotated ? 'rotate-90 origin-center my-1.5' : ''
      } ${
        isSelected
          ? '-translate-y-3.5 shadow-xl ring-2 ring-yellow-400 brightness-105'
          : 'hover:-translate-y-1.5 hover:shadow-lg'
      } ${isDora ? 'ring-1 ring-amber-400' : ''} ${className}`}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f4f5f0 75%, #e1dfd5 100%)',
        border: '1px solid #c9c7be',
        borderBottom: '3px solid #b5b3a8',
        boxShadow: isSelected
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          : '0 2px 4px rgba(0, 0, 0, 0.18)',
      }}
    >
      {renderTileContent()}
      {isDora && (
        <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-black px-1 rounded-full font-bold shadow">
          ドラ
        </span>
      )}
    </div>
  );
};
