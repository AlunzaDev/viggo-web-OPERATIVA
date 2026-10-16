import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const loadEnvFile = (fileName) => {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
};

const envName = process.env.SMOKE_ENV_FILE ?? ".env.prod";
const fileEnv = loadEnvFile(envName);
const env = { ...fileEnv, ...process.env };
const baseUrl = (
  env.REAL_BACKEND_URL ??
  env.VITE_API_URL ??
  env.VITE_PROD_API_URL ??
  env.VITE_DEV_API_URL ??
  ""
).replace(/\/+$/, "");

const adminEmail = env.REAL_BACKEND_ADMIN_EMAIL;
const adminPassword = env.REAL_BACKEND_ADMIN_PASSWORD;
const writeEnabled = env.REAL_BACKEND_WRITE === "1";
const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const required = (value, label) => {
  if (!value) throw new Error(`${label} es requerido`);
  return value;
};

const idOf = (item) => item?.id ?? item?.uid ?? item?._id;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : typeof body?.message === "string"
          ? body.message
          : response.statusText;
    throw new Error(`${options.method ?? "GET"} ${path} -> ${response.status}: ${message}`);
  }

  return body;
};

const step = async (name, action) => {
  const started = Date.now();
  try {
    const result = await action();
    console.log(`OK   ${name} (${Date.now() - started}ms)`);
    return result;
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    throw error;
  }
};

const listCount = (body, key) => {
  const value = body?.[key] ?? body?.items ?? body;
  if (!Array.isArray(value)) throw new Error(`La respuesta no contiene la lista ${key}`);
  return value.length;
};

const create = (path, token, body) =>
  request(path, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });

const patch = (path, token, body) =>
  request(path, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });

const main = async () => {
  required(baseUrl, "REAL_BACKEND_URL o VITE_*_API_URL");

  console.log(`Backend: ${baseUrl}`);
  console.log(`Env file: ${envName}`);
  console.log(`Writes: ${writeEnabled ? "enabled" : "disabled"}`);

  await step("ping", () => request("/api/ping"));
  await step("health", () => request("/api/health"));


  required(adminEmail, "REAL_BACKEND_ADMIN_EMAIL");
  required(adminPassword, "REAL_BACKEND_ADMIN_PASSWORD");
  let token = null;
  if (adminEmail && adminPassword) {
    const login = await step("login admin", () =>
      request("/api/auth/login-correo", {
        method: "POST",
        body: JSON.stringify({ correo: adminEmail, password: adminPassword, app: "OPERATIVE_WEB" }),
      }),
    );
    token = String(required(login.token, "token de login"));

    await step("read-only pagos", async () => listCount(await request("/api/payments/history", { token }), "items"));
  } else {
    console.log("SKIP login admin y pagos: faltan REAL_BACKEND_ADMIN_EMAIL/REAL_BACKEND_ADMIN_PASSWORD");
  }

  await step("ver proyectos", async () => listCount(await request("/api/proyectos", { token }), "proyectos"));
  await step("ver modulos", async () => listCount(await request("/api/modulos", { token }), "modulos"));
  await step("ver pensiones", async () => listCount(await request("/api/pensiones", { token }), "pensiones"));
  await step("ver pension pass", async () => listCount(await request("/api/pension-pass", { token }), "pensionPasses"));
  await step("read-only tickets", async () => listCount(await request("/api/tickets", { token }), "tickets"));
  await step("read-only movimientos", async () => listCount(await request("/api/pension-moves", { token }), "pensionMoves"));


  if (!writeEnabled) {
    console.log("SKIP crear/editar: define REAL_BACKEND_WRITE=1 para ejecutar escrituras reales.");
    return;
  }

  throw new Error("OPERATIVO tiene catalogos de solo lectura. Usa el smoke-postgres-clients de ADMINISTRATIVO para probar tickets, caja y desconexion.");

};

main().catch((error) => {
  console.error(`Smoke abortado: ${error.message}`);
  process.exitCode = 1;
});
