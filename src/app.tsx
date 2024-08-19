import XTerm, { IBufferCell, IBufferLine, Terminal } from '@xterm/headless';
import { useEffect, useRef, useState } from 'react';
import defaultShell from 'default-shell';
import nodePty, { IPty } from 'node-pty-prebuilt-multiarch';
import { useKeyboard } from 'minitel-react';

export function App() {
  const xtermRef = useRef<Terminal>();
  const ptyRef = useRef<IPty>();
  const [bufferChars, setBufferChars] = useState<IBufferCell[][]>([]);
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([0, 21]);

  function updateBufferChars() {
    const xtermCur = xtermRef.current;
    if (!xtermCur) throw new Error();

    const buffer = xtermCur.buffer.active;

    const bufferLines: IBufferLine[] = [];
    for (let i = Math.max(0, buffer.length - 24); i < buffer.length; i += 1) {
      bufferLines.push(buffer.getLine(i)!);
    }

    setBufferChars(
      bufferLines.map((v) => {
        const lineChars: IBufferCell[] = [];
        for (let i = 0; i < Math.min(40, v.length); i += 1) {
          lineChars.push(v.getCell(i)!);
        }
        return lineChars;
      }),
    );

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

    ptyRef.current = nodePty.spawn(defaultShell, [], {
      name: 'xterm-mono',
      cols: 40,
      rows: 24,
      cwd: process.env.HOME,
      env: { ...process.env } as { [k: string]: string },
    });
    ptyRef.current.onData((v) => {
      xterm.write(v, updateBufferChars);
    });

    return () => xterm.dispose();
  }, []);

  useKeyboard((v) => {
    const ptyCur = ptyRef.current;
    if (ptyCur) {
      const translation: Record<string, string> = {
        '\u0013G': '\x08',
      };
      console.log(v);
      ptyCur.write(translation[v] || v);
    }
  })

  // bufferChars.map((v) => v.map((v_) => {
  //   // console.log(JSON.stringify(v_.getChars()));
  //   return v_.getChars();
  // }).join('')).join('\n');
  // console.log(cursorPosition);

  return (
    <zjoin>
      <para>
        {bufferChars.map((v) => v.map((v_) => v_.getChars() || '\x09').join('')).join('\n')}
      </para>
      <xjoin fillChar={'\x09'} pad={[cursorPosition[0], 0, 0, cursorPosition[1]]}>
        <input width={1} autofocus visible={false} />
      </xjoin>
    </zjoin>
  );
}
