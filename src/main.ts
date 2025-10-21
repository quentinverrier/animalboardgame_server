import { WebSocket } from 'ws';
import { MessageService } from './services/MessageService';
import { GameState } from './game/GameState';
import { Player } from './game/Player';

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
const messageService = new MessageService();
let Tekson = new Player(0, "Tekson");
let Kigasha = new Player(1, "Kigasha");
let iSwitch = new Player(2, "iSwitch");
let gameState = new GameState([Tekson, Kigasha, iSwitch]);
let clientID = 999;
gameState.startGame();

wss.on('connection', (client, { socket }) => {
  console.log('New client connected!');
  // Send a welcome message to the new client
  client.send(JSON.stringify({ type: 'greeting', data: { message: `Hello ${socket.remoteAddress}!` } }));

  // Notify other clients that a new client has joined
  wss.clients.forEach((otherClient) => {
    if (otherClient !== client) {
      otherClient.send(JSON.stringify({ type: 'userConnected', data: { message: `${socket.remoteAddress} has joined!` } }));
    }
  });

  // When a message is received
  client.on('message', (message) => {
    // console.log(`Received: ${message}`);
    try {
      let messageParsed = JSON.parse(message.toString());
      console.log(messageParsed);
      if (messageParsed.type == "gatherGameState") {
        clientID = gameState.players.filter((player) => player.client == null)[0].id;
        gameState.players[clientID].client = client;
        client.send(JSON.stringify({type: 'sendID', data: clientID}))
      }
      if (messageParsed.type == "onPlay") {
        gameState.onPlay(messageParsed.data.choice, messageParsed.data.playerID)
      }
      if (messageParsed.type == "onKill") {
        gameState.onKill(messageParsed.data.choice, messageParsed.data.playerID)
      }
      wss.clients.forEach((client) => {
        messageService.sendGameState(client, gameState);
      })

      // Echo the message back to the client
      client.send(JSON.stringify({ type: 'echo', data: messageParsed.data }));
    }
    catch {
      client.send("nul ton message");
    }


  });

  // Handle client disconnect
  client.on('close', () => {
    clientID = gameState.players.filter((player) => player.client != null && player.client == client)[0].id;
    gameState.players[clientID].client = null;
    console.log('Client disconnected');
    // Notify other clients that a client has left
    wss.clients.forEach((otherClient) => {
      if (otherClient !== client) {
        otherClient.send(JSON.stringify({ type: 'userDisconnected', data: { message: `${socket.remoteAddress} has left!` } }));
      }
    });
  });
});

console.log('\x1b[32mWebSocket server is running on\x1b[0m \x1b[34mws://localhost:8080\x1b[0m');
