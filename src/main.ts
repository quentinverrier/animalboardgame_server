import { WebSocket } from 'ws';
import { MessageService } from './services/MessageService';
import { GameState } from './game/GameState';
import { Player } from './game/Player';

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
const messageService = new MessageService();
// let Tekson = new Player(0, "Tekson");
// let Kigasha = new Player(1, "Kigasha");
// let iSwitch = new Player(2, "iSwitch");
let gameState = new GameState();
let gameStateToSend = new GameState();
let clientID = 999;
let nextPlayerID = 1;
let clientPlayer = [];

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
      if (messageParsed.type == "ID"){
        clientPlayer = gameState.players.filter((player) => player.id == clientID);
        if (messageParsed.data == null || clientPlayer.length != 1){
          if (gameState.players.length > 5){
            client.send(JSON.stringify({type: 'gameFull', data: clientID}));
          }
          else{
            clientID = nextPlayerID;
            gameState.players.push(new Player(clientID));
            clientPlayer = gameState.players.filter((player) => player.id == clientID);
            clientPlayer[0].client = client;
            client.send(JSON.stringify({type: 'sendID', data: clientID}));
            nextPlayerID++;
          }
        }
        else{
          clientID = Number(messageParsed.data);
          gameState.players.filter((player) => player.id == clientID)[0].client = client;
        }
      }
      if (messageParsed.type == "setName"){
        clientID = messageParsed.data.sessionID;
        console.log(messageParsed.data.name);
        gameState.players.filter((player) => player.id == clientID)[0].name = messageParsed.data.name;
      }
      if (messageParsed.type == "ready"){
        clientID = messageParsed.data.sessionID;
        gameState.players.filter((player) => player.id == clientID)[0].ready = true;
      }
      if (messageParsed.type == "startGame"){
        gameState.startGame();
      }
      if (messageParsed.type == "toLobby") {
        gameState.toLobby();
      }
      if (messageParsed.type == "onPlay") {
        gameState.onPlay(messageParsed.data.choice, messageParsed.data.sessionID);
      }
      if (messageParsed.type == "onKill") {
        gameState.onKill(messageParsed.data.choice, messageParsed.data.sessionID);
      }

      //send all clients the gameState after processing the message
      wss.clients.forEach((client) => {
        gameStateToSend.update(gameState);
        for (const player of gameStateToSend.players){
          console.log(player.client);
          if(player.client != client){
            player.handCards = [];
            player.boardCards = [];
          }
        }
        messageService.sendGameState(client, gameStateToSend);
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
    try{
      clientID = gameState.players.filter((player) => player.client != null && player.client == client)[0].id;
      gameState.players[clientID].client = null;
    }
    catch{
      console.log("No player to unassign")
    }
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
