import XTerm, { IBufferCell, IBufferLine, Terminal } from '@xterm/headless';
import { useContext, useEffect, useRef, useState } from 'react';
import nodePty, { IPty } from 'node-pty';
import { minitelContext, useKeyboard } from 'minitel-react';
import { hostname } from 'os';

export function Term({ user }: { user: string }) {
  const minitel = useContext(minitelContext);
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

    const pty = nodePty.spawn('su', [user], {
      name: 'xterm-mono',
      cols: 40,
      rows: 24,
      cwd: process.env.HOME,
      env: { ...process.env } as { [k: string]: string },
    });
    ptyRef.current = pty;
    pty.onData((v: string) => {
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
      const translation: Record<string, string> = {
        '\u0013G': '\x08',
        '\u0013A': '\n',
      };
      ptyCur.write(translation[v] || v);
    }
  });

  return (
    <zjoin>
      <para>
        {bufferChars.map((v) => v.map((v_) =>
          v_.getChars().length <= 1 && v_.getChars().charCodeAt(0) < 128
            ? v_.getChars() || '\x09'
            : '\x7f'
        ).join('')).join('\n')}
      </para>
      <xjoin fillChar={'\x09'} pad={[cursorPosition[0], 0, 0, cursorPosition[1]]}>
        <input width={1} autofocus visible={false} />
      </xjoin>
    </zjoin>
  );
}

export function App() {
  const [user, setUser] = useState('');
  const [step, setStep] = useState(0);

  useKeyboard((v) => {
    if (v === '\u0013A') {
      setStep(1);
    }
  });

  if (step === 1) return <Term user={user} />;
  return (
    <yjoin widthAlign='middle' heightAlign='middle' gap={1}>
      <para>
        Connecting to { hostname() }
      </para>
      <xjoin gap={1}>
        <para>
          Username:
        </para>
        <input autofocus onChange={setUser} />
      </xjoin>
      <para doubleHeight>
        <span invert> Envoi </span> Se connecter
      </para>
    </yjoin>
  );
}
