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
  return Array.isArray(value) ? value.length : "ok";
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

  await step("ver proyectos", async () => listCount(await request("/api/proyectos"), "proyectos"));
  await step("ver modulos", async () => listCount(await request("/api/modulos"), "modulos"));
  await step("ver pensiones", async () => listCount(await request("/api/pensiones"), "pensiones"));
  await step("ver pension pass", async () => listCount(await request("/api/pension-pass"), "pensionPasses"));
  await step("read-only tickets", async () => listCount(await request("/api/tickets"), "tickets"));
  await step("read-only movimientos", async () => listCount(await request("/api/pension-moves"), "pensionMoves"));

  let token = null;
  if (adminEmail && adminPassword) {
    const login = await step("login admin", () =>
      request("/api/auth/login-correo", {
        method: "POST",
        body: JSON.stringify({ correo: adminEmail, password: adminPassword }),
      }),
    );
    token = String(login.token);

    await step("read-only pagos", async () => listCount(await request("/api/payments/history", { token }), "items"));
  } else {
    console.log("SKIP login admin y pagos: faltan REAL_BACKEND_ADMIN_EMAIL/REAL_BACKEND_ADMIN_PASSWORD");
  }

  if (!writeEnabled) {
    console.log("SKIP crear/editar: define REAL_BACKEND_WRITE=1 para ejecutar escrituras reales.");
    return;
  }

  required(token, "token admin");

  const usuarioBody = {
    nombre: `Smoke ${runId}`,
    apellido: "Backend",
    correo: `smoke.${runId}@example.test`,
    telefono: `55${runId.slice(-8)}`,
    password: "SmokeTest1",
    rol: "CLIENT_ROLE",
    emailValidated: true,
    estado: true,
  };

  const usuario = await step("crear acceso", async () => {
    const body = await create("/api/usuarios", token, usuarioBody);
    return body.usuario ?? body;
  });
  const usuarioId = required(idOf(usuario), "id de acceso creado");

  await step("editar acceso", () =>
    patch(`/api/usuarios/${usuarioId}`, token, { apellido: "Backend Editado" }),
  );
  await step("ver acceso", () => request(`/api/usuarios/${usuarioId}`, { token }));

  const proyecto = await step("crear proyecto", async () => {
    const body = await create("/api/proyectos", token, {
      nombre: `Smoke Proyecto ${runId}`,
      coordinates: [-99.1332, 19.4326],
      ciudad: "CDMX",
      identificador: `SMOKE-PROY-${runId}`,
      descripcion: "Prueba automatizada contra backend real",
      estado: true,
    });
    return body.proyecto ?? body;
  });
  const proyectoId = required(idOf(proyecto), "id de proyecto creado");

  await step("editar proyecto", () =>
    patch(`/api/proyectos/${proyectoId}`, token, { descripcion: "Prueba editada" }),
  );
  await step("ver proyecto", () => request(`/api/proyectos/${proyectoId}`));

  const modulo = await step("crear modulo", async () => {
    const body = await create("/api/modulos", token, {
      nombre: `Smoke Modulo ${runId}`,
      proyecto: proyectoId,
      tipo: "ENTRADA",
      identificador: `SMOKE-MOD-${runId}`,
      descripcion: "Prueba automatizada contra backend real",
      estado: true,
    });
    return body.modulo ?? body;
  });
  const moduloId = required(idOf(modulo), "id de modulo creado");

  await step("editar modulo", () =>
    patch(`/api/modulos/${moduloId}`, token, { descripcion: "Prueba editada" }),
  );
  await step("ver modulo", () => request(`/api/modulos/${moduloId}`));

  const pension = await step("crear pension", async () => {
    const body = await create("/api/pensiones", token, {
      proyecto: proyectoId,
      nombre: `Smoke Pension ${runId}`,
      validez: Array.from({ length: 7 }, (_, weekDay) => ({
        weekDay,
        from: [0, 0],
        to: [23, 59],
      })),
      precio: 100,
      descripcion: "Prueba automatizada contra backend real",
      estado: true,
    });
    return body.pension ?? body;
  });
  const pensionId = required(idOf(pension), "id de pension creada");

  await step("editar pension", () =>
    patch(`/api/pensiones/${pensionId}`, token, { precio: 101 }),
  );
  await step("ver pension", () => request(`/api/pensiones/${pensionId}`));

  const now = Date.now();
  const pensionPass = await step("crear pension pass", async () => {
    const body = await create("/api/pension-pass", token, {
      name: `Smoke Pass ${runId}`,
      pension: pensionId,
      usuario: usuarioId,
      idPass: `SMOKE-PASS-${runId}`,
      vigent: true,
      antiPassback: true,
      inParking: false,
      created: now,
      from: now,
      to: now + 30 * 24 * 60 * 60 * 1000,
      estado: true,
    });
    return body.pensionPass ?? body;
  });
  const pensionPassId = required(idOf(pensionPass), "id de pension pass creado");

  await step("editar pension pass", () =>
    patch(`/api/pension-pass/${pensionPassId}`, token, { name: `Smoke Pass Edit ${runId}` }),
  );
  await step("ver pension pass", () => request(`/api/pension-pass/${pensionPassId}`));

  console.log("Smoke contra backend configurado terminado.");
};

main().catch((error) => {
  console.error(`Smoke abortado: ${error.message}`);
  process.exitCode = 1;
});
