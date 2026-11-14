import { AmmoId, AMMO_TYPES, ShipId, SHIPS } from '../types/game';
import { drawShipHull } from './shipRenderer';
import { soundFX } from './sound';

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  coreColor: string;
  damage: number;
  ammoId: AmmoId;
  pierceLeft: number;
  slowFactor: number;
  spin = 0;
  hitIds = new Set<number>();

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    baseDamage: number,
    ammoId: AmmoId,
    tier: number
  ) {
    const spec = AMMO_TYPES[ammoId];
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ammoId = ammoId;
    this.color = spec.color;
    this.coreColor = spec.coreColor;
    this.damage = baseDamage * spec.damageMult * (1 + (tier - 1) * 0.07);
    this.pierceLeft = spec.pierceCount;
    this.slowFactor = spec.slowFactor;
    this.radius =
      ammoId === 'plasma' ? 8.5 : ammoId === 'cryo' ? 11.5 : ammoId === 'shuriken' ? 9.5 : 5.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.spin += 0.28;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;

    if (this.ammoId === 'laser') {
      const ang = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      ctx.rotate(ang);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-3.2, -14, 6.4, 24, 3);
      ctx.fill();
      ctx.fillStyle = this.coreColor;
      ctx.beginPath();
      ctx.roundRect(-1.4, -12, 2.8, 19, 1.5);
      ctx.fill();
    } else if (this.ammoId === 'plasma') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.coreColor;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.52, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.ammoId === 'cryo') {
      const ang = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      ctx.rotate(ang);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 4, this.radius, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.strokeStyle = this.coreColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 4, this.radius - 1.5, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    } else {
      ctx.rotate(this.spin);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
        ctx.lineTo(
          Math.cos(a + Math.PI / 4) * (this.radius * 0.36),
          Math.sin(a + Math.PI / 4) * (this.radius * 0.36)
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this.coreColor;
      ctx.beginPath();
      ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class PlayerShip {
  x: number;
  y: number;
  radius = 22;
  shipId: ShipId;
  ammoId: AmmoId;
  speed: number;
  hp: number;
  maxHp: number;
  weaponTier: number;
  shield = false;
  lastShot = 0;
  baseShotDelay: number;
  baseDamage: number;
  thrusterPhase = 0;
  damageFlashUntil = 0;
  invulnerableUntil = 0;
  magnetUntil = 0;

  constructor(w: number, h: number, shipId: ShipId, ammoId: AmmoId, startTier: number) {
    this.x = w / 2;
    this.y = h - 95;
    this.shipId = shipId;
    this.ammoId = ammoId;
    this.weaponTier = Math.max(1, Math.min(10, startTier));

    const spec = SHIPS[shipId];
    this.speed = spec.speed;
    this.maxHp = spec.maxHp;
    this.hp = spec.maxHp;
    this.baseShotDelay = spec.fireDelay;
    this.baseDamage = spec.baseDamage;
    this.shield = shipId === 'titan';
  }

  applyShip(shipId: ShipId) {
    const ratio = this.hp / Math.max(1, this.maxHp);
    this.shipId = shipId;
    const spec = SHIPS[shipId];
    this.speed = spec.speed;
    this.maxHp = spec.maxHp;
    this.hp = Math.max(1, Math.round(spec.maxHp * ratio));
    this.baseShotDelay = spec.fireDelay;
    this.baseDamage = spec.baseDamage;
  }

  triggerDamageFlash(durationMs = 650) {
    this.damageFlashUntil = Math.max(this.damageFlashUntil, performance.now() + durationMs);
  }

  triggerRespawnInvulnerability(durationMs = 2000) {
    const until = performance.now() + durationMs;
    this.invulnerableUntil = until;
    this.damageFlashUntil = until;
  }

  isInvulnerable() {
    return performance.now() < this.invulnerableUntil;
  }

  activateMagnet(durationMs = 10000) {
    this.magnetUntil = performance.now() + durationMs;
  }

  isMagnetActive() {
    return performance.now() < this.magnetUntil;
  }

  getMagnetRemainingSec() {
    return Math.max(0, Math.ceil((this.magnetUntil - performance.now()) / 1000));
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.thrusterPhase += 0.25;
    const now = performance.now();
    const isFlashing = now < this.damageFlashUntil;

    ctx.save();
    // Vòng từ trường Nam Châm khi đang kích hoạt
    if (now < this.magnetUntil) {
      ctx.save();
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 46 + Math.sin(this.thrusterPhase) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (isFlashing) {
      const blinkCycle = Math.floor((this.damageFlashUntil - now) / 60) % 2 === 0;
      ctx.globalAlpha = blinkCycle ? 0.22 : 0.92;
    }
    drawShipHull(ctx, this.shipId, this.x, this.y, 1, this.thrusterPhase, this.shield);
    ctx.restore();
  }

  shoot(now: number, bullets: Bullet[]) {
    const ammoSpec = AMMO_TYPES[this.ammoId];
    const tierSpeedBonus = Math.max(0.7, 1 - (this.weaponTier - 1) * 0.025);
    const effectiveDelay = this.baseShotDelay * ammoSpec.fireDelayMult * tierSpeedBonus;
    if (now - this.lastShot < effectiveDelay) return;

    this.lastShot = now;
    soundFX.playShot(this.ammoId);

    const spd = ammoSpec.speed;
    const dmg = this.baseDamage;
    const t = this.weaponTier;
    const id = this.ammoId;

    const add = (ox: number, oy: number, vx: number, vy: number) => {
      bullets.push(new Bullet(this.x + ox, this.y + oy, vx, vy, dmg, id, t));
    };

    const s1 = spd * 0.14;
    const s2 = spd * 0.28;
    const s3 = spd * 0.42;
    const s4 = spd * 0.56;

    switch (t) {
      case 1:
        add(0, -28, 0, -spd);
        break;
      case 2:
        add(-11, -22, 0, -spd);
        add(11, -22, 0, -spd);
        break;
      case 3:
        add(0, -28, 0, -spd);
        add(-15, -18, -s1, -spd * 0.98);
        add(15, -18, s1, -spd * 0.98);
        break;
      case 4:
        add(-8, -26, 0, -spd);
        add(8, -26, 0, -spd);
        add(-20, -16, -s1 * 1.15, -spd * 0.97);
        add(20, -16, s1 * 1.15, -spd * 0.97);
        break;
      case 5:
        add(0, -30, 0, -spd);
        add(-12, -24, -s1 * 0.8, -spd * 0.99);
        add(12, -24, s1 * 0.8, -spd * 0.99);
        add(-24, -14, -s2, -spd * 0.95);
        add(24, -14, s2, -spd * 0.95);
        break;
      case 6:
        add(-7, -28, 0, -spd);
        add(7, -28, 0, -spd);
        add(-18, -20, -s1, -spd * 0.98);
        add(18, -20, s1, -spd * 0.98);
        add(-28, -12, -s2 * 1.1, -spd * 0.94);
        add(28, -12, s2 * 1.1, -spd * 0.94);
        break;
      case 7:
        add(0, -30, 0, -spd * 1.04);
        add(-10, -26, -s1 * 0.65, -spd);
        add(10, -26, s1 * 0.65, -spd);
        add(-20, -18, -s2 * 0.9, -spd * 0.96);
        add(20, -18, s2 * 0.9, -spd * 0.96);
        add(-30, -10, -s3, -spd * 0.91);
        add(30, -10, s3, -spd * 0.91);
        break;
      case 8:
        add(-6, -30, 0, -spd * 1.04);
        add(6, -30, 0, -spd * 1.04);
        add(-16, -24, -s1, -spd * 0.99);
        add(16, -24, s1, -spd * 0.99);
        add(-26, -16, -s2, -spd * 0.95);
        add(26, -16, s2, -spd * 0.95);
        add(-34, -8, -s3 * 1.1, -spd * 0.89);
        add(34, -8, s3 * 1.1, -spd * 0.89);
        break;
      case 9:
        add(0, -32, 0, -spd * 1.06);
        add(-10, -28, -s1 * 0.6, -spd * 1.02);
        add(10, -28, s1 * 0.6, -spd * 1.02);
        add(-20, -22, -s2 * 0.85, -spd * 0.97);
        add(20, -22, s2 * 0.85, -spd * 0.97);
        add(-30, -14, -s3, -spd * 0.92);
        add(30, -14, s3, -spd * 0.92);
        add(-36, 4, -s4, -spd * 0.72);
        add(36, 4, s4, -spd * 0.72);
        break;
      default:
        add(-6, -32, 0, -spd * 1.08);
        add(6, -32, 0, -spd * 1.08);
        add(-16, -26, -s1 * 0.85, -spd * 1.02);
        add(16, -26, s1 * 0.85, -spd * 1.02);
        add(-26, -18, -s2, -spd * 0.96);
        add(26, -18, s2, -spd * 0.96);
        add(-34, -8, -s3 * 1.05, -spd * 0.9);
        add(34, -8, s3 * 1.05, -spd * 0.9);
        add(-28, 12, -s4 * 0.9, spd * 0.55);
        add(28, 12, s4 * 0.9, spd * 0.55);
        break;
    }
  }
}

export class EggProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 6.5;
  isBossHell: boolean;

  constructor(x: number, y: number, vy: number, vx = 0, isBossHell = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isBossHell = isBossHell;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.isBossHell ? '#fca5a5' : '#fef9c3';
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.isBossHell ? '#ef4444' : '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.2, 7.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let NEXT_ENEMY_ID = 1;

export type ChickenVariant =
  | 'normal'
  | 'armored'
  | 'sniper'
  | 'kamikaze'
  | 'splitter'
  | 'mini_split';

export class ChickenEnemy {
  id = NEXT_ENEMY_ID++;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  radius = 21;
  speed: number;
  hp: number;
  maxHp: number;
  wingAngle = Math.random() * Math.PI * 2;
  swayOffset = Math.random() * Math.PI * 2;
  bodyColor: string;
  chillTimer = 0;
  slowMult = 1;
  variant: ChickenVariant;
  scoreValue: number;

  constructor(
    w: number,
    level: number,
    forcedVariant?: ChickenVariant,
    spawnX?: number,
    spawnY?: number,
    initialVx = 0
  ) {
    this.x = spawnX !== undefined ? spawnX : Math.random() * (w - 80) + 40;
    this.y = spawnY !== undefined ? spawnY : -35;
    this.vx = initialVx;

    if (forcedVariant) {
      this.variant = forcedVariant;
    } else {
      const roll = Math.random();
      if (level >= 11 && roll < 0.22) {
        this.variant = 'kamikaze';
      } else if (level >= 11 && roll < 0.42) {
        this.variant = 'splitter';
      } else if (level >= 3 && roll < Math.min(0.64, 0.14 + level * 0.02)) {
        this.variant = 'sniper';
      } else if (level >= 2 && roll < Math.min(0.82, 0.24 + level * 0.025)) {
        this.variant = 'armored';
      } else {
        this.variant = 'normal';
      }
    }

    const baseSpeed = (Math.random() * 0.85 + 1.05) * (1 + (level - 1) * 0.065);
    const baseHp = 18 + (level - 1) * 7.5;

    if (this.variant === 'kamikaze') {
      // Gà Cảm Tử: Nhỏ, siêu nhanh, lao thẳng vào vị trí người chơi
      this.radius = 15;
      this.speed = baseSpeed * 2.15;
      this.maxHp = Math.round(baseHp * 0.85);
      this.bodyColor = '#ef4444';
      this.scoreValue = 55 + level * 8;
    } else if (this.variant === 'splitter') {
      // Gà Phân Bào: Béo, khi nổ tách thành 2 gà con bay chéo
      this.radius = 28;
      this.speed = baseSpeed * 0.76;
      this.maxHp = Math.round(baseHp * 2.2);
      this.bodyColor = '#f59e0b';
      this.scoreValue = 60 + level * 9;
    } else if (this.variant === 'mini_split') {
      // Gà Con Phân Bào
      this.radius = 14;
      this.speed = baseSpeed * 1.35;
      this.vy = -1.8;
      this.maxHp = Math.round(baseHp * 0.65);
      this.bodyColor = '#fde047';
      this.scoreValue = 30 + level * 5;
    } else if (this.variant === 'armored') {
      this.radius = 25;
      this.speed = baseSpeed * 0.78;
      this.maxHp = Math.round(baseHp * 2.45);
      this.bodyColor = '#94a3b8';
      this.scoreValue = 45 + level * 8;
    } else if (this.variant === 'sniper') {
      this.radius = 21;
      this.speed = baseSpeed * 1.12;
      this.maxHp = Math.round(baseHp * 1.35);
      this.bodyColor = '#c084fc';
      this.scoreValue = 40 + level * 7;
    } else {
      this.radius = 21;
      this.speed = baseSpeed;
      this.maxHp = baseHp;
      const palette = ['#fb923c', '#f472b6', '#facc15', '#a78bfa', '#34d399'];
      this.bodyColor = palette[Math.floor(Math.random() * palette.length)];
      this.scoreValue = 20 + level * 5;
    }

    this.hp = this.maxHp;
  }

  applyChill(factor: number) {
    this.chillTimer = 110;
    this.slowMult = factor;
  }

  update(w: number, eggs: EggProjectile[], level: number, playerX: number, playerY: number) {
    if (this.chillTimer > 0) {
      this.chillTimer--;
      if (this.chillTimer <= 0) this.slowMult = 1;
    }
    const eff = this.chillTimer > 0 ? this.slowMult : 1;
    this.wingAngle += 0.25 * eff;

    if (this.variant === 'kamikaze') {
      // Lao thẳng vào vị trí người chơi
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const targetVx = (dx / dist) * this.speed * eff;
      const targetVy = Math.max(1.8 * eff, (dy / dist) * this.speed * eff);
      this.vx = this.vx * 0.9 + targetVx * 0.1;
      this.vy = this.vy * 0.9 + targetVy * 0.1;
      this.x += this.vx;
      this.y += this.vy;
      return;
    }

    if (this.variant === 'mini_split') {
      this.vy = Math.min(this.speed * eff, this.vy + 0.14 * eff);
      this.vx *= 0.985;
      this.x += this.vx * eff;
      this.y += this.vy;
      if (this.x < this.radius + 10 || this.x > w - this.radius - 10) {
        this.vx *= -1;
      }
      return;
    }

    this.y += this.speed * eff;
    this.x += Math.sin(this.y * 0.03 + this.swayOffset) * 1.2 * eff;
    this.x = Math.max(this.radius + 8, Math.min(w - this.radius - 8, this.x));

    const eggChance = (0.0018 + level * 0.00038) * eff;
    if (Math.random() < eggChance) {
      const vy = 3.6 + level * 0.22;
      if (this.variant === 'sniper') {
        eggs.push(new EggProjectile(this.x, this.y + 16, vy, -1.55));
        eggs.push(new EggProjectile(this.x, this.y + 18, vy * 1.05, 0));
        eggs.push(new EggProjectile(this.x, this.y + 16, vy, 1.55));
      } else {
        eggs.push(new EggProjectile(this.x, this.y + 16, vy, 0));
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const scale =
      this.variant === 'kamikaze'
        ? 0.76
        : this.variant === 'mini_split'
          ? 0.72
          : this.variant === 'splitter'
            ? 1.28
            : 1;
    ctx.scale(scale, scale);

    const wingY = Math.sin(this.wingAngle) * 6;
    const mainColor = this.chillTimer > 0 ? '#67e8f9' : this.bodyColor;

    if (this.variant === 'kamikaze') {
      // Lửa phản lực cảm tử phía sau
      ctx.fillStyle = '#f97316';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-6, -16);
      ctx.lineTo(0, -32 - Math.random() * 8);
      ctx.lineTo(6, -16);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Wings
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(-17, wingY, 10, 5.5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(17, wingY, 10, 5.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    if (this.variant === 'splitter') {
      // Vòng vạch phân bào cảnh báo trên bụng Gà Phân Bào
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.variant === 'armored') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -4, 19, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      [-10, 0, 10].forEach((rx) => {
        ctx.beginPath();
        ctx.arc(rx, -9, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (this.variant === 'kamikaze') {
      // Băng đô cảm tử đỏ rực
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-15, -11, 30, 5);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -8.5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-4, -18, 4.5, 0, Math.PI * 2);
      ctx.arc(2, -20, 5.5, 0, Math.PI * 2);
      ctx.arc(7, -17, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.variant === 'sniper') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-13, -7, 26, 7);
      ctx.fillStyle = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f43f5e';
      ctx.fillRect(-10, -5.5, 20, 4);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -4, 4, 0, Math.PI * 2);
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, -4, 2, 0, Math.PI * 2);
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beak
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(5, 2);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // HP bar if damaged
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(-16, -30, 32, 4.5);
      ctx.fillStyle =
        this.variant === 'armored'
          ? '#38bdf8'
          : this.variant === 'sniper'
            ? '#e879f9'
            : this.variant === 'splitter'
              ? '#f59e0b'
              : '#22c55e';
      ctx.fillRect(-16, -30, (this.hp / this.maxHp) * 32, 4.5);
    }

    ctx.restore();
  }
}

export class MeteorObstacle {
  id = NEXT_ENEMY_ID++;
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  rot = 0;
  rotSpeed: number;
  vertices: { r: number; a: number }[] = [];
  chillTimer = 0;
  slowMult = 1;

  constructor(w: number, level: number) {
    this.radius = Math.random() * 14 + 20;
    this.x = Math.random() * (w - 80) + 40;
    this.y = -this.radius - 15;
    this.speed = (Math.random() * 1.4 + 1.4) * (1 + (level - 1) * 0.06);
    this.maxHp = Math.round(this.radius * (1.8 + level * 0.22));
    this.hp = this.maxHp;
    this.rotSpeed = (Math.random() - 0.5) * 0.06;

    const count = 8;
    for (let i = 0; i < count; i++) {
      this.vertices.push({
        a: (i * Math.PI * 2) / count,
        r: this.radius * (0.78 + Math.random() * 0.3),
      });
    }
  }

  applyChill(factor: number) {
    this.chillTimer = 95;
    this.slowMult = factor;
  }

  update() {
    if (this.chillTimer > 0) {
      this.chillTimer--;
      if (this.chillTimer <= 0) this.slowMult = 1;
    }
    const eff = this.chillTimer > 0 ? this.slowMult : 1;
    this.y += this.speed * eff;
    this.rot += this.rotSpeed * eff;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = this.chillTimer > 0 ? '#0e7490' : '#475569';
    ctx.strokeStyle = this.chillTimer > 0 ? '#67e8f9' : '#94a3b8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    this.vertices.forEach((v, idx) => {
      const px = Math.cos(v.a) * v.r;
      const py = Math.sin(v.a) * v.r;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.25, -this.radius * 0.2, this.radius * 0.22, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.25, this.radius * 0.22, this.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Mưa Thiên Thạch Lửa (Xuất hiện từ Level 11 trở đi): Bay chéo tốc độ cao, KHÔNG THỂ BẮN VỠ
export class FireMeteorObstacle {
  id = NEXT_ENEMY_ID++;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rot = 0;
  rotSpeed: number;

  constructor(w: number, level: number) {
    this.radius = Math.random() * 8 + 20;
    const fromLeft = Math.random() < 0.5;
    this.x = fromLeft ? Math.random() * (w * 0.5) : w * 0.5 + Math.random() * (w * 0.5);
    this.y = -this.radius - 20;
    const spd = 6.2 + (level - 10) * 0.28;
    const angle = fromLeft
      ? Math.PI * (0.32 + Math.random() * 0.1)
      : Math.PI * (0.58 + Math.random() * 0.1);
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.rotSpeed = (Math.random() - 0.5) * 0.14;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotSpeed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Đuôi lửa thiên thạch bất khả xâm phạm
    const tailAngle = Math.atan2(-this.vy, -this.vx);
    ctx.save();
    ctx.rotate(tailAngle);
    const grad = ctx.createLinearGradient(0, 0, this.radius * 3.4, 0);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.95)');
    grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.55)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.85);
    ctx.lineTo(this.radius * 3.4, 0);
    ctx.lineTo(0, this.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.rotate(this.rot);
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      const r = this.radius * (i % 2 === 0 ? 1 : 0.82);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lõi nham thạch nóng chảy
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-4, -3, this.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class BossChicken {
  id = NEXT_ENEMY_ID++;
  x: number;
  y = -130;
  targetY = 135;
  radius: number;
  scaleFactor: number;
  isMegaBoss: boolean;
  vx: number;
  vy = 0;
  hp: number;
  maxHp: number;
  level: number;
  wingAngle = 0;
  chillTimer = 0;
  slowMult = 1;
  enraged = false;
  dashTimer = 0;
  fireCooldown = 0;
  hellAngleOffset = 0;

  constructor(w: number, level: number) {
    this.x = w / 2;
    this.level = level;
    // Trùm màn 10 và màn 20 to hơn 30% và máu gấp 3 lần trùm thường
    this.isMegaBoss = level === 10 || level === 20;
    this.scaleFactor = this.isMegaBoss ? 1.3 : 1.0;
    this.radius = Math.round(68 * this.scaleFactor);

    const baseBossHp = 520 + (level - 1) * 310;
    this.maxHp = this.isMegaBoss ? baseBossHp * 3 : baseBossHp;
    this.hp = this.maxHp;

    // Tốc độ di chuyển tăng thêm 10% sau mỗi Level
    const levelSpeedScale = Math.pow(1.1, level - 1);
    this.vx = 2.2 * levelSpeedScale;
  }

  applyChill(factor: number) {
    this.chillTimer = 75;
    this.slowMult = Math.max(0.7, factor);
  }

  update(w: number, h: number, eggs: EggProjectile[], playerX: number, playerY: number) {
    if (this.chillTimer > 0) {
      this.chillTimer--;
      if (this.chillTimer <= 0) this.slowMult = 1;
    }
    const eff = this.chillTimer > 0 ? this.slowMult : 1;

    // Cơ chế 2 Giai đoạn (Phases) cho Trùm từ Level 11 đến 20 khi HP < 50%
    if (this.level >= 11 && this.hp <= this.maxHp * 0.5) {
      this.enraged = true;
    }

    const phaseSpeedMult = this.enraged ? 1.65 : 1.0;
    this.wingAngle += 0.18 * eff * phaseSpeedMult;

    if (this.y < this.targetY && this.dashTimer === 0) {
      this.y += 2.2;
      return;
    }

    // Lướt (Dash) về phía người chơi khi ở trạng thái Điên Cuồng (Enraged Phase 2)
    if (this.enraged) {
      if (this.dashTimer > 0) {
        this.dashTimer--;
        if (this.dashTimer > 35) {
          // Lao xuống phía người chơi
          const dx = playerX - this.x;
          this.x += Math.sign(dx) * Math.min(Math.abs(dx), 7.5 * eff);
          this.y = Math.min(h * 0.62, this.y + 6.5 * eff);
        } else {
          // Rút về vị trí chỉ huy
          this.y += (this.targetY - this.y) * 0.14;
        }
      } else if (Math.random() < 0.008 * eff) {
        this.dashTimer = 70;
      }
    }

    if (this.dashTimer === 0) {
      this.x += this.vx * eff * phaseSpeedMult;
      if (this.x < this.radius + 30 || this.x > w - this.radius - 30) {
        this.vx *= -1;
      }
    }

    // Tốc độ nhả đạn tăng thêm 10% sau mỗi Level
    const levelFireRateScale = Math.pow(1.1, this.level - 1);
    this.fireCooldown -= eff * levelFireRateScale * (this.enraged ? 1.35 : 1.0);

    if (this.fireCooldown <= 0) {
      this.fireCooldown = 48;

      if (this.enraged) {
        // Mưa đạn tỏa tròn (Bullet Hell 360 độ) khi Trùm dưới 50% HP ở Level 11-20
        const ringCount = this.isMegaBoss ? 16 : 12;
        this.hellAngleOffset += 0.25;
        const bulletSpd = 4.6 + this.level * 0.15;
        for (let i = 0; i < ringCount; i++) {
          const ang = this.hellAngleOffset + (i * Math.PI * 2) / ringCount;
          eggs.push(
            new EggProjectile(
              this.x + Math.cos(ang) * 30,
              this.y + Math.sin(ang) * 30,
              Math.sin(ang) * bulletSpd,
              Math.cos(ang) * bulletSpd,
              true
            )
          );
        }
      } else {
        const spreadCount = Math.min(9, 3 + Math.floor(this.level / 2));
        for (let i = 0; i < spreadCount; i++) {
          const offset = (i - (spreadCount - 1) / 2) * 18;
          const vx = (i - (spreadCount - 1) / 2) * 1.05;
          eggs.push(
            new EggProjectile(this.x + offset, this.y + 52, 4.3 + this.level * 0.22, vx, false)
          );
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleFactor, this.scaleFactor);

    const wingOffset = Math.sin(this.wingAngle) * 14;
    ctx.shadowBlur = this.enraged ? 34 : 24;
    ctx.shadowColor = this.enraged ? '#ff2a00' : '#ef4444';

    // Hào quang bốc cháy khi Trùm ở Giai đoạn 2 (Enraged)
    if (this.enraged) {
      ctx.save();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 76 + Math.sin(this.wingAngle * 2) * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Giant wings
    ctx.fillStyle = this.chillTimer > 0 ? '#22d3ee' : this.enraged ? '#ef4444' : '#dc2626';
    ctx.beginPath();
    ctx.ellipse(-66, wingOffset, 34, 18, -0.3, 0, Math.PI * 2);
    ctx.ellipse(66, wingOffset, 34, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.chillTimer > 0 ? '#0891b2' : this.enraged ? '#7f1d1d' : '#b91c1c';
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = this.isMegaBoss ? 5 : 3.5;
    ctx.strokeStyle = this.enraged ? '#fb923c' : '#facc15';
    ctx.stroke();

    // Royal Crown
    ctx.fillStyle = this.isMegaBoss ? '#fde047' : '#facc15';
    ctx.beginPath();
    ctx.moveTo(-32, -56);
    ctx.lineTo(-22, -84);
    ctx.lineTo(-8, -64);
    ctx.lineTo(0, -92);
    ctx.lineTo(8, -64);
    ctx.lineTo(22, -84);
    ctx.lineTo(32, -56);
    ctx.closePath();
    ctx.fill();

    // Angry Eyes
    ctx.fillStyle = this.enraged ? '#ef4444' : '#fef08a';
    ctx.beginPath();
    ctx.arc(-22, -10, 12, 0, Math.PI * 2);
    ctx.arc(22, -10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-22, -10, 5.5, 0, Math.PI * 2);
    ctx.arc(22, -10, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-36, -24);
    ctx.lineTo(-10, -16);
    ctx.moveTo(36, -24);
    ctx.lineTo(10, -16);
    ctx.stroke();

    // Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(16, 8);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
