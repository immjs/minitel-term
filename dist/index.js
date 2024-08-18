var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'minitel-react';
import { Minitel } from 'minitel-standalone';
import { WebSocketServer } from 'ws';
import { DuplexBridge } from 'ws-duplex-bridge';
import { App } from './app.js';
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => __awaiter(void 0, void 0, void 0, function* () {
    const bridge = new DuplexBridge(ws, { decodeStrings: false });
    const minitel = new Minitel(bridge, { localEcho: false });
    yield minitel.readyAsync();
    console.log(minitel.speed);
    minitel.queueCommand('\x1b\x3b\x61\x58\x53', '\x1b\x3b\x63');
    bridge.write('\x0c');
    const renderer = render((_jsx(App, {})), minitel);
}));
