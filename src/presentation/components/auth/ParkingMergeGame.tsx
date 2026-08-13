import { useCallback, useEffect, useRef, useState } from "react";
import { Bodies, Body, Composite, Engine, Events, type IEventCollision } from "matter-js";
import { FiLogIn, FiRefreshCw } from "react-icons/fi";
import "../../styles/auth/ParkingMergeGame.css";

type ParkingMergeGameProps = {
  initialHighScore?: number;
  onReturnToLogin: () => void;
  onGameOver?: (score: number) => void;
};

type PieceMeta = { level: number; bornAt: number; merging?: boolean };

const BOARD_WIDTH = 420;
const BOARD_HEIGHT = 620;
const LIMIT_Y = 112;
const DROP_Y = 54;
const WALL_SIZE = 34;
const PIECES = [
  { emoji: "🚲", label: "Bicicleta", radius: 19, color: "#95d5b2", points: 20 },
  { emoji: "🛵", label: "Moto", radius: 24, color: "#74c69d", points: 40 },
  { emoji: "🚗", label: "Compacto", radius: 31, color: "#52b788", points: 80 },
  { emoji: "🚕", label: "Sedan", radius: 39, color: "#f4c95d", points: 140 },
  { emoji: "🚙", label: "SUV", radius: 48, color: "#f29e4c", points: 220 },
  { emoji: "🛻", label: "Pickup", radius: 58, color: "#e76f51", points: 340 },
  { emoji: "🚐", label: "Van", radius: 70, color: "#8e7dbe", points: 520 },
  { emoji: "🚌", label: "Autobus", radius: 84, color: "#577590", points: 800 },
  { emoji: "✈️", label: "Avion", radius: 96, color: "#4d8fbd", points: 1200 },
] as const;

const STARTER_PIECES = [
  { level: 0, probability: 0.45 },
  { level: 1, probability: 0.34 },
  { level: 2, probability: 0.21 },
] as const;

const randomStarterLevel = () => {
  const roll = Math.random();
  let accumulatedProbability = 0;
  for (const piece of STARTER_PIECES) {
    accumulatedProbability += piece.probability;
    if (roll < accumulatedProbability) return piece.level;
  }
  return STARTER_PIECES[0].level;
};
const pieceMeta = (body: Body) => body.plugin as PieceMeta;

const createPiece = (x: number, y: number, level: number, bornAt = performance.now()) => {
  const config = PIECES[level] ?? PIECES[0];
  const body = Bodies.circle(x, y, config.radius, {
    restitution: 0.12,
    friction: 0.12,
    frictionStatic: 0.35,
    density: 0.0018,
    label: "merge-piece",
  });
  body.plugin = { level, bornAt } satisfies PieceMeta;
  return body;
};

export function ParkingMergeGame({ initialHighScore = 0, onReturnToLogin, onGameOver }: ParkingMergeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const aimXRef = useRef(BOARD_WIDTH / 2);
  const currentLevelRef = useRef(randomStarterLevel());
  const nextLevelRef = useRef(randomStarterLevel());
  const canDropRef = useRef(true);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(initialHighScore);
  const onGameOverRef = useRef(onGameOver);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(initialHighScore);
  const [nextLevel, setNextLevel] = useState(nextLevelRef.current);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const finishGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setIsGameOver(true);
    const best = Math.max(highScoreRef.current, scoreRef.current);
    highScoreRef.current = best;
    setHighScore(best);
    onGameOverRef.current?.(best);
  }, []);

  const resetGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    Composite.allBodies(engine.world).filter((body) => body.label === "merge-piece").forEach((body) => Composite.remove(engine.world, body));
    scoreRef.current = 0;
    setScore(0);
    currentLevelRef.current = randomStarterLevel();
    nextLevelRef.current = randomStarterLevel();
    setNextLevel(nextLevelRef.current);
    aimXRef.current = BOARD_WIDTH / 2;
    canDropRef.current = true;
    gameOverRef.current = false;
    setIsGameOver(false);
  }, []);

  const dropPiece = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !canDropRef.current || gameOverRef.current) return;
    const config = PIECES[currentLevelRef.current] ?? PIECES[0];
    const safeX = Math.max(WALL_SIZE + config.radius, Math.min(BOARD_WIDTH - WALL_SIZE - config.radius, aimXRef.current));
    Composite.add(engine.world, createPiece(safeX, DROP_Y, currentLevelRef.current));
    currentLevelRef.current = nextLevelRef.current;
    nextLevelRef.current = randomStarterLevel();
    setNextLevel(nextLevelRef.current);
    canDropRef.current = false;
    window.setTimeout(() => { canDropRef.current = true; }, 430);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const engine = Engine.create({ gravity: { x: 0, y: 1.05 } });
    engineRef.current = engine;
    const wallOptions = { isStatic: true, label: "wall", restitution: 0.05, friction: 0.2 };
    Composite.add(engine.world, [
      Bodies.rectangle(WALL_SIZE / 2, BOARD_HEIGHT / 2, WALL_SIZE, BOARD_HEIGHT, wallOptions),
      Bodies.rectangle(BOARD_WIDTH - WALL_SIZE / 2, BOARD_HEIGHT / 2, WALL_SIZE, BOARD_HEIGHT, wallOptions),
      Bodies.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT - WALL_SIZE / 2, BOARD_WIDTH, WALL_SIZE, wallOptions),
    ]);

    const mergePairs = (event: IEventCollision<Engine>) => {
      for (const pair of event.pairs) {
        const first = pair.bodyA;
        const second = pair.bodyB;
        if (first.label !== "merge-piece" || second.label !== "merge-piece") continue;
        const firstMeta = pieceMeta(first);
        const secondMeta = pieceMeta(second);
        if (firstMeta.level !== secondMeta.level || firstMeta.merging || secondMeta.merging || firstMeta.level >= PIECES.length - 1) continue;
        firstMeta.merging = true;
        secondMeta.merging = true;
        const nextLevel = firstMeta.level + 1;
        const x = (first.position.x + second.position.x) / 2;
        const y = (first.position.y + second.position.y) / 2;
        Composite.remove(engine.world, first);
        Composite.remove(engine.world, second);
        const merged = createPiece(x, y, nextLevel, performance.now() - 1600);
        Body.setVelocity(merged, { x: (first.velocity.x + second.velocity.x) * 0.18, y: -1.4 });
        Composite.add(engine.world, merged);
        scoreRef.current += PIECES[nextLevel]?.points ?? 0;
        setScore(scoreRef.current);
        setHighScore((value) => {
          const nextValue = Math.max(value, scoreRef.current);
          highScoreRef.current = nextValue;
          return nextValue;
        });
      }
    };
    Events.on(engine, "collisionStart", mergePairs);

    let frame = 0;
    let lastTime = performance.now();
    let dangerSince = 0;
    const render = (now: number) => {
      const delta = Math.min(32, now - lastTime);
      lastTime = now;
      if (!gameOverRef.current) Engine.update(engine, delta);
      context.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
      context.fillStyle = "#111722";
      context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
      context.fillStyle = "rgba(255,255,255,.035)";
      for (let y = 0; y < BOARD_HEIGHT; y += 42) context.fillRect(WALL_SIZE, y, BOARD_WIDTH - WALL_SIZE * 2, 1);
      context.setLineDash([8, 7]);
      context.strokeStyle = "rgba(240,112,112,.72)";
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(WALL_SIZE, LIMIT_Y); context.lineTo(BOARD_WIDTH - WALL_SIZE, LIMIT_Y); context.stroke();
      context.setLineDash([]);
      context.fillStyle = "rgba(255,255,255,.12)";
      context.fillRect(0, 0, WALL_SIZE, BOARD_HEIGHT);
      context.fillRect(BOARD_WIDTH - WALL_SIZE, 0, WALL_SIZE, BOARD_HEIGHT);
      context.fillRect(0, BOARD_HEIGHT - WALL_SIZE, BOARD_WIDTH, WALL_SIZE);

      const bodies = Composite.allBodies(engine.world).filter((body) => body.label === "merge-piece");
      let hasDanger = false;
      for (const body of bodies) {
        const meta = pieceMeta(body);
        const config = PIECES[meta.level] ?? PIECES[0];
        context.save();
        context.translate(body.position.x, body.position.y);
        context.rotate(body.angle);
        context.beginPath(); context.arc(0, 0, config.radius, 0, Math.PI * 2);
        context.fillStyle = config.color; context.fill();
        context.strokeStyle = "rgba(255,255,255,.44)"; context.lineWidth = 2; context.stroke();
        context.font = `${Math.max(20, config.radius * .9)}px system-ui`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(config.emoji, 0, 2);
        context.restore();
        if (now - meta.bornAt > 1400 && body.position.y - config.radius < LIMIT_Y && Math.abs(body.velocity.y) < 1.3) hasDanger = true;
      }
      if (!gameOverRef.current) {
        const preview = PIECES[currentLevelRef.current] ?? PIECES[0];
        context.globalAlpha = .72;
        context.beginPath(); context.arc(aimXRef.current, DROP_Y, preview.radius, 0, Math.PI * 2);
        context.fillStyle = preview.color; context.fill();
        context.font = `${Math.max(20, preview.radius * .9)}px system-ui`; context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(preview.emoji, aimXRef.current, DROP_Y + 2); context.globalAlpha = 1;
      }
      dangerSince = hasDanger ? (dangerSince || now) : 0;
      if (dangerSince && now - dangerSince > 1150) finishGame();
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frame);
      Events.off(engine, "collisionStart", mergePairs);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
    };
  }, [finishGame]);

  const updateAim = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    aimXRef.current = ((clientX - rect.left) / rect.width) * BOARD_WIDTH;
  };

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") aimXRef.current = Math.max(45, aimXRef.current - 24);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") aimXRef.current = Math.min(375, aimXRef.current + 24);
      if (event.code === "Space" || event.key === "ArrowDown") { event.preventDefault(); dropPiece(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [dropPiece]);

  return (
    <section className="parking-merge-game">
      <header className="parking-merge-game__header">
        <div><span>Viggo arcade</span><h1>Parking Merge</h1></div>
        <button type="button" onClick={onReturnToLogin}><FiLogIn /> Volver al login</button>
      </header>
      <div className="parking-merge-game__content">
        <aside className="parking-merge-game__panel">
          <article><span>Puntuacion</span><strong>{score}</strong></article>
          <article><span>Record</span><strong>{Math.max(highScore, score)}</strong></article>
          <article className="parking-merge-game__next"><span>Siguiente</span><strong>{PIECES[nextLevel].emoji}</strong><small>{PIECES[nextLevel].label}</small></article>
          <p>Mueve la pieza con el cursor o A/D. Sueltala con clic, espacio o flecha abajo.</p>
        </aside>
        <div className="parking-merge-game__board">
          <canvas ref={canvasRef} width={BOARD_WIDTH} height={BOARD_HEIGHT} onPointerMove={(event) => updateAim(event.clientX)} onPointerDown={(event) => { updateAim(event.clientX); dropPiece(); }} />
          {isGameOver ? <div className="parking-merge-game__over"><span>Estacionamiento lleno</span><h2>{score} puntos</h2><p>Record: {Math.max(highScore, score)}</p><div><button type="button" onClick={resetGame}><FiRefreshCw /> Jugar otra vez</button><button type="button" className="is-secondary" onClick={onReturnToLogin}><FiLogIn /> Ir al login</button></div></div> : null}
        </div>
        <aside className="parking-merge-game__evolution"><span>Evolucion</span>{PIECES.map((piece, index) => <div key={piece.label}><b>{piece.emoji}</b><small>{index + 1}. {piece.label}</small></div>)}</aside>
      </div>
    </section>
  );
}

