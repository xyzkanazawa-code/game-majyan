import { Peer, DataConnection } from 'peerjs';
import { ActionType, ChatMessage, GameState, Tile } from '../types/mahjong';

export type NetworkMessage =
  | { type: 'STATE_SYNC'; state: GameState }
  | { type: 'ACTION_REQUEST'; playerIndex: number; action: ActionType; tiles?: Tile[] }
  | { type: 'DISCARD_REQUEST'; playerIndex: number; tile: Tile; isRiichi: boolean }
  | { type: 'CHAT_MESSAGE'; chat: ChatMessage }
  | { type: 'PLAYER_JOINED'; playerIndex: number; playerName: string };

export class PeerRoomManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private roomId: string = '';
  private onMessageCallback?: (msg: NetworkMessage) => void;
  private onConnectCallback?: (peerId: string) => void;

  public init(
    roomId: string,
    isHost: boolean,
    onMessage: (msg: NetworkMessage) => void,
    onConnect?: (peerId: string) => void
  ): Promise<string> {
    this.roomId = roomId;
    this.isHost = isHost;
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;

    return new Promise((resolve, reject) => {
      // Peer ID の決定 (ホストは roomId をそのまま PeerID にするかプレフィックス付与)
      const targetId = isHost ? `majyan-room-${roomId}` : undefined;
      const peer = new Peer(targetId as string, {
        debug: 1,
      });

      this.peer = peer;

      peer.on('open', (id) => {
        if (!isHost) {
          // ゲストの場合はホストへ接続
          const hostPeerId = `majyan-room-${roomId}`;
          const conn = peer.connect(hostPeerId, { reliable: true });
          this.setupConnection(conn);
        }
        resolve(id);
      });

      peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        // エラー時も動作継続できるようにする
      });
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.onConnectCallback) {
        this.onConnectCallback(conn.peer);
      }
    });

    conn.on('data', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data as NetworkMessage);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  public broadcast(msg: NetworkMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  public sendToHost(msg: NetworkMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  public destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}
