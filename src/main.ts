import { WebSocket } from 'ws';

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (client, { socket }) => {
  console.log('New client connected!');

  // Send a welcome message to the new client
  client.send(JSON.stringify({ type: 'greeting', data: { message: `Hello ${socket.remoteAddress}!` }}));

  // Notify other clients that a new client has joined
  wss.clients.forEach((otherClient) => {
    if (otherClient !== client) {
      otherClient.send(JSON.stringify({ type: 'userConnected', data: { message: `${socket.remoteAddress} has joined!` }}));
    }
  });

  // When a message is received
  client.on('message', (message) => {
    console.log(`Received: ${message}`);

    // Echo the message back to the client
    client.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });

  // Handle client disconnect
  client.on('close', () => {
    console.log('Client disconnected');
    // Notify other clients that a client has left
    wss.clients.forEach((otherClient) => {
      if (otherClient !== client) {
        otherClient.send(JSON.stringify({ type: 'userDisconnected', data: { message: `${socket.remoteAddress} has left!` }}));
      }
    });
  });
});

console.log('\x1b[32mWebSocket server is running on\x1b[0m \x1b[34mws://localhost:8080\x1b[0m');
