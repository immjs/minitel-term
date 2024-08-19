import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import XTerm from '@xterm/headless';
import { useEffect, useRef, useState } from 'react';
import defaultShell from 'default-shell';
import nodePty from 'node-pty';
import { useKeyboard } from 'minitel-react';
export function App() {
    const xtermRef = useRef();
    const ptyRef = useRef();
    const [bufferChars, setBufferChars] = useState([]);
    const [cursorPosition, setCursorPosition] = useState([0, 21]);
    function updateBufferChars() {
        const xtermCur = xtermRef.current;
        if (!xtermCur)
            throw new Error();
        const buffer = xtermCur.buffer.active;
        const bufferLines = [];
        for (let i = Math.max(0, buffer.length - 24); i < buffer.length; i += 1) {
            bufferLines.push(buffer.getLine(i));
        }
        setBufferChars(bufferLines.map((v) => {
            const lineChars = [];
            for (let i = 0; i < Math.min(40, v.length); i += 1) {
                lineChars.push(v.getCell(i));
            }
            return lineChars;
        }));
        setCursorPosition([xtermCur.buffer.active.cursorY, xtermCur.buffer.active.cursorX]);
    }
    useEffect(() => {
        const xterm = new XTerm.Terminal({
            allowProposedApi: true,
            cols: 40,
            rows: 24,
            cursorBlink: false,
            scrollback: 24,
        });
        xtermRef.current = xterm;
        const pty = nodePty.spawn(defaultShell, [], {
            name: 'xterm-mono',
            cols: 40,
            rows: 24,
            cwd: process.env.HOME,
            env: Object.assign({}, process.env),
        });
        ptyRef.current = pty;
        pty.onData((v) => {
            xterm.write(v, updateBufferChars);
        });
        return () => {
            xterm.dispose();
            pty.kill();
        };
    }, []);
    useKeyboard((v) => {
        const ptyCur = ptyRef.current;
        if (ptyCur) {
            const translation = {
                '\u0013G': '\x08',
            };
            ptyCur.write(translation[v] || v);
        }
    });
    return (_jsxs("zjoin", { children: [_jsx("para", { children: bufferChars.map((v) => v.map((v_) => v_.getChars() || '\x09').join('')).join('\n') }), _jsx("xjoin", { fillChar: '\x09', pad: [cursorPosition[0], 0, 0, cursorPosition[1]], children: _jsx("input", { width: 1, autofocus: true, visible: false }) })] }));
}
