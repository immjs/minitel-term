import { render } from 'minitel-react';
import { Minitel } from 'minitel-standalone';
import { WebSocketServer } from 'ws';
import { DuplexBridge } from 'ws-duplex-bridge';
import { App } from './app.js';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', async (ws) => {
  const bridge = new DuplexBridge(ws, { decodeStrings: false });
  
  const minitel = new Minitel(bridge, { localEcho: false });

  await minitel.readyAsync();
  console.log(minitel.speed);
  
  minitel.queueCommand('\x1b\x3b\x61\x58\x53', '\x1b\x3b\x63');
  bridge.write('\x0c');

  const renderer = render((
    <App />
  ), minitel);
});
