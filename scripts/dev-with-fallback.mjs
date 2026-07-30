import net from "node:net";
import { spawn } from "node:child_process";

process.stdout.write("\x1Bc");

const preferredPort = Number(process.env.VITE_DEV_PORT ?? 3001);
const fallbackPort = Number(process.env.VITE_DEV_FALLBACK_PORT ?? 3003);
const probeHosts = ["127.0.0.1", "::1"];

const canConnectToPort = (host, port) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(250);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });

const isPortBusy = async (port) => {
  for (const host of probeHosts) {
    if (await canConnectToPort(host, port)) {
      return true;
    }
  }

  return false;
};

const selectedPort = (await isPortBusy(preferredPort))
  ? fallbackPort
  : preferredPort;

if (selectedPort !== preferredPort) {
  console.log(
    `[OPERATIVO WEB] Port ${preferredPort} is busy. Trying ${fallbackPort}.`,
  );
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(
  command,
  [
    "vite",
    "--mode",
    "dev",
    "--host",
    "0.0.0.0",
    "--port",
    String(selectedPort),
    "--strictPort",
  ],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
