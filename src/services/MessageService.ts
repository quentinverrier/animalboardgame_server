import { GameState } from "../game/GameState";
import { WebSocket } from 'ws';

export class MessageService{

    public sendGameState(client: WebSocket, gameState: GameState){
        client.send(JSON.stringify({type: 'sendGameState', data: gameState }) )
    }
  }