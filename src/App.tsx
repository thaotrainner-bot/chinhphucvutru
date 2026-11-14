import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  Heart,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  AmmoId,
  AMMO_ORDER,
  AMMO_TYPES,
  GameState,
  ShipId,
  SHIP_ORDER,
  SHIPS,
} from './types/game';
import { soundFX } from './utils/sound';
import {
  BonusStarItem,
  DropItem,
  FloatingText,
  ParticleKind,
  RichParticle,
  ShockwaveRing,
} from './utils/fx';
import {
  BossChicken,
  Bullet,
  ChickenEnemy,
  EggProjectile,
  MeteorObstacle,
  PlayerShip,
} from './utils/actors';
import { HangarModal, ShipPreviewCanvas } from './components/HangarModal';

const STORAGE_KEY_HIGH_SCORE = 'space_chicken_highscore_v2';
const MAX_LEVEL = 10;
const MAX_LIVES = 3;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedShip, setSelectedShip] = useState<ShipId>('falcon');
  const [selectedAmmo, setSelectedAmmo] = useState<AmmoId>('laser');
  const [weaponTier, setWeaponTier] = useState<number>(1);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showHangarModal, setShowHangarModal] = useState<boolean>(false);
  const [bottomDockCollapsed, setBottomDockCollapsed] = useState<boolean>(false);

  const [hud, setHud] = useState({
    score: 0,
    highScore: 0,
    level: 1,
    lives: MAX_LIVES,
    hp: 100,
    maxHp: 100,
    shield: false,
    weaponTier: 1,
    shipId: 'falcon' as ShipId,
    ammoId: 'laser' as AmmoId,
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 100,
    waveProgress: 0,
    waveTarget: 350,
  });

  const engineRef = useRef<{
    state: GameState;
    score: number;
    highScore: number;
    level: number;
    lives: number;
    levelBaseScore: number;
    selectedShip: ShipId;
    selectedAmmo: AmmoId;
    configuredTier: number;
    player: PlayerShip | null;
    bullets: Bullet[];
    eggs: EggProjectile[];
    chickens: ChickenEnemy[];
    meteors: MeteorObstacle[];
    particles: RichParticle[];
    rings: ShockwaveRing[];
    drops: DropItem[];
    bonusStars: BonusStarItem[];
    floatTexts: FloatingText[];
    boss: BossChicken | null;
    stars: { x: number; y: number; s: number; v: number; a: number }[];
    nebulae: { x: number; y: number; r: number; color: string; vy: number }[];
    keys: Record<string, boolean>;
    pointerActive: boolean;
    pointerX: number;
    pointerY: number;
    isFiringPointer: boolean;
    manualShotQueued: boolean;
    shakeTime: number;
    shakeMag: number;
    levelBannerTimer: number;
    bossRewardBannerTimer: number;
    fireworkTimer: number;
    animId: number;
  }>({
    state: 'START',
    score: 0,
    highScore: 0,
    level: 1,
    lives: MAX_LIVES,
    levelBaseScore: 0,
    selectedShip: 'falcon',
    selectedAmmo: 'laser',
    configuredTier: 1,
    player: null,
    bullets: [],
    eggs: [],
    chickens: [],
    meteors: [],
    particles: [],
    rings: [],
    drops: [],
    bonusStars: [],
    floatTexts: [],
    boss: null,
    stars: [],
    nebulae: [],
    keys: {},
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    isFiringPointer: false,
    manualShotQueued: false,
    shakeTime: 0,
    shakeMag: 0,
    levelBannerTimer: 0,
    bossRewardBannerTimer: 0,
    fireworkTimer: 0,
    animId: 0,
  });

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY_HIGH_SCORE) || '0');
    const cleanHigh = Number.isFinite(saved) ? saved : 0;
    engineRef.current.highScore = cleanHigh;
    setHud((prev) => ({ ...prev, highScore: cleanHigh }));
  }, []);

  const syncHudState = () => {
    const eng = engineRef.current;
    const p = eng.player;
    const waveThreshold = 320 + eng.level * 130;
    const currentProgress = Math.max(0, eng.score - eng.levelBaseScore);

    if (eng.score > eng.highScore) {
      eng.highScore = eng.score;
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(eng.highScore));
    }

    setHud({
      score: eng.score,
      highScore: eng.highScore,
      level: eng.level,
      lives: eng.lives,
      hp: p ? Math.max(0, Math.round(p.hp)) : SHIPS[eng.selectedShip].maxHp,
      maxHp: p ? p.maxHp : SHIPS[eng.selectedShip].maxHp,
      shield: p ? p.shield : eng.selectedShip === 'titan',
      weaponTier: p ? p.weaponTier : eng.configuredTier,
      shipId: p ? p.shipId : eng.selectedShip,
      ammoId: p ? p.ammoId : eng.selectedAmmo,
      bossActive: Boolean(eng.boss),
      bossHp: eng.boss ? Math.max(0, Math.round(eng.boss.hp)) : 0,
      bossMaxHp: eng.boss ? eng.boss.maxHp : 100,
      waveProgress: Math.min(waveThreshold, currentProgress),
      waveTarget: waveThreshold,
    });
  };

  const applyShipChoice = (id: ShipId) => {
    setSelectedShip(id);
    engineRef.current.selectedShip = id;
    if (engineRef.current.player) {
      engineRef.current.player.applyShip(id);
      engineRef.current.floatTexts.push(
        new FloatingText(
          engineRef.current.player.x,
          engineRef.current.player.y - 28,
          `PHI THUYỀN: ${SHIPS[id].name.toUpperCase()}`,
          '#38bdf8'
        )
      );
      syncHudState();
    } else {
      setHud((h) => ({
        ...h,
        shipId: id,
        hp: SHIPS[id].maxHp,
        maxHp: SHIPS[id].maxHp,
        shield: id === 'titan',
      }));
    }
  };

  const applyAmmoChoice = (id: AmmoId) => {
    setSelectedAmmo(id);
    engineRef.current.selectedAmmo = id;
    if (engineRef.current.player) {
      engineRef.current.player.ammoId = id;
      engineRef.current.floatTexts.push(
        new FloatingText(
          engineRef.current.player.x,
          engineRef.current.player.y - 26,
          `ĐẠN: ${AMMO_TYPES[id].name.toUpperCase()}`,
          AMMO_TYPES[id].color
        )
      );
      syncHudState();
    } else {
      setHud((h) => ({ ...h, ammoId: id }));
    }
  };

  const applyTierChoice = (tier: number) => {
    const clean = Math.max(1, Math.min(10, tier));
    setWeaponTier(clean);
    engineRef.current.configuredTier = clean;
    if (engineRef.current.player) {
      engineRef.current.player.weaponTier = clean;
      engineRef.current.floatTexts.push(
        new FloatingText(
          engineRef.current.player.x,
          engineRef.current.player.y - 30,
          `HỎA LỰC CẤP ${clean}`,
          '#facc15'
        )
      );
      syncHudState();
    } else {
      setHud((h) => ({ ...h, weaponTier: clean }));
    }
  };

  const triggerShake = (frames: number, mag: number) => {
    engineRef.current.shakeTime = Math.max(engineRef.current.shakeTime, frames);
    engineRef.current.shakeMag = Math.max(engineRef.current.shakeMag, mag);
  };

  const spawnParticles = (
    x: number,
    y: number,
    color: string,
    count: number,
    kind: ParticleKind = 'spark'
  ) => {
    for (let i = 0; i < count; i++) {
      engineRef.current.particles.push(new RichParticle(x, y, color, kind));
    }
  };

  const spawnCelebrationFirework = (w: number, h: number) => {
    const eng = engineRef.current;
    const fx = Math.random() * (w * 0.8) + w * 0.1;
    const fy = Math.random() * (h * 0.55) + h * 0.1;
    const palette = ['#22d3ee', '#facc15', '#f472b6', '#4ade80', '#a78bfa', '#fb923c'];
    const color = palette[Math.floor(Math.random() * palette.length)];

    eng.rings.push(new ShockwaveRing(fx, fy, color, 110));
    spawnParticles(fx, fy, color, 28, 'spark');
    for (let i = 0; i < 18; i++) {
      const cColor = palette[Math.floor(Math.random() * palette.length)];
      eng.particles.push(new RichParticle(fx, fy, cColor, 'confetti'));
    }
    soundFX.playFireworkPop();
  };

  const startNewGame = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const eng = engineRef.current;

    eng.score = 0;
    eng.level = 1;
    eng.lives = MAX_LIVES;
    eng.levelBaseScore = 0;
    eng.bullets = [];
    eng.eggs = [];
    eng.chickens = [];
    eng.meteors = [];
    eng.particles = [];
    eng.rings = [];
    eng.drops = [];
    eng.bonusStars = [];
    eng.floatTexts = [];
    eng.boss = null;
    eng.isFiringPointer = false;
    eng.manualShotQueued = false;
    eng.levelBannerTimer = 110;
    eng.bossRewardBannerTimer = 0;
    eng.fireworkTimer = 0;

    eng.player = new PlayerShip(
      cvs.width,
      cvs.height,
      eng.selectedShip,
      eng.selectedAmmo,
      eng.configuredTier
    );

    eng.state = 'PLAYING';
    setGameState('PLAYING');
    setShowHangarModal(false);
    syncHudState();
  };

  // Reset toàn bộ tiến độ ván chơi (Score = 0, Level = 1, Cấp đạn = 1, Mạng = 3), giữ nguyên High Score và mở Xưởng Chiến Cơ
  const exitToHangarWithReset = () => {
    const eng = engineRef.current;
    if (eng.score > eng.highScore) {
      eng.highScore = eng.score;
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(eng.highScore));
    }

    eng.score = 0;
    eng.level = 1;
    eng.lives = MAX_LIVES;
    eng.levelBaseScore = 0;
    eng.configuredTier = 1;
    setWeaponTier(1);

    eng.player = null;
    eng.boss = null;
    eng.bullets = [];
    eng.eggs = [];
    eng.chickens = [];
    eng.meteors = [];
    eng.particles = [];
    eng.rings = [];
    eng.drops = [];
    eng.bonusStars = [];
    eng.floatTexts = [];
    eng.isFiringPointer = false;
    eng.manualShotQueued = false;
    eng.levelBannerTimer = 0;
    eng.bossRewardBannerTimer = 0;
    eng.fireworkTimer = 0;

    eng.state = 'START';
    setGameState('START');
    syncHudState();
    setShowHangarModal(true);
  };

  const togglePause = () => {
    const eng = engineRef.current;
    if (eng.state === 'PLAYING') {
      eng.isFiringPointer = false;
      eng.manualShotQueued = false;
      eng.state = 'PAUSED';
      setGameState('PAUSED');
    } else if (eng.state === 'PAUSED') {
      eng.state = 'PLAYING';
      setGameState('PLAYING');
      setShowHangarModal(false);
    }
  };

  const openHangarAndSettings = () => {
    const eng = engineRef.current;
    if (eng.state === 'PLAYING') {
      eng.isFiringPointer = false;
      eng.manualShotQueued = false;
      eng.state = 'PAUSED';
      setGameState('PAUSED');
    }
    setShowHangarModal(true);
  };

  const closeHangarAndResume = () => {
    setShowHangarModal(false);
    const eng = engineRef.current;
    if (eng.state === 'PAUSED' && eng.player) {
      eng.state = 'PLAYING';
      setGameState('PLAYING');
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundFX.enabled = next;
  };

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const eng = engineRef.current;

    const initBackdrop = (w: number, h: number) => {
      eng.stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: Math.random() * 2.2 + 0.6,
        v: Math.random() * 2.5 + 0.4,
        a: Math.random() * 0.65 + 0.3,
      }));
      const nebulaColors = [
        'rgba(56, 189, 248, 0.08)',
        'rgba(168, 85, 247, 0.08)',
        'rgba(244, 63, 94, 0.06)',
      ];
      eng.nebulae = Array.from({ length: 5 }, (_, idx) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 180 + 140,
        color: nebulaColors[idx % nebulaColors.length],
        vy: Math.random() * 0.35 + 0.15,
      }));
    };

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      initBackdrop(cvs.width, cvs.height);
      if (eng.player) {
        eng.player.x = Math.min(Math.max(30, eng.player.x), cvs.width - 30);
        eng.player.y = Math.min(Math.max(60, eng.player.y), cvs.height - 60);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        eng.keys['Space'] = true;
        if (eng.state === 'PLAYING') {
          eng.manualShotQueued = true;
        }
        return;
      }
      eng.keys[e.code] = true;
      if (e.code === 'Digit1') applyAmmoChoice('laser');
      if (e.code === 'Digit2') applyAmmoChoice('plasma');
      if (e.code === 'Digit3') applyAmmoChoice('cryo');
      if (e.code === 'Digit4') applyAmmoChoice('shuriken');
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (eng.state === 'PLAYING' || eng.state === 'PAUSED') {
          togglePause();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      eng.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const handlePlayerDamage = (amount: number) => {
      const p = eng.player;
      if (!p || p.isInvulnerable()) return;

      p.triggerDamageFlash(650);
      triggerShake(14, 8);
      soundFX.playDamage();

      if (p.shield) {
        p.shield = false;
        eng.rings.push(new ShockwaveRing(p.x, p.y, '#38bdf8', 75));
        spawnParticles(p.x, p.y, '#38bdf8', 18, 'spark');
        eng.floatTexts.push(new FloatingText(p.x, p.y - 24, 'VỠ LÁ CHẮN!', '#38bdf8'));
        syncHudState();
        return;
      }

      p.hp -= amount;
      spawnParticles(p.x, p.y, '#ef4444', 16, 'spark');
      eng.floatTexts.push(new FloatingText(p.x, p.y - 20, `-${amount} HP`, '#ef4444'));

      if (p.hp <= 0) {
        if (eng.lives > 1) {
          // Trừ 1 mạng, reset đạn về Cấp 1, hồi đầy 100% HP và bất tử nhấp nháy trong 2 giây
          eng.lives -= 1;
          p.hp = p.maxHp;
          p.weaponTier = 1;
          eng.configuredTier = 1;
          setWeaponTier(1);
          p.triggerRespawnInvulnerability(2000);

          eng.rings.push(new ShockwaveRing(p.x, p.y, '#facc15', 95));
          spawnParticles(p.x, p.y, '#facc15', 28, 'spark');
          eng.floatTexts.push(
            new FloatingText(
              p.x,
              p.y - 44,
              `MẤT 1 MẠNG (CÒN ♥ x${eng.lives}) · HỒI 100% HP!`,
              '#facc15'
            )
          );
          eng.floatTexts.push(
            new FloatingText(p.x, p.y - 24, 'HẠ ĐẠN VỀ CẤP 1 · BẤT TỬ 2 GIÂY!', '#38bdf8')
          );
        } else {
          // Hết toàn bộ 3 mạng (Mạng = 0) -> Kích hoạt Game Over
          eng.lives = 0;
          p.hp = 0;
          p.weaponTier = 1;
          eng.configuredTier = 1;
          setWeaponTier(1);
          eng.rings.push(new ShockwaveRing(p.x, p.y, '#f97316', 110));
          spawnParticles(p.x, p.y, '#f97316', 40, 'spark');
          eng.state = 'GAMEOVER';
          setGameState('GAMEOVER');
        }
      }
      syncHudState();
    };

    const triggerBossDefeatRewards = (bx: number, by: number) => {
      const p = eng.player;
      if (!p) return;

      // 1. Mưa ngôi sao điểm thưởng (★) tự động hút về máy bay
      const starCount = 20 + eng.level * 2;
      for (let i = 0; i < starCount; i++) {
        eng.bonusStars.push(new BonusStarItem(bx, by, 50 + eng.level * 10));
      }

      // 2. Tự động nâng +1 Cấp Đạn
      const nextTier = Math.min(10, p.weaponTier + 1);
      p.weaponTier = nextTier;
      eng.configuredTier = nextTier;
      setWeaponTier(nextTier);

      // 3. Kích hoạt Lá Chắn Bảo Vệ
      p.shield = true;

      // 4. Hồi phục ngay +40% HP tối đa
      const healAmount = Math.round(p.maxHp * 0.4);
      p.hp = Math.min(p.maxHp, p.hp + healAmount);

      soundFX.playBossDefeatedFanfare();
      eng.bossRewardBannerTimer = 145;

      eng.floatTexts.push(
        new FloatingText(p.x, p.y - 48, `PHẦN THƯỞNG DIỆT TRÙM: +1 CẤP ĐẠN!`, '#facc15')
      );
      eng.floatTexts.push(
        new FloatingText(p.x, p.y - 28, `BẬT LÁ CHẮN & HỒI +${healAmount} HP!`, '#4ade80')
      );
    };

    const renderLoop = (now: number) => {
      const w = cvs.width;
      const h = cvs.height;

      ctx.save();
      if (eng.shakeTime > 0) {
        eng.shakeTime--;
        const dx = (Math.random() - 0.5) * eng.shakeMag * 2;
        const dy = (Math.random() - 0.5) * eng.shakeMag * 2;
        ctx.translate(dx, dy);
        if (eng.shakeTime === 0) eng.shakeMag = 0;
      }

      // Deep Cosmic Backdrop
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      eng.nebulae.forEach((n) => {
        if (eng.state === 'PLAYING' || eng.state === 'VICTORY') {
          n.y += n.vy;
          if (n.y - n.r > h) {
            n.y = -n.r;
            n.x = Math.random() * w;
          }
        }
        const grad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      eng.stars.forEach((st) => {
        if (eng.state === 'PLAYING' || eng.state === 'VICTORY') {
          st.y += st.v * (1 + (eng.level - 1) * 0.08);
          if (st.y > h) {
            st.y = 0;
            st.x = Math.random() * w;
          }
        }
        ctx.fillStyle = `rgba(226, 232, 240, ${st.a})`;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // Continuous Fireworks & Confetti Rain when VICTORY
      if (eng.state === 'VICTORY') {
        eng.fireworkTimer++;
        if (eng.fireworkTimer % 28 === 0) {
          spawnCelebrationFirework(w, h);
        }
        if (eng.fireworkTimer % 5 === 0) {
          const palette = ['#22d3ee', '#facc15', '#f472b6', '#4ade80', '#a78bfa'];
          const c = palette[Math.floor(Math.random() * palette.length)];
          const conf = new RichParticle(Math.random() * w, -10, c, 'confetti');
          conf.vx = (Math.random() - 0.5) * 2.5;
          conf.vy = Math.random() * 2.5 + 1.8;
          eng.particles.push(conf);
        }

        for (let i = eng.rings.length - 1; i >= 0; i--) {
          const r = eng.rings[i];
          r.update();
          r.draw(ctx);
          if (r.alpha <= 0) eng.rings.splice(i, 1);
        }

        for (let i = eng.particles.length - 1; i >= 0; i--) {
          const pt = eng.particles[i];
          pt.update();
          pt.draw(ctx);
          if (pt.alpha <= 0 || pt.y > h + 30) eng.particles.splice(i, 1);
        }
      }

      if (eng.state === 'PLAYING' && eng.player) {
        const p = eng.player;

        // Movement
        if (eng.keys['ArrowLeft'] || eng.keys['KeyA']) p.x -= p.speed;
        if (eng.keys['ArrowRight'] || eng.keys['KeyD']) p.x += p.speed;
        if (eng.keys['ArrowUp'] || eng.keys['KeyW']) p.y -= p.speed;
        if (eng.keys['ArrowDown'] || eng.keys['KeyS']) p.y += p.speed;

        if (eng.pointerActive) {
          p.x += (eng.pointerX - p.x) * 0.22;
          p.y += (eng.pointerY - p.y) * 0.22;
        }

        p.x = Math.max(p.radius + 10, Math.min(w - p.radius - 10, p.x));
        p.y = Math.max(p.radius + 64, Math.min(h - p.radius - 28, p.y));

        // Bắn đạn thủ công (Phím Space / Nhấp chuột trái / Chạm màn hình) với giới hạn tốc độ bắn của từng Chiến Cơ
        if (eng.keys['Space'] || eng.isFiringPointer || eng.manualShotQueued) {
          p.shoot(now, eng.bullets);
          eng.manualShotQueued = false;
        }
        p.draw(ctx);

        // Wave & Boss Spawning
        const waveThreshold = 320 + eng.level * 130;
        if (!eng.boss && eng.score - eng.levelBaseScore >= waveThreshold) {
          eng.boss = new BossChicken(w, eng.level);
          soundFX.playBossAlert();
          eng.floatTexts.push(
            new FloatingText(
              w / 2,
              150,
              `CẢNH BÁO: TRÙM GÀ CHÚA CẤP ${eng.level} XUẤT HIỆN!`,
              '#ef4444'
            )
          );
          syncHudState();
        }

        if (!eng.boss) {
          const chickenRate = 0.016 + eng.level * 0.0028;
          const meteorRate = 0.0055 + eng.level * 0.0014;
          if (Math.random() < chickenRate) {
            eng.chickens.push(new ChickenEnemy(w, eng.level));
          }
          if (Math.random() < meteorRate) {
            eng.meteors.push(new MeteorObstacle(w, eng.level));
          }
        } else {
          eng.boss.update(w, eng.eggs);
          eng.boss.draw(ctx);

          if (Math.hypot(eng.boss.x - p.x, eng.boss.y - p.y) < eng.boss.radius + p.radius - 8) {
            handlePlayerDamage(32);
          }
        }

        // Update Bullets
        for (let i = eng.bullets.length - 1; i >= 0; i--) {
          const b = eng.bullets[i];
          b.update();
          b.draw(ctx);

          if (b.y < -30 || b.y > h + 30 || b.x < -30 || b.x > w + 30) {
            eng.bullets.splice(i, 1);
            continue;
          }

          let removed = false;

          // Hit Boss
          if (eng.boss && !b.hitIds.has(eng.boss.id)) {
            if (Math.hypot(b.x - eng.boss.x, b.y - eng.boss.y) < eng.boss.radius + b.radius) {
              eng.boss.hp -= b.damage;
              b.hitIds.add(eng.boss.id);
              if (b.slowFactor < 1) eng.boss.applyChill(b.slowFactor);
              spawnParticles(b.x, b.y, b.color, 5, 'spark');

              if (b.pierceLeft > 1) {
                b.pierceLeft--;
              } else {
                eng.bullets.splice(i, 1);
                removed = true;
              }

              if (eng.boss.hp <= 0) {
                const bx = eng.boss.x;
                const by = eng.boss.y;
                eng.rings.push(new ShockwaveRing(bx, by, '#facc15', 165));
                eng.rings.push(new ShockwaveRing(bx, by, '#ef4444', 120));
                spawnParticles(bx, by, '#facc15', 45, 'feather');
                spawnParticles(bx, by, '#ef4444', 45, 'spark');
                triggerShake(24, 12);

                eng.score += 350 * eng.level;
                eng.boss = null;

                if (eng.level >= MAX_LEVEL) {
                  triggerBossDefeatRewards(bx, by);
                  soundFX.playVictoryFanfare();
                  spawnCelebrationFirework(w, h);
                  spawnCelebrationFirework(w, h);
                  eng.state = 'VICTORY';
                  setGameState('VICTORY');
                } else {
                  eng.level += 1;
                  eng.levelBaseScore = eng.score;
                  eng.levelBannerTimer = 120;
                  triggerBossDefeatRewards(bx, by);
                }
              }
              syncHudState();
            }
          }

          if (removed) continue;

          // Hit Chickens
          for (let j = eng.chickens.length - 1; j >= 0; j--) {
            const c = eng.chickens[j];
            if (b.hitIds.has(c.id)) continue;

            if (Math.hypot(b.x - c.x, b.y - c.y) < c.radius + b.radius) {
              c.hp -= b.damage;
              b.hitIds.add(c.id);
              if (b.slowFactor < 1) c.applyChill(b.slowFactor);
              spawnParticles(b.x, b.y, b.color, 4, 'spark');

              if (c.hp <= 0) {
                soundFX.playEnemyDown();
                eng.rings.push(new ShockwaveRing(c.x, c.y, c.bodyColor, 46));
                spawnParticles(c.x, c.y, c.bodyColor, 14, 'feather');
                eng.score += c.scoreValue;

                const dropChance = c.variant === 'armored' ? 0.35 : c.variant === 'sniper' ? 0.28 : 0.16;
                if (Math.random() < dropChance) {
                  eng.drops.push(new DropItem(c.x, c.y));
                }
                eng.chickens.splice(j, 1);
                syncHudState();
              }

              if (b.pierceLeft > 1) {
                b.pierceLeft--;
              } else {
                eng.bullets.splice(i, 1);
                removed = true;
                break;
              }
            }
          }

          if (removed) continue;

          // Hit Meteors
          for (let k = eng.meteors.length - 1; k >= 0; k--) {
            const m = eng.meteors[k];
            if (b.hitIds.has(m.id)) continue;

            if (Math.hypot(b.x - m.x, b.y - m.y) < m.radius + b.radius) {
              m.hp -= b.damage;
              b.hitIds.add(m.id);
              if (b.slowFactor < 1) m.applyChill(b.slowFactor);
              spawnParticles(b.x, b.y, '#94a3b8', 4, 'rock');

              if (m.hp <= 0) {
                soundFX.playEnemyDown();
                eng.rings.push(new ShockwaveRing(m.x, m.y, '#94a3b8', 54));
                spawnParticles(m.x, m.y, '#94a3b8', 16, 'rock');
                eng.score += 30 + eng.level * 5;
                if (Math.random() < 0.24) {
                  eng.drops.push(new DropItem(m.x, m.y));
                }
                eng.meteors.splice(k, 1);
                syncHudState();
              }

              if (b.pierceLeft > 1) {
                b.pierceLeft--;
              } else {
                eng.bullets.splice(i, 1);
                break;
              }
            }
          }
        }

        // Update Chickens
        for (let i = eng.chickens.length - 1; i >= 0; i--) {
          const c = eng.chickens[i];
          c.update(w, eng.eggs, eng.level);
          c.draw(ctx);

          if (Math.hypot(c.x - p.x, c.y - p.y) < c.radius + p.radius - 4) {
            spawnParticles(c.x, c.y, c.bodyColor, 14, 'feather');
            eng.chickens.splice(i, 1);
            handlePlayerDamage(c.variant === 'armored' ? 28 : 20);
            continue;
          }

          if (c.y > h + 45) {
            eng.chickens.splice(i, 1);
          }
        }

        // Update Meteors
        for (let i = eng.meteors.length - 1; i >= 0; i--) {
          const m = eng.meteors[i];
          m.update();
          m.draw(ctx);

          if (Math.hypot(m.x - p.x, m.y - p.y) < m.radius + p.radius - 4) {
            spawnParticles(m.x, m.y, '#94a3b8', 18, 'rock');
            eng.meteors.splice(i, 1);
            handlePlayerDamage(28);
            continue;
          }

          if (m.y > h + 60) {
            eng.meteors.splice(i, 1);
          }
        }

        // Update Eggs
        for (let i = eng.eggs.length - 1; i >= 0; i--) {
          const eg = eng.eggs[i];
          eg.update();
          eg.draw(ctx);

          if (Math.hypot(eg.x - p.x, eg.y - p.y) < eg.radius + p.radius - 4) {
            spawnParticles(eg.x, eg.y, '#fef08a', 10, 'spark');
            eng.eggs.splice(i, 1);
            handlePlayerDamage(15);
            continue;
          }

          if (eg.y > h + 30 || eg.x < -30 || eg.x > w + 30) {
            eng.eggs.splice(i, 1);
          }
        }

        // Update Drops
        for (let i = eng.drops.length - 1; i >= 0; i--) {
          const d = eng.drops[i];
          d.update();
          d.draw(ctx);

          if (Math.hypot(d.x - p.x, d.y - p.y) < d.radius + p.radius) {
            soundFX.playPowerUp();
            if (d.kind === 'WEAPON') {
              if (p.weaponTier < 10) {
                p.weaponTier += 1;
                eng.configuredTier = p.weaponTier;
                setWeaponTier(p.weaponTier);
                eng.floatTexts.push(
                  new FloatingText(p.x, p.y - 26, `NÂNG ĐẠN CẤP ${p.weaponTier}!`, '#facc15')
                );
              } else {
                eng.score += 120;
                eng.floatTexts.push(
                  new FloatingText(p.x, p.y - 26, 'ĐẠN TỐI ĐA +120 ĐIỂM', '#facc15')
                );
              }
            } else if (d.kind === 'HEAL') {
              const healAmount = p.shipId === 'valkyrie' ? 45 : 30;
              p.hp = Math.min(p.maxHp, p.hp + healAmount);
              eng.floatTexts.push(
                new FloatingText(p.x, p.y - 26, `+${healAmount} HP`, '#22c55e')
              );
            } else {
              p.shield = true;
              eng.floatTexts.push(new FloatingText(p.x, p.y - 26, 'BẬT LÁ CHẮN!', '#38bdf8'));
            }
            eng.drops.splice(i, 1);
            syncHudState();
            continue;
          }

          if (d.y > h + 30) {
            eng.drops.splice(i, 1);
          }
        }

        // Update Magnetized Bonus Stars (★) from Boss Defeat
        for (let i = eng.bonusStars.length - 1; i >= 0; i--) {
          const st = eng.bonusStars[i];
          st.update(p.x, p.y);
          st.draw(ctx);

          if (Math.hypot(st.x - p.x, st.y - p.y) < st.radius + p.radius + 6) {
            eng.score += st.points;
            soundFX.playStarCollect();
            spawnParticles(st.x, st.y, '#fde047', 6, 'spark');
            eng.floatTexts.push(
              new FloatingText(p.x + (Math.random() - 0.5) * 30, p.y - 24, `+${st.points} ★`, '#fde047')
            );
            eng.bonusStars.splice(i, 1);
            syncHudState();
          }
        }

        // Rings, Particles & Floating Texts
        for (let i = eng.rings.length - 1; i >= 0; i--) {
          const r = eng.rings[i];
          r.update();
          r.draw(ctx);
          if (r.alpha <= 0) eng.rings.splice(i, 1);
        }

        for (let i = eng.particles.length - 1; i >= 0; i--) {
          const pt = eng.particles[i];
          pt.update();
          pt.draw(ctx);
          if (pt.alpha <= 0) eng.particles.splice(i, 1);
        }

        for (let i = eng.floatTexts.length - 1; i >= 0; i--) {
          const ft = eng.floatTexts[i];
          ft.update();
          ft.draw(ctx);
          if (ft.alpha <= 0) eng.floatTexts.splice(i, 1);
        }

        // Level Banner Overlay
        if (eng.levelBannerTimer > 0) {
          eng.levelBannerTimer--;
          ctx.save();
          ctx.globalAlpha = Math.min(1, eng.levelBannerTimer / 25);
          ctx.font = '900 32px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#0284c7';
          ctx.fillText(`CẤP ĐỘ ${eng.level} / ${MAX_LEVEL}`, w / 2, h * 0.34);
          ctx.font = '700 15px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(
            eng.level >= 3
              ? 'Cảnh giác: Gà Giáp Thép & Gà Xạ Thủ bắn trứng 3 tia đã tham chiến!'
              : 'Tiêu diệt đội hình gà xâm lược để triệu hồi Trùm Gà Chúa!',
            w / 2,
            h * 0.34 + 32
          );
          ctx.restore();
        }

        // Boss Defeat Reward Banner
        if (eng.bossRewardBannerTimer > 0) {
          eng.bossRewardBannerTimer--;
          ctx.save();
          ctx.globalAlpha = Math.min(1, eng.bossRewardBannerTimer / 30);
          ctx.font = '800 18px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#ca8a04';
          ctx.fillText(
            '★ THƯỞNG DIỆT TRÙM: MƯA SAO ĐIỂM THƯỞNG · +1 CẤP ĐẠN · BẬT LÁ CHẮN · +40% HP ★',
            w / 2,
            h * 0.24
          );
          ctx.restore();
        }
      } else if (eng.state === 'PAUSED' && eng.player) {
        eng.player.draw(ctx);
        eng.boss?.draw(ctx);
        eng.chickens.forEach((c) => c.draw(ctx));
        eng.meteors.forEach((m) => m.draw(ctx));
        eng.bullets.forEach((b) => b.draw(ctx));
        eng.eggs.forEach((e) => e.draw(ctx));
        eng.drops.forEach((d) => d.draw(ctx));
        eng.bonusStars.forEach((s) => s.draw(ctx));
      }

      ctx.restore();
      eng.animId = requestAnimationFrame(renderLoop);
    };

    eng.animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(eng.animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const eng = engineRef.current;
    eng.pointerActive = true;
    eng.pointerX = e.clientX - rect.left;
    eng.pointerY = e.clientY - rect.top;

    // Nhấp chuột trái trên PC hoặc Chạm (Tap) trên Điện thoại/Máy tính bảng để bắn đạn
    if (e.pointerType !== 'mouse' || e.button === 0) {
      eng.isFiringPointer = true;
      if (eng.state === 'PLAYING') {
        eng.manualShotQueued = true;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    if (e.buttons === 0 && e.pointerType === 'mouse') {
      eng.isFiringPointer = false;
      const cvs = canvasRef.current;
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();
      eng.pointerActive = true;
      eng.pointerX = e.clientX - rect.left;
      eng.pointerY = e.clientY - rect.top;
      return;
    }
    if (!eng.pointerActive) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    eng.pointerX = e.clientX - rect.left;
    eng.pointerY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    engineRef.current.pointerActive = false;
    engineRef.current.isFiringPointer = false;
  };

  const hpPercent = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const bossPercent = Math.max(0, Math.min(100, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100));
  const wavePercent = Math.max(0, Math.min(100, (hud.waveProgress / Math.max(1, hud.waveTarget)) * 100));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 select-none">
      {/* Full-Screen 100vw x 100vh Combat Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="fixed inset-0 w-full h-full block cursor-crosshair touch-none"
      />

      {/* TOP GLASS HUD (Viền trên màn hình) */}
      <header className="fixed top-0 inset-x-0 z-20 px-3 py-2 bg-slate-950/75 backdrop-blur-md border-b border-cyan-500/25">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand + Player HP + Shield */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Rocket className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-black text-xs md:text-sm tracking-wider uppercase text-white leading-none">
                  Chiến Binh Không Gian
                </div>
                <div className="text-[11px] text-cyan-300/85 font-medium mt-0.5">
                  {SHIPS[hud.shipId].name} · {AMMO_TYPES[hud.ammoId].name}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2.5 bg-slate-900/85 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="w-28 sm:w-36">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-300">HP Chiến Cơ</span>
                  <span className="font-display text-white tabular-nums">
                    {hud.hp} / {hud.maxHp}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      hpPercent > 50
                        ? 'bg-emerald-400'
                        : hpPercent > 25
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              <span
                className={`text-[11px] font-display font-bold px-2 py-0.5 rounded-md border ${
                  hud.shield
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {hud.shield ? 'LÁ CHẮN: BẬT' : 'LÁ CHẮN: TẮT'}
              </span>

              {/* 3 Lives Indicator (Hệ thống 3 Mạng trên Glass HUD) */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((idx) => (
                    <Heart
                      key={idx}
                      className={`w-3.5 h-3.5 transition-all ${
                        idx <= hud.lives
                          ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-display text-xs font-black text-rose-300 tabular-nums">
                  ♥ x{hud.lives}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Level 1-10 + Wave / Boss Progress + Score & High Score */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="bg-slate-900/85 border border-slate-800 px-3 py-1.5 rounded-xl min-w-[165px] sm:min-w-[210px]">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="font-display text-cyan-300 uppercase">
                  Cấp Độ {hud.level} / {MAX_LEVEL}
                </span>
                <span className="text-slate-400 tabular-nums">
                  {hud.bossActive ? 'ĐANG ĐẤU TRÙM!' : `Tiến độ Trùm: ${Math.round(wavePercent)}%`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    hud.bossActive
                      ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                      : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                  }`}
                  style={{ width: `${hud.bossActive ? bossPercent : wavePercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/85 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Điểm Số</div>
                <div className="font-display text-sm md:text-base font-black text-amber-300 tabular-nums leading-tight">
                  {hud.score.toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> Kỷ Lục
                </div>
                <div className="font-display text-sm md:text-base font-black text-cyan-300 tabular-nums leading-tight">
                  {hud.highScore.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons (Tạm dừng, Âm thanh, Cài Đặt & Xưởng) */}
          <div className="flex items-center gap-2">
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <button
                type="button"
                onClick={togglePause}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-display font-bold uppercase tracking-wider text-slate-100 transition cursor-pointer"
              >
                {gameState === 'PAUSED' ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden md:inline">Tiếp Tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden md:inline">Tạm Dừng</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-display font-bold uppercase tracking-wider text-slate-100 transition cursor-pointer"
              title="Bật / Tắt Âm thanh"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="hidden lg:inline">{soundOn ? 'Âm Thanh' : 'Tắt Tiếng'}</span>
            </button>

            <button
              type="button"
              onClick={openHangarAndSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-display font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.2)] transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span>Cài Đặt & Xưởng</span>
            </button>
          </div>
        </div>

        {/* Dedicated Boss Health Bar when Boss is Active */}
        {hud.bossActive && (
          <div className="max-w-xl mx-auto mt-1.5 px-3 py-1 rounded-lg bg-rose-950/85 border border-rose-500/50 flex items-center gap-3">
            <span className="font-display text-[11px] font-black uppercase tracking-wider text-rose-200 shrink-0">
              TRÙM GÀ CHÚA CẤP {hud.level}
            </span>
            <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300 transition-all duration-100"
                style={{ width: `${bossPercent}%` }}
              />
            </div>
            <span className="font-display text-[11px] font-bold text-rose-200 tabular-nums shrink-0">
              {hud.bossHp} / {hud.bossMaxHp}
            </span>
          </div>
        )}
      </header>

      {/* BOTTOM COLLAPSIBLE QUICK-SWITCH BAR (Thanh chuyển nhanh có nút Thu gọn / Mở rộng) */}
      <div className="fixed bottom-0 inset-x-0 z-20 flex flex-col items-center pointer-events-none">
        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setBottomDockCollapsed((prev) => !prev)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1 rounded-t-xl bg-slate-950/90 hover:bg-slate-900 border border-b-0 border-cyan-500/30 text-[11px] font-display font-bold uppercase tracking-wider text-cyan-300 transition cursor-pointer"
        >
          {bottomDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Mở Rộng Thanh Tác Chiến Nhanh
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Thu Gọn Thanh Tác Chiến
            </>
          )}
        </button>

        {!bottomDockCollapsed && (
          <div className="pointer-events-auto w-full bg-slate-950/80 backdrop-blur-md border-t border-cyan-500/25 px-3 py-2">
            <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
              {/* Quick Ship Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-display font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" /> Chiến Cơ:
                </span>
                {SHIP_ORDER.map((id) => {
                  const ship = SHIPS[id];
                  const active = hud.shipId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyShipChoice(id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer border ${
                        active
                          ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {ship.name}
                    </button>
                  );
                })}
              </div>

              {/* Quick Ammo Switcher (Keys 1-4) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-display font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" /> Loại Đạn:
                </span>
                {AMMO_ORDER.map((id) => {
                  const ammo = AMMO_TYPES[id];
                  const active = hud.ammoId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyAmmoChoice(id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                        active
                          ? 'bg-amber-500/25 border-amber-400 text-white shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ammo.color }}
                      />
                      <span>
                        [{ammo.hotkey}] {ammo.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Tier Switcher (1-10) */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-display font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> Cấp Đạn:
                </span>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => {
                  const active = hud.weaponTier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => applyTierChoice(t)}
                      className={`w-7 h-7 rounded-lg font-display font-black text-xs transition cursor-pointer tabular-nums border ${
                        active
                          ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.45)]'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* START OVERLAY */}
      {gameState === 'START' && !showHangarModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900/95 border border-cyan-500/35 p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.9)] text-center">
            <div className="text-xs font-display font-bold uppercase tracking-widest text-cyan-300 mb-2">
              Chiến Trường Không Gian Toàn Màn Hình · 10 Cấp Độ · 4 Chiến Cơ · 4 Hệ Đạn
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-3">
              Chiến Binh Không Gian
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-6">
              Điều khiển phi thuyền tiêu diệt binh đoàn Gà Giáp Thép, Gà Xạ Thủ và Trùm Gà Chúa Vũ Trụ. Hạ gục Trùm cuối mỗi màn để tắm mưa Sao Điểm Thưởng (★), tự động nâng +1 Cấp Đạn, bật Lá Chắn và hồi 40% HP!
            </p>

            {/* Current Loadout Preview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 rounded-lg border border-slate-800 p-1">
                  <ShipPreviewCanvas shipId={selectedShip} active={true} size={64} />
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-400">Chiến cơ xuất kích</div>
                  <div className="font-display font-bold text-sm text-white">
                    {SHIPS[selectedShip].name}
                  </div>
                  <div className="text-xs text-cyan-300">{SHIPS[selectedShip].maxHp} HP tối đa</div>
                </div>
              </div>

              <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-[11px] uppercase text-slate-400">Loại đạn đang nạp</div>
                <div className="font-display font-bold text-sm text-amber-300">
                  [{AMMO_TYPES[selectedAmmo].hotkey}] {AMMO_TYPES[selectedAmmo].name}
                </div>
                <div className="text-xs text-slate-300">{AMMO_TYPES[selectedAmmo].badge}</div>
              </div>

              <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-[11px] uppercase text-slate-400">Cấp độ hỏa lực khởi đầu</div>
                <div className="font-display font-black text-base text-emerald-400 tabular-nums">
                  CẤP ĐẠN {weaponTier} / 10
                </div>
                <div className="text-xs text-slate-400">
                  Kỷ lục: {hud.highScore.toLocaleString('vi-VN')} điểm
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_30px_rgba(34,211,238,0.45)] transition cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                Xuất Kích Chiến Đấu Ngay
              </button>

              <button
                type="button"
                onClick={() => setShowHangarModal(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-200 font-display font-bold text-sm uppercase tracking-wider transition cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Mở Cài Đặt & Xưởng Chiến Cơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED OVERLAY (When Hangar modal is closed) */}
      {gameState === 'PAUSED' && !showHangarModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900/95 border border-cyan-500/35 p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-black uppercase text-white mb-2">
              Tạm Dừng Chiến Trường
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Tiếp tục trận đánh hiện tại hoặc chọn Thoát / Quay lại Xưởng (tiến độ lượt chơi này sẽ được reset về Level 1, Điểm số về 0).
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={togglePause}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-display font-black uppercase tracking-wider cursor-pointer"
              >
                Tiếp Tục Chiến Đấu
              </button>
              <button
                type="button"
                onClick={exitToHangarWithReset}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-200 font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Thoát / Quay Lại Xưởng Chiến Cơ
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Chơi Lại Từ Đầu (Level 1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {gameState === 'GAMEOVER' && !showHangarModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 border border-rose-500/40 p-6 md:p-8 text-center shadow-2xl">
            <div className="text-xs font-display font-bold uppercase tracking-widest text-rose-400 mb-1">
              Đã Mất Hết 3 Mạng (♥ x0) Tại Cấp Độ {hud.level}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white mb-2">
              Nhiệm Vụ Thất Bại
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-5">
              Toàn bộ tiến độ chiến dịch đã được đặt lại về Cấp Độ 1 và Cấp Đạn 1. Điểm kỷ lục cao nhất của bạn vẫn được bảo toàn!
            </p>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4 mb-6">
              <div>
                <div className="text-xs text-slate-400">Điểm Trận Này</div>
                <div className="font-display text-2xl font-black text-amber-300 tabular-nums">
                  {hud.score.toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="border-l border-slate-800">
                <div className="text-xs text-slate-400">Kỷ Lục Cao Nhất</div>
                <div className="font-display text-2xl font-black text-cyan-300 tabular-nums">
                  {hud.highScore.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Chơi Lại Từ Đầu (3 Mạng)
              </button>
              <button
                type="button"
                onClick={exitToHangarWithReset}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Quay Lại Xưởng Chiến Cơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-LEVEL VICTORY OVERLAY (With Fireworks & Confetti Rain running behind on Canvas) */}
      {gameState === 'VICTORY' && !showHangarModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900/90 border-2 border-amber-400/70 p-6 md:p-8 text-center shadow-[0_0_70px_rgba(250,204,21,0.35)]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-200 font-display text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Chiến Thắng Toàn Diện 10 / 10 Cấp Độ
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-cyan-300 mb-3">
              Huyền Thoại Ngân Hà!
            </h2>
            <p className="text-sm sm:text-base text-slate-200 mb-6">
              Chúc mừng Chỉ Huy! Bạn đã quét sạch toàn bộ 10 cấp độ Gà Vũ Trụ và tiêu diệt Trùm Gà Chúa Tối Thượng trong tiếng pháo hoa tung hô rực rỡ!
            </p>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/90 border border-amber-400/30 rounded-xl p-4 mb-6">
              <div>
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Tổng Điểm Chung Cuộc
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-amber-300 tabular-nums mt-0.5">
                  {hud.score.toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="border-l border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" /> Kỷ Lục Lưu Trữ
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-cyan-300 tabular-nums mt-0.5">
                  {hud.highScore.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={exitToHangarWithReset}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-display font-black uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.5)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Hoàn Thành Chiến Dịch
              </button>
              <button
                type="button"
                onClick={exitToHangarWithReset}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/40 text-cyan-200 font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Chơi Lại Từ Đầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HANGAR & SETTINGS MODAL (100% Button-Controlled) */}
      {showHangarModal && (
        <HangarModal
          selectedShip={selectedShip}
          selectedAmmo={selectedAmmo}
          weaponTier={weaponTier}
          soundOn={soundOn}
          isGameActive={gameState === 'PLAYING' || gameState === 'PAUSED'}
          onSelectShip={applyShipChoice}
          onSelectAmmo={applyAmmoChoice}
          onChangeTier={applyTierChoice}
          onToggleSound={toggleSound}
          onRestart={startNewGame}
          onExitAndReset={exitToHangarWithReset}
          onClose={closeHangarAndResume}
        />
      )}
    </div>
  );
}
