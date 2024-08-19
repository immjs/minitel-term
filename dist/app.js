import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import XTerm from '@xterm/headless';
import { useContext, useEffect, useRef, useState } from 'react';
import nodePty from 'node-pty';
import { minitelContext, useKeyboard } from 'minitel-react';
import { hostname } from 'os';
export function Term({ user }) {
    const minitel = useContext(minitelContext);
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
        const pty = nodePty.spawn('su', [user], {
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
        pty.onExit(() => minitel.stream.end());
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
                '\u0013A': '\n',
            };
            ptyCur.write(translation[v] || v);
        }
    });
    return (_jsxs("zjoin", { children: [_jsx("para", { children: bufferChars.map((v) => v.map((v_) => {
                    const chars = v_.getChars();
                    if (chars.length < 1)
                        return '\x09';
                    if (chars.length > 1 || chars.charCodeAt(0) >= 128)
                        return '\x7f';
                    return chars;
                }).join('')).join('\n') }), _jsx("xjoin", { fillChar: '\x09', pad: [cursorPosition[0], 0, 0, cursorPosition[1]], children: _jsx("input", { width: 1, autofocus: true, visible: false }) })] }));
}
export function App() {
    const [user, setUser] = useState('');
    const [step, setStep] = useState(0);
    useKeyboard((v) => {
        if (v === '\u0013A') {
            setStep(1);
        }
    });
    if (step === 1)
        return _jsx(Term, { user: user });
    return (_jsxs("yjoin", { widthAlign: 'middle', heightAlign: 'middle', gap: 1, children: [_jsxs("para", { children: ["Connecting to ", hostname()] }), _jsxs("xjoin", { gap: 1, children: [_jsx("para", { children: "Username:" }), _jsx("input", { autofocus: true, onChange: setUser })] }), _jsxs("para", { doubleHeight: true, children: [_jsx("span", { invert: true, children: " Envoi " }), " Se connecter"] })] }));
}
