import { useCallback, useEffect, useRef, useState } from "react";
import { FiLogIn } from "react-icons/fi";
import "../../styles/auth/BarrierBlasterGame.css";

const LANE_COUNT = 3;

export type GameMode = "preview" | "play";

interface BarrierBlasterGameProps {
  mode: GameMode;
  onReturnToLogin: () => void;
  initialHighScore?: number;
  onGameOver?: (summary: BarrierBlasterGameSummary) => void;
}

export interface BarrierBlasterGameSummary {
  score: number;
  missed: number;
  bestStreak: number;
  highScore: number;
  reason: "hazard" | null;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

type HazardType = "bollard" | "cone" | "duck" | "sign";

interface Barrier {
  id: number;
  kind: "barrier" | "hazard";
  hazardType?: HazardType;
  x: number;
  lane: number;
  width: number;
  height: number;
  color: string;
  speedFactor: number;
}

interface RoadMetrics {
  left: number;
  top: number;
  width: number;
  height: number;
  laneHeight: number;
  laneCenters: number[];
}

interface PlayerState {
  x: number;
  targetLane: number;
  y: number;
  hitFlash: number;
}

interface RuntimeState {
  width: number;
  height: number;
  road: RoadMetrics;
  player: PlayerState;
  barriers: Barrier[];
  particles: Particle[];
  spawnAccumulator: number;
  stripeOffset: number;
  shakeTime: number;
  shakePower: number;
  startMs: number;
  previousFrameMs: number;
  running: boolean;
  barrierSerial: number;
  autopilotTimer: number;
}

interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const crashPalette = ["#b45309", "#f59e0b", "#e11d48", "#a8a29e", "#78716c", "#ef4444"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, factor: number) => from + (to - from) * factor;

function resolveColor(variableName: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return color || fallback;
}

function createRoadMetrics(width: number, height: number): RoadMetrics {
  const left = width * 0.06;
  const top = height * 0.19;
  const roadWidth = width * 0.88;
  const roadHeight = clamp(height * 0.62, 210, height * 0.72);
  const laneHeight = roadHeight / LANE_COUNT;

  const laneCenters = Array.from({ length: LANE_COUNT }, (_, lane) => top + laneHeight * (lane + 0.5));

  return {
    left,
    top,
    width: roadWidth,
    height: roadHeight,
    laneHeight,
    laneCenters,
  };
}

function createRuntime(width: number, height: number): RuntimeState {
  const road = createRoadMetrics(width, height);
  const initialLane = 1;

  return {
    width,
    height,
    road,
    player: {
      x: road.left + road.width * 0.18,
      targetLane: initialLane,
      y: road.laneCenters[initialLane] ?? road.top + road.height * 0.5,
      hitFlash: 0,
    },
    barriers: [],
    particles: [],
    spawnAccumulator: 0,
    stripeOffset: 0,
    shakeTime: 0,
    shakePower: 0,
    startMs: 0,
    previousFrameMs: 0,
    running: true,
    barrierSerial: 0,
    autopilotTimer: 0,
  };
}

function getCarBounds(runtime: RuntimeState): RectBounds {
  const carWidth = clamp(runtime.road.laneHeight * 0.92, 42, 74);
  const carHeight = clamp(runtime.road.laneHeight * 0.56, 24, 42);

  return {
    x: runtime.player.x - carWidth * 0.52,
    y: runtime.player.y - carHeight * 0.5,
    width: carWidth,
    height: carHeight,
  };
}

function getBarrierBounds(runtime: RuntimeState, barrier: Barrier): RectBounds {
  const laneCenter = runtime.road.laneCenters[barrier.lane] ?? runtime.road.top + runtime.road.height * 0.5;

  return {
    x: barrier.x,
    y: laneCenter - barrier.height * 0.5,
    width: barrier.width,
    height: barrier.height,
  };
}

function intersects(a: RectBounds, b: RectBounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedSeconds: number
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#d7dbe2");
  gradient.addColorStop(1, "#bcc3cc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, height * 0.12, width, 6);
  ctx.fillRect(0, height * 0.88, width, 6);

  const shadowOffset = Math.sin(elapsedSeconds * 0.8) * 6;
  ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
  ctx.beginPath();
  ctx.ellipse(width * 0.76, height * 0.18 + shadowOffset, width * 0.2, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.2;
  for (let x = -40; x < width + 40; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 30, height);
    ctx.stroke();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, runtime: RuntimeState) {
  const { road } = runtime;

  const roadGradient = ctx.createLinearGradient(road.left, road.top, road.left + road.width, road.top);
  roadGradient.addColorStop(0, "#4b5563");
  roadGradient.addColorStop(1, "#374151");

  ctx.fillStyle = roadGradient;
  ctx.fillRect(road.left, road.top, road.width, road.height);

  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.strokeRect(road.left, road.top, road.width, road.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(road.left + 12, road.top + 10, road.width - 24, road.height - 20);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 2;

  for (let lane = 1; lane < LANE_COUNT; lane += 1) {
    const y = road.top + road.laneHeight * lane;

    for (
      let dashX = road.left + (runtime.stripeOffset % 56) - 56;
      dashX < road.left + road.width + 44;
      dashX += 56
    ) {
      ctx.beginPath();
      ctx.moveTo(dashX, y);
      ctx.lineTo(dashX + 28, y);
      ctx.stroke();
    }
  }
}

function drawBarrier(ctx: CanvasRenderingContext2D, runtime: RuntimeState, barrier: Barrier) {
  const bounds = getBarrierBounds(runtime, barrier);
  if (barrier.kind === "hazard") {
    const hazardType = barrier.hazardType ?? "bollard";
    if (hazardType === "cone") {
      const baseWidth = clamp(bounds.width * 0.86, 22, 34);
      const baseHeight = clamp(bounds.height * 0.28, 8, 12);
      const coneWidth = clamp(bounds.width * 0.62, 16, 24);
      const coneHeight = clamp(bounds.height * 0.74, 20, 30);
      const baseX = bounds.x + (bounds.width - baseWidth) * 0.5;
      const baseY = bounds.y + bounds.height - baseHeight;
      const coneX = bounds.x + (bounds.width - coneWidth) * 0.5;
      const coneY = baseY - coneHeight + 2;

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(baseX - 2, baseY + baseHeight - 2, baseWidth + 4, 3);

      const coneGradient = ctx.createLinearGradient(coneX, coneY, coneX + coneWidth, coneY);
      coneGradient.addColorStop(0, "#f97316");
      coneGradient.addColorStop(1, "#ea580c");
      ctx.fillStyle = coneGradient;
      ctx.beginPath();
      ctx.moveTo(coneX + coneWidth * 0.5, coneY);
      ctx.lineTo(coneX + coneWidth, coneY + coneHeight);
      ctx.lineTo(coneX, coneY + coneHeight);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(coneX + coneWidth * 0.2, coneY + coneHeight * 0.46, coneWidth * 0.6, 3);
      ctx.fillRect(coneX + coneWidth * 0.26, coneY + coneHeight * 0.64, coneWidth * 0.48, 3);

      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(baseX, baseY, baseWidth, baseHeight);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(baseX, baseY, baseWidth, baseHeight);
      return;
    }

    if (hazardType === "duck") {
      const bodyWidth = clamp(bounds.width * 0.72, 18, 28);
      const bodyHeight = clamp(bounds.height * 0.46, 14, 20);
      const bodyX = bounds.x + bounds.width * 0.48 - bodyWidth * 0.5;
      const bodyY = bounds.y + bounds.height * 0.54 - bodyHeight * 0.5;
      const headRadius = clamp(bodyHeight * 0.38, 4, 7);
      const headX = bodyX + bodyWidth * 0.74;
      const headY = bodyY - headRadius * 0.25;

      ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
      ctx.beginPath();
      ctx.ellipse(
        bounds.x + bounds.width * 0.5,
        bounds.y + bounds.height * 0.86,
        bodyWidth * 0.45,
        bodyHeight * 0.28,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(
        bodyX + bodyWidth * 0.5,
        bodyY + bodyHeight * 0.5,
        bodyWidth * 0.5,
        bodyHeight * 0.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.moveTo(headX + headRadius * 0.9, headY + headRadius * 0.15);
      ctx.lineTo(headX + headRadius * 1.8, headY + headRadius * 0.4);
      ctx.lineTo(headX + headRadius * 0.9, headY + headRadius * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(headX + headRadius * 0.18, headY - headRadius * 0.18, 1.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (hazardType === "sign") {
      const postWidth = clamp(bounds.width * 0.16, 4, 7);
      const postHeight = clamp(bounds.height * 0.78, 20, 34);
      const postX = bounds.x + bounds.width * 0.5 - postWidth * 0.5;
      const postY = bounds.y + bounds.height * 0.18;
      const panelSize = clamp(bounds.height * 0.38, 12, 18);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(postX - 2, postY + postHeight - 2, postWidth + 4, 3);

      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(postX, postY, postWidth, postHeight);

      ctx.save();
      ctx.translate(bounds.x + bounds.width * 0.5, postY + panelSize * 0.62);
      ctx.rotate(Math.PI * 0.25);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-panelSize * 0.5, -panelSize * 0.5, panelSize, panelSize);
      ctx.fillStyle = "#fef2f2";
      ctx.fillRect(-panelSize * 0.36, -panelSize * 0.36, panelSize * 0.72, panelSize * 0.72);
      ctx.restore();

      ctx.strokeStyle = "rgba(15, 23, 42, 0.58)";
      ctx.lineWidth = 1;
      ctx.strokeRect(postX, postY, postWidth, postHeight);
      return;
    }

    const baseWidth = clamp(bounds.width * 0.9, 20, 30);
    const baseHeight = clamp(bounds.height * 0.32, 10, 14);
    const bodyWidth = clamp(bounds.width * 0.62, 16, 22);
    const bodyHeight = clamp(bounds.height * 0.72, 20, 30);
    const baseX = bounds.x + (bounds.width - baseWidth) * 0.5;
    const baseY = bounds.y + bounds.height - baseHeight;
    const bodyX = bounds.x + (bounds.width - bodyWidth) * 0.5;
    const bodyY = baseY - bodyHeight + 2;

    ctx.fillStyle = "#111827";
    ctx.fillRect(baseX - 3, baseY + baseHeight - 2, baseWidth + 6, 3);

    const bodyGradient = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyWidth, bodyY);
    bodyGradient.addColorStop(0, "#facc15");
    bodyGradient.addColorStop(1, "#eab308");
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

    ctx.fillStyle = "rgba(31, 41, 55, 0.9)";
    for (let stripe = -4; stripe < bodyHeight + 8; stripe += 10) {
      ctx.save();
      ctx.translate(bodyX - 2, bodyY + stripe);
      ctx.rotate(-0.8);
      ctx.fillRect(0, 0, bodyWidth + 4, 4);
      ctx.restore();
    }

    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(baseX, baseY, baseWidth, baseHeight);
    ctx.strokeStyle = "rgba(17, 24, 39, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bodyX, bodyY, bodyWidth, bodyHeight);
    ctx.strokeRect(baseX, baseY, baseWidth, baseHeight);
    return;
  }

  const armHeight = clamp(bounds.height * 0.42, 10, 14);
  const armY = bounds.y + bounds.height * 0.5 - armHeight * 0.5;
  const postWidth = clamp(bounds.width * 0.2, 10, 16);
  const postHeight = bounds.height + 12;
  const postX = bounds.x + 2;
  const postY = bounds.y + bounds.height * 0.5 - postHeight * 0.5;
  const armX = postX + postWidth - 1;
  const armWidth = Math.max(22, bounds.width - postWidth);

  ctx.fillStyle = "#111827";
  ctx.fillRect(postX - 3, postY + postHeight - 4, postWidth + 6, 4);

  const postGradient = ctx.createLinearGradient(postX, postY, postX + postWidth, postY);
  postGradient.addColorStop(0, "#e5e7eb");
  postGradient.addColorStop(1, "#9ca3af");
  ctx.fillStyle = postGradient;
  ctx.fillRect(postX, postY, postWidth, postHeight);

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(postX + postWidth * 0.52, postY + postHeight * 0.2, 2.8, 0, Math.PI * 2);
  ctx.fill();

  const armGradient = ctx.createLinearGradient(armX, armY, armX + armWidth, armY);
  armGradient.addColorStop(0, "#ffffff");
  armGradient.addColorStop(1, "#e5e7eb");
  ctx.fillStyle = armGradient;
  ctx.fillRect(armX, armY, armWidth, armHeight);

  ctx.fillStyle = barrier.color;
  for (let stripe = 0; stripe < armWidth; stripe += 18) {
    ctx.save();
    ctx.translate(armX + stripe, armY);
    ctx.rotate(-0.72);
    ctx.fillRect(0, 0, 6, armHeight * 1.7);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(17, 24, 39, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(armX, armY, armWidth, armHeight);
  ctx.strokeRect(postX, postY, postWidth, postHeight);
}

function drawCar(ctx: CanvasRenderingContext2D, runtime: RuntimeState) {
  const { player } = runtime;
  const car = getCarBounds(runtime);

  const wheelRadius = clamp(car.height * 0.2, 4, 7);
  const bodyTop = car.y + car.height * 0.28;
  const bodyBottom = car.y + car.height * 0.84;
  const roofTop = car.y + car.height * 0.08;
  const roofBottom = car.y + car.height * 0.42;

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(
    car.x + car.width * 0.5,
    car.y + car.height * 0.88,
    car.width * 0.5,
    car.height * 0.2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(car.x, bodyTop, car.x, bodyBottom);
  bodyGradient.addColorStop(0, "#e5e7eb");
  bodyGradient.addColorStop(1, "#9ca3af");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(car.x + car.width * 0.04, bodyTop);
  ctx.lineTo(car.x + car.width * 0.9, bodyTop);
  ctx.quadraticCurveTo(car.x + car.width * 0.98, bodyTop + 2, car.x + car.width * 0.98, bodyTop + car.height * 0.2);
  ctx.lineTo(car.x + car.width * 0.98, bodyBottom);
  ctx.lineTo(car.x + car.width * 0.04, bodyBottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d1d5db";
  ctx.beginPath();
  ctx.moveTo(car.x + car.width * 0.22, roofBottom);
  ctx.lineTo(car.x + car.width * 0.4, roofTop);
  ctx.lineTo(car.x + car.width * 0.68, roofTop);
  ctx.lineTo(car.x + car.width * 0.82, roofBottom);
  ctx.lineTo(car.x + car.width * 0.22, roofBottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(55, 65, 81, 0.86)";
  ctx.beginPath();
  ctx.moveTo(car.x + car.width * 0.26, roofBottom - 1);
  ctx.lineTo(car.x + car.width * 0.42, roofTop + 2);
  ctx.lineTo(car.x + car.width * 0.64, roofTop + 2);
  ctx.lineTo(car.x + car.width * 0.78, roofBottom - 1);
  ctx.lineTo(car.x + car.width * 0.26, roofBottom - 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(55, 65, 81, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(car.x + car.width * 0.55, roofTop + 1);
  ctx.lineTo(car.x + car.width * 0.55, roofBottom - 1);
  ctx.stroke();

  ctx.fillStyle = "#dc2626";
  ctx.fillRect(car.x - 6, car.y + car.height * 0.38, 6, car.height * 0.1);
  ctx.fillRect(car.x - 6, car.y + car.height * 0.66, 6, car.height * 0.1);

  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(car.x + car.width * 0.98, car.y + car.height * 0.36, 5, car.height * 0.12);
  ctx.fillRect(car.x + car.width * 0.98, car.y + car.height * 0.63, 5, car.height * 0.12);

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(car.x + car.width * 0.22, bodyBottom + wheelRadius * 0.12, wheelRadius, 0, Math.PI * 2);
  ctx.arc(car.x + car.width * 0.78, bodyBottom + wheelRadius * 0.12, wheelRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9ca3af";
  ctx.beginPath();
  ctx.arc(car.x + car.width * 0.22, bodyBottom + wheelRadius * 0.12, wheelRadius * 0.42, 0, Math.PI * 2);
  ctx.arc(car.x + car.width * 0.78, bodyBottom + wheelRadius * 0.12, wheelRadius * 0.42, 0, Math.PI * 2);
  ctx.fill();

  if (player.hitFlash > 0) {
    ctx.globalAlpha = clamp(player.hitFlash / 0.18, 0, 1) * 0.8;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(car.x - 6, car.y - 4, car.width + 12, car.height + 8);
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

export function BarrierBlasterGame({
  mode,
  onReturnToLogin,
  initialHighScore,
  onGameOver,
}: BarrierBlasterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const runtimeRef = useRef<RuntimeState | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modeRef = useRef<GameMode>(mode);
  const isGameOverRef = useRef(false);
  const gameOverReportedRef = useRef(false);

  const pointerMoveLaneRef = useRef<(clientY: number) => void>(() => {});
  const laneMoveRef = useRef<(delta: number) => void>(() => {});

  const scoreRef = useRef(0);
  const missedRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);

  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"hazard" | null>(null);
  const [roundSeed, setRoundSeed] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof initialHighScore === "number" && Number.isFinite(initialHighScore)) {
      return Math.max(0, Math.floor(initialHighScore));
    }
    return 0;
  });
  const highScoreRef = useRef(highScore);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    if (typeof initialHighScore !== "number" || !Number.isFinite(initialHighScore)) {
      return;
    }
    const normalizedHighScore = Math.max(0, Math.floor(initialHighScore));
    highScoreRef.current = normalizedHighScore;
    setHighScore(normalizedHighScore);
  }, [initialHighScore]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    if (!isGameOver || mode !== "play" || !onGameOver) {
      return;
    }

    if (gameOverReportedRef.current) {
      return;
    }

    gameOverReportedRef.current = true;
    onGameOver({
      score,
      missed,
      bestStreak,
      highScore,
      reason: gameOverReason,
    });
  }, [bestStreak, gameOverReason, highScore, isGameOver, missed, mode, onGameOver, score]);

  const updateHighScore = useCallback((candidate: number) => {
    if (candidate <= highScoreRef.current) {
      return;
    }

    highScoreRef.current = candidate;
    setHighScore(candidate);
  }, []);

  const restartRound = useCallback(() => {
    gameOverReportedRef.current = false;
    scoreRef.current = 0;
    missedRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    setScore(0);
    setMissed(0);
    setBestStreak(0);
    setIsGameOver(false);
    setGameOverReason(null);
    setRoundSeed((value) => value + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) {
      return;
    }

    let disposed = false;
    const dangerColor = resolveColor("--error-color", "#e53e3e");

    const crashAt = (x: number, y: number, baseColor: string) => {
      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }

      for (let index = 0; index < 24; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 110 + Math.random() * 190;
        const color =
          crashPalette[Math.floor(Math.random() * crashPalette.length)] ?? baseColor;

        runtime.particles.push({
          x,
          y,
          size: 2 + Math.random() * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 10,
          life: 0.26 + Math.random() * 0.34,
          maxLife: 0.26 + Math.random() * 0.34,
          color,
        });
      }

      runtime.shakeTime = 0.09;
      runtime.shakePower = Math.min(7, runtime.shakePower + 2);
      runtime.player.hitFlash = 0.18;
    };

    const registerHit = (x: number, y: number, color: string) => {
      crashAt(x, y, color);

      if (modeRef.current !== "play") {
        return;
      }

      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
      updateHighScore(nextScore);

      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;

      if (nextStreak > bestStreakRef.current) {
        bestStreakRef.current = nextStreak;
        setBestStreak(nextStreak);
      }
    };

    const registerMiss = () => {
      if (modeRef.current !== "play") {
        return;
      }

      streakRef.current = 0;
      const nextMissed = missedRef.current + 1;
      missedRef.current = nextMissed;
      setMissed(nextMissed);
    };

    laneMoveRef.current = (delta: number) => {
      const runtime = runtimeRef.current;
      if (!runtime || !runtime.running || modeRef.current !== "play" || isGameOverRef.current) {
        return;
      }

      runtime.player.targetLane = clamp(
        runtime.player.targetLane + delta,
        0,
        LANE_COUNT - 1
      );
    };

    pointerMoveLaneRef.current = (clientY: number) => {
      const runtime = runtimeRef.current;
      const rootElement = rootRef.current;
      if (
        !runtime ||
        !runtime.running ||
        !rootElement ||
        modeRef.current !== "play" ||
        isGameOverRef.current
      ) {
        return;
      }

      const rect = rootElement.getBoundingClientRect();
      const localY = clamp(clientY - rect.top, 0, runtime.height);

      let bestLane = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let lane = 0; lane < runtime.road.laneCenters.length; lane += 1) {
        const laneY = runtime.road.laneCenters[lane];
        if (laneY === undefined) {
          continue;
        }

        const distance = Math.abs(laneY - localY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestLane = lane;
        }
      }

      runtime.player.targetLane = bestLane;
    };

    const getSpawnInterval = (elapsedSeconds: number, preview: boolean) => {
      if (preview) {
        return clamp(0.96 - Math.sin(elapsedSeconds * 0.8) * 0.08, 0.72, 1.06);
      }

      return clamp(0.95 - elapsedSeconds * 0.02, 0.3, 0.95);
    };

    const getScrollSpeed = (elapsedSeconds: number, preview: boolean) => {
      if (preview) {
        return 210 + Math.sin(elapsedSeconds * 1.5) * 20;
      }

      return clamp(290 + elapsedSeconds * 8.5, 290, 560);
    };

    const spawnBarrier = (runtime: RuntimeState) => {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const width = clamp(runtime.road.laneHeight * 1.35, 84, 126);
      const height = clamp(runtime.road.laneHeight * 0.5, 24, 36);

      runtime.barriers.push({
        id: runtime.barrierSerial,
        kind: "barrier",
        x: runtime.road.left + runtime.road.width + width + Math.random() * 70,
        lane,
        width,
        height,
        color: dangerColor,
        speedFactor: 1 + Math.random() * 0.2,
      });
      runtime.barrierSerial += 1;
    };

    const spawnHazard = (runtime: RuntimeState) => {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const hazardTypes: HazardType[] = ["bollard", "cone", "duck", "sign"];
      const hazardType =
        hazardTypes[Math.floor(Math.random() * hazardTypes.length)] ?? "bollard";
      let width = clamp(runtime.road.laneHeight * 0.62, 34, 48);
      let height = clamp(runtime.road.laneHeight * 0.72, 28, 42);
      let color = "#1f2937";
      let speedFactor = 0.98 + Math.random() * 0.2;

      if (hazardType === "cone") {
        width = clamp(runtime.road.laneHeight * 0.62, 34, 50);
        height = clamp(runtime.road.laneHeight * 0.72, 30, 44);
        color = "#ea580c";
        speedFactor = 1.02 + Math.random() * 0.18;
      } else if (hazardType === "duck") {
        width = clamp(runtime.road.laneHeight * 0.78, 40, 56);
        height = clamp(runtime.road.laneHeight * 0.6, 24, 36);
        color = "#facc15";
        speedFactor = 0.98 + Math.random() * 0.18;
      } else if (hazardType === "sign") {
        width = clamp(runtime.road.laneHeight * 0.66, 36, 52);
        height = clamp(runtime.road.laneHeight * 0.86, 32, 48);
        color = "#dc2626";
        speedFactor = 0.94 + Math.random() * 0.16;
      }

      runtime.barriers.push({
        id: runtime.barrierSerial,
        kind: "hazard",
        hazardType,
        x: runtime.road.left + runtime.road.width + width + Math.random() * 70,
        lane,
        width,
        height,
        color,
        speedFactor,
      });
      runtime.barrierSerial += 1;
    };

    const runAutopilot = (runtime: RuntimeState, deltaSeconds: number) => {
      runtime.autopilotTimer -= deltaSeconds;
      if (runtime.autopilotTimer > 0) {
        return;
      }

      runtime.autopilotTimer = 0.12;
      const playerX = runtime.player.x;

      const nearest = runtime.barriers
        .filter((barrier) => barrier.kind === "barrier" && barrier.x > playerX - 8)
        .sort((a, b) => a.x - b.x)[0];

      if (nearest) {
        runtime.player.targetLane = nearest.lane;
        return;
      }

      runtime.player.targetLane = 1;
    };

    const updateRuntime = (
      runtime: RuntimeState,
      deltaSeconds: number,
      elapsedSeconds: number
    ) => {
      const preview = modeRef.current === "preview";
      const spawnInterval = getSpawnInterval(elapsedSeconds, preview);
      const speed = getScrollSpeed(elapsedSeconds, preview);
      let crashedWithHazard = false;

      runtime.stripeOffset = (runtime.stripeOffset + speed * deltaSeconds * 0.7) % 44;
      runtime.spawnAccumulator += deltaSeconds;

      while (runtime.spawnAccumulator >= spawnInterval) {
        runtime.spawnAccumulator -= spawnInterval;
        const hazardChance = clamp(0.14 + elapsedSeconds * 0.007, 0.14, 0.5);
        const shouldSpawnHazard =
          !preview &&
          Math.random() < hazardChance &&
          runtime.barriers.filter((barrier) => barrier.kind === "hazard").length < 3;

        if (shouldSpawnHazard) {
          spawnHazard(runtime);
        } else {
          spawnBarrier(runtime);
        }
      }

      if (preview) {
        runAutopilot(runtime, deltaSeconds);
      }

      const targetY =
        runtime.road.laneCenters[runtime.player.targetLane] ??
        runtime.road.top + runtime.road.height * 0.5;
      runtime.player.y = lerp(runtime.player.y, targetY, clamp(deltaSeconds * 12, 0, 1));

      if (runtime.player.hitFlash > 0) {
        runtime.player.hitFlash = Math.max(0, runtime.player.hitFlash - deltaSeconds);
      }

      const carBounds = getCarBounds(runtime);

      for (let index = runtime.barriers.length - 1; index >= 0; index -= 1) {
        const barrier = runtime.barriers[index];
        if (!barrier) {
          continue;
        }

        barrier.x -= speed * barrier.speedFactor * deltaSeconds;
        const barrierBounds = getBarrierBounds(runtime, barrier);

        if (intersects(carBounds, barrierBounds)) {
          runtime.barriers.splice(index, 1);
          if (barrier.kind === "hazard") {
            crashAt(
              barrierBounds.x + barrierBounds.width * 0.5,
              barrierBounds.y + barrierBounds.height * 0.5,
              "#111827"
            );
            crashedWithHazard = modeRef.current === "play";
          } else {
            registerHit(
              barrierBounds.x + barrierBounds.width * 0.32,
              barrierBounds.y + barrierBounds.height * 0.5,
              barrier.color
            );
          }
          continue;
        }

        if (barrierBounds.x + barrierBounds.width < runtime.road.left - 8) {
          runtime.barriers.splice(index, 1);
          if (barrier.kind === "barrier") {
            registerMiss();
          }
        }
      }

      for (let index = runtime.particles.length - 1; index >= 0; index -= 1) {
        const particle = runtime.particles[index];
        if (!particle) {
          continue;
        }

        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;
        particle.vy += 180 * deltaSeconds;
        particle.life -= deltaSeconds;

        if (particle.life <= 0) {
          runtime.particles.splice(index, 1);
        }
      }

      if (runtime.shakeTime > 0) {
        runtime.shakeTime = Math.max(0, runtime.shakeTime - deltaSeconds);
        runtime.shakePower = Math.max(0, runtime.shakePower - 20 * deltaSeconds);
      }

      return crashedWithHazard;
    };

    const renderRuntime = (runtime: RuntimeState, elapsedSeconds: number) => {
      const ctx = contextRef.current;
      if (!ctx) {
        return;
      }

      ctx.save();

      if (runtime.shakeTime > 0 && runtime.shakePower > 0) {
        const shakeRatio = runtime.shakeTime / 0.09;
        const strength = runtime.shakePower * shakeRatio;
        ctx.translate((Math.random() * 2 - 1) * strength, (Math.random() * 2 - 1) * strength);
      }

      drawBackground(ctx, runtime.width, runtime.height, elapsedSeconds);
      drawRoad(ctx, runtime);

      const sortedBarriers = [...runtime.barriers].sort((a, b) => a.x - b.x);
      for (const barrier of sortedBarriers) {
        drawBarrier(ctx, runtime, barrier);
      }

      drawCar(ctx, runtime);
      drawParticles(ctx, runtime.particles);
      ctx.restore();
    };

    const resizeCanvas = () => {
      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);
      const width = Math.max(300, rect.width);
      const height = Math.max(360, rect.height);

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      contextRef.current = context;

      const previousLane = runtime.player.targetLane;
      runtime.width = width;
      runtime.height = height;
      runtime.road = createRoadMetrics(width, height);
      runtime.player.x = runtime.road.left + runtime.road.width * 0.18;
      runtime.player.targetLane = clamp(previousLane, 0, LANE_COUNT - 1);
      runtime.player.y =
        runtime.road.laneCenters[runtime.player.targetLane] ?? runtime.road.top + runtime.road.height * 0.5;
      runtime.barriers = [];
      runtime.particles = [];
      runtime.spawnAccumulator = 0;
    };

    runtimeRef.current = createRuntime(
      Math.max(300, root.clientWidth),
      Math.max(360, root.clientHeight)
    );

    resizeCanvas();

    const gameLoop = (nowMs: number) => {
      if (disposed) {
        return;
      }

      const runtime = runtimeRef.current;
      if (!runtime || !runtime.running) {
        return;
      }

      if (runtime.startMs === 0) {
        runtime.startMs = nowMs;
        runtime.previousFrameMs = nowMs;
      }

      const deltaSeconds = clamp((nowMs - runtime.previousFrameMs) / 1000, 0, 0.05);
      runtime.previousFrameMs = nowMs;
      const elapsedSeconds = (nowMs - runtime.startMs) / 1000;

      const crashedWithHazard = updateRuntime(runtime, deltaSeconds, elapsedSeconds);
      if (modeRef.current === "play" && crashedWithHazard) {
        runtime.running = false;
        setGameOverReason("hazard");
        setIsGameOver(true);
        renderRuntime(runtime, elapsedSeconds);
        return;
      }

      renderRuntime(runtime, elapsedSeconds);
      animationFrameRef.current = window.requestAnimationFrame(gameLoop);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(root);
    window.addEventListener("resize", resizeCanvas);
    animationFrameRef.current = window.requestAnimationFrame(gameLoop);

    return () => {
      disposed = true;
      pointerMoveLaneRef.current = () => {};
      laneMoveRef.current = () => {};
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [mode, roundSeed, updateHighScore]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (modeRef.current !== "play" || isGameOverRef.current) {
        return;
      }

      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        event.preventDefault();
        laneMoveRef.current(-1);
      }

      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        laneMoveRef.current(1);
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={rootRef} className="barrier-blaster-root">
      <div className="barrier-blaster-track-layer" aria-hidden="true">
        <div className="barrier-blaster-track-core" />
        <div className="barrier-blaster-track-stripes" />
      </div>

      <canvas
        ref={canvasRef}
        className="barrier-blaster-canvas"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          pointerMoveLaneRef.current(event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.buttons > 0 || event.pointerType === "touch") {
            pointerMoveLaneRef.current(event.clientY);
          }
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={(event) => {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
      />

      {mode === "play" && (
        <div className="barrier-blaster-hud">
          <div className="barrier-blaster-stats">
            <span>Highscore: {highScore}</span>
            <span>Barreras chocadas: {score}</span>
          </div>
        </div>
      )}

      {mode === "play" && !isGameOver && (
        <p className="barrier-blaster-instructions">
          Choca barreras de estacionamiento y evita conos, patos y señaletas. Teclado: W/S o flechas.
        </p>
      )}

      {mode === "play" && !isGameOver && (
        <button
          type="button"
          className="barrier-blaster-login-btn"
          onClick={onReturnToLogin}
          aria-label="Ir a iniciar sesión"
          title="Ir a iniciar sesión"
        >
          <FiLogIn size={18} aria-hidden="true" />
        </button>
      )}

      {mode === "play" && isGameOver && (
        <div className="barrier-blaster-game-over">
          <h2>{gameOverReason === "hazard" ? "Chocaste con un obstaculo" : "Fin del juego"}</h2>
          <p>Barreras chocadas: {score}</p>
          <p>Barreras falladas: {missed}</p>
          <p>Mejor racha: {bestStreak}</p>
          <p>Highscore: {highScore}</p>

          <div className="barrier-blaster-game-over-actions">
            <button type="button" className="barrier-blaster-action-btn" onClick={restartRound}>
              Jugar otra vez
            </button>
            <button
              type="button"
              className="barrier-blaster-action-btn barrier-blaster-action-btn-secondary"
              onClick={onReturnToLogin}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

