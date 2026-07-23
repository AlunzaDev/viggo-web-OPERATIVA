import net from "node:net";
import { spawn } from "node:child_process";

const preferredPort = Number(process.env.VITE_DEV_PORT ?? 3001);
const fallbackPort = Number(process.env.VITE_DEV_FALLBACK_PORT ?? 3004);

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });

const selectedPort = (await isPortFree(preferredPort))
  ? preferredPort
  : fallbackPort;

if (selectedPort !== preferredPort) {
  console.log(
    `[LOCALOPE WEB] Port ${preferredPort} is busy. Trying ${fallbackPort}.`,
  );
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(
  command,
  ["vite", "--mode", "dev", "--host", "0.0.0.0", "--port", String(selectedPort), "--strictPort"],
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
