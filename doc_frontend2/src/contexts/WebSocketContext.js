import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/websocket';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    WebSocketService.connect();
    
    WebSocketService.onConnect(() => setConnected(true));
    WebSocketService.onDisconnect(() => setConnected(false));
    WebSocketService.onMessage((message) => setLastMessage(message));

    return () => WebSocketService.disconnect();
  }, []);

  return (
    <WebSocketContext.Provider value={{ lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext); 