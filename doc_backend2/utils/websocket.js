const setupWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    // Send initial data
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      data: { timestamp: new Date().toISOString() }
    }));

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
    });

    // Send periodic updates
    startPeriodicUpdates(ws);
  });
};

const handleWebSocketMessage = (ws, data) => {
  switch (data.type) {
    case 'SUBSCRIBE_PRICES':
      // Handle price subscription
      break;
    case 'SUBSCRIBE_BOT_STATUS':
      // Handle bot status subscription
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
};

const startPeriodicUpdates = (ws) => {
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'PRICE_UPDATE',
        data: {
          timestamp: new Date().toISOString(),
          prices: {
            'USDT/DAI': {
              raydium: Math.random() * 0.02 + 0.99,
              orca: Math.random() * 0.02 + 0.99,
              jupiter: Math.random() * 0.02 + 0.99
            }
          }
        }
      }));
    } else {
      clearInterval(interval);
    }
  }, 1000);

  ws.on('close', () => clearInterval(interval));
};

module.exports = { setupWebSocket }; 