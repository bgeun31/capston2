import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { WS_BASE } from "../utils/WsBase";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const SshTerminal = ({ deviceId }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

  const safeFit = () => {
    try {
      const fitAddon = fitAddonRef.current;
      if (
        fitAddon &&
        fitAddon._terminal?._core?._renderService?.dimensions // 조건 체크
      ) {
        fitAddon.fit();
      }
    } catch (e) {
      console.warn("fit() 오류 무시됨:", e.message);
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      fontSize: 14,
      cursorBlink: true,
      scrollback: 1000,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    terminalRef.current.innerHTML = "";
    term.open(terminalRef.current);

    // 렌더링 후 fit()
    setTimeout(() => {
      safeFit();
    }, 100);

    // WebSocket 연결
    const socket = new WebSocket(`${WS_BASE}/ws/terminal/${deviceId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      term.write("🟢 연결되었습니다.\r\n");
      setTimeout(() => {
        socket.send("enable\n");
        socket.send("terminal length 0\n");
      }, 200);
    };

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    socket.onclose = () => {
      term.write("\r\n🔴 연결 종료됨\r\n");
    };

    socket.onerror = (err) => {
      console.error("WebSocket 오류:", err);
      term.write("\r\n❌ WebSocket 오류 발생\r\n");
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      safeFit(); // 리사이즈 시도
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      socket.close();
      term.dispose();
      resizeObserver.disconnect();
    };
  }, [deviceId]);

  return (
    <div
      ref={terminalRef}
      style={{
        width: "100%",
        height: "500px",
        backgroundColor: "#1e1e1e",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
};

export default SshTerminal;
