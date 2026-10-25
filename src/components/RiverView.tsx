import React from 'react';
import { Tile } from '../types/mahjong';
import { TileView } from './TileView';

interface RiverViewProps {
  discards: Tile[];
  riichiTurn?: number;
  lastDiscardId?: number;
  rotation?: 0 | 90 | 180 | 270;
}

export const RiverView: React.FC<RiverViewProps> = ({
  discards,
  riichiTurn,
  lastDiscardId,
  rotation = 0,
}) => {
  // 6枚ずつに分割
  const rows: Tile[][] = [];
  for (let i = 0; i < discards.length; i += 6) {
    rows.push(discards.slice(i, i + 6));
  }

  const rotationClass = {
    0: '',
    90: 'rotate-90',
    180: 'rotate-180',
    270: '-rotate-90',
  }[rotation];

  const isSideways = rotation === 90 || rotation === 270;

  const riverContent = (
    <div
      className={`w-[206px] min-h-[86px] flex flex-col gap-0.5 p-1 bg-black/20 rounded-md border border-white/5 shrink-0 ${rotationClass}`}
    >
      {rows.length === 0 ? (
        <div className="w-full h-[76px] flex items-center justify-center text-xs text-white/30 italic">
          捨て牌なし
        </div>
      ) : (
        rows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-0.5 items-center">
            {row.map((tile, cIdx) => {
              const tileGlobalIndex = rIdx * 6 + cIdx;
              const isRiichiTile = riichiTurn !== undefined && tileGlobalIndex === riichiTurn;
              const isLatest = tile.id === lastDiscardId;

              return (
                <div key={tile.id} className="relative">
                  <TileView
                    tile={tile}
                    size="sm"
                    isRotated={isRiichiTile}
                    className={isLatest ? 'ring-2 ring-yellow-400 rounded-[3px]' : ''}
                  />
                  {isLatest && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping z-10"></span>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  if (isSideways) {
    return (
      <div className="w-[86px] h-[206px] flex items-center justify-center shrink-0">
        {riverContent}
      </div>
    );
  }

  return riverContent;
};
