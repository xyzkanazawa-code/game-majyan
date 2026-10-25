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

  return (
    <div className={`flex flex-col gap-1 p-1 bg-black/15 rounded-md backdrop-blur-xs ${rotationClass}`}>
      {rows.length === 0 ? (
        <div className="w-48 h-20 flex items-center justify-center text-xs text-white/30 italic">
          捨て牌なし
        </div>
      ) : (
        rows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 items-center">
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
                    className={isLatest ? 'ring-2 ring-yellow-400' : ''}
                  />
                  {isLatest && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
