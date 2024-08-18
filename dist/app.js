import { jsx as _jsx } from "react/jsx-runtime";
import XTerm from '@xterm/headless';
import { useEffect, useRef, useState } from 'react';
import defaultShell from 'default-shell';
import nodePty from 'node-pty';
import { useKeyboard } from 'minitel-react';
export function App() {
    const xtermRef = useRef();
    const ptyRef = useRef();
    const [bufferChars, setBufferChars] = useState([]);
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
            for (let i = 0; i < v.length; i += 1) {
                lineChars.push(v.getCell(i));
            }
            return lineChars;
        }));
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
        ptyRef.current = nodePty.spawn(defaultShell, [], {
            name: 'xterm-mono',
            cols: 40,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
        });
        ptyRef.current.onData((v) => {
            xterm.write(v, updateBufferChars);
        });
        return () => xterm.dispose();
    }, []);
    useKeyboard((v) => {
        const ptyCur = ptyRef.current;
        if (ptyCur) {
            const translation = {
                '\u0013G': '\x08',
            };
            console.log(v);
            ptyCur.write(translation[v] || v);
        }
    });
    // console.log({
    //   a: bufferChars.map((v) => v.map((v_) => {
    //     console.log(v_.getChars() || '\x09');
    //     return v_.getChars();
    //   }).join('')).join('\n'),
    // });
    return (_jsx("para", { children: bufferChars.map((v) => v.map((v_) => v_.getChars() || ' ').join('')).join('\n') }));
}
