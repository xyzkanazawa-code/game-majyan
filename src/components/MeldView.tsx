import React from 'react';
import { Meld } from '../types/mahjong';
import { TileView } from './TileView';

interface MeldViewProps {
  melds: Meld[];
  size?: 'sm' | 'md';
}

export const MeldView: React.FC<MeldViewProps> = ({ melds, size = 'sm' }) => {
  if (!melds || melds.length === 0) return null;

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {melds.map((meld, mIdx) => (
        <div
          key={mIdx}
          className="flex gap-0.5 items-end bg-black/30 p-1 rounded border border-white/10 shadow"
        >
          {meld.tiles.map((tile, tIdx) => {
            const isCalled = tile.id === meld.calledTile.id;
            return (
              <TileView
                key={tile.id || tIdx}
                tile={tile}
                size={size}
                isRotated={isCalled}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
