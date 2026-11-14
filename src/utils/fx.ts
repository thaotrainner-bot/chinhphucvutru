export type ParticleKind = 'spark' | 'feather' | 'rock' | 'smoke' | 'confetti';

export class RichParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha = 1;
  decay: number;
  kind: ParticleKind;
  rot: number;
  vRot: number;

  constructor(x: number, y: number, color: string, kind: ParticleKind = 'spark') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.kind = kind;
    this.rot = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.22;

    const ang = Math.random() * Math.PI * 2;
    const spd =
      kind === 'feather'
        ? Math.random() * 4.2 + 1.2
        : kind === 'rock'
          ? Math.random() * 5.2 + 1.5
          : kind === 'confetti'
            ? Math.random() * 6.5 + 2.0
            : Math.random() * 6.8 + 1.5;

    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd - (kind === 'feather' ? 1.2 : kind === 'confetti' ? 2.2 : 0);
    this.size =
      kind === 'feather'
        ? Math.random() * 5 + 4
        : kind === 'rock'
          ? Math.random() * 4.5 + 3
          : kind === 'confetti'
            ? Math.random() * 6 + 4
            : Math.random() * 3 + 1.8;
    this.decay =
      kind === 'feather'
        ? Math.random() * 0.015 + 0.012
        : kind === 'confetti'
          ? Math.random() * 0.008 + 0.006
          : Math.random() * 0.028 + 0.018;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vRot;
    if (this.kind === 'feather') {
      this.vx *= 0.96;
      this.vy = this.vy * 0.95 + 0.12;
      this.x += Math.sin(this.rot * 2) * 0.45;
    } else if (this.kind === 'confetti') {
      this.vx *= 0.97;
      this.vy = this.vy * 0.96 + 0.14;
      this.x += Math.cos(this.rot * 1.8) * 0.65;
    } else if (this.kind === 'rock') {
      this.vy += 0.14;
    } else {
      this.vx *= 0.97;
      this.vy *= 0.97;
    }
    this.alpha -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = this.color;

    if (this.kind === 'feather') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 1.35, this.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size, 0);
      ctx.stroke();
    } else if (this.kind === 'rock') {
      ctx.beginPath();
      ctx.moveTo(-this.size, -this.size * 0.6);
      ctx.lineTo(this.size * 0.8, -this.size);
      ctx.lineTo(this.size, this.size * 0.7);
      ctx.lineTo(-this.size * 0.5, this.size);
      ctx.closePath();
      ctx.fill();
    } else if (this.kind === 'confetti') {
      ctx.fillRect(-this.size, -this.size * 0.45, this.size * 2, this.size * 0.9);
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ShockwaveRing {
  x: number;
  y: number;
  radius = 4;
  maxRadius: number;
  color: string;
  alpha = 0.9;

  constructor(x: number, y: number, color: string, maxRadius = 64) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.18 + 1.6;
    this.alpha -= 0.042;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.6;
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha = 1;
  vy = -1.5;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.022;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = '800 14px "Chakra Petch", sans-serif';
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export type DropKind = 'WEAPON' | 'HEAL' | 'SHIELD';

export class DropItem {
  x: number;
  y: number;
  radius = 15;
  kind: DropKind;
  vy = 2.1;
  pulse = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const r = Math.random();
    if (r < 0.52) this.kind = 'WEAPON';
    else if (r < 0.8) this.kind = 'HEAL';
    else this.kind = 'SHIELD';
  }

  update() {
    this.y += this.vy;
    this.pulse += 0.1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const scale = 1 + Math.sin(this.pulse) * 0.08;
    ctx.scale(scale, scale);

    let color = '#facc15';
    let label = 'W';
    if (this.kind === 'HEAL') {
      color = '#22c55e';
      label = 'H';
    } else if (this.kind === 'SHIELD') {
      color = '#38bdf8';
      label = 'S';
    }

    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '900 13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}

export class BonusStarItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  rot = Math.random() * Math.PI * 2;
  vRot = (Math.random() - 0.5) * 0.18;
  points: number;

  constructor(x: number, y: number, points = 150) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5;
    this.points = points;
  }

  update(targetX: number, targetY: number) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const pull = dist < 420 ? 0.85 : 0.42;
    this.vx = this.vx * 0.92 + (dx / dist) * pull;
    this.vy = this.vy * 0.92 + (dy / dist) * pull;
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vRot;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#facc15';
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = Math.cos(outerAngle) * this.radius;
      const oy = Math.sin(outerAngle) * this.radius;
      const ix = Math.cos(innerAngle) * (this.radius * 0.45);
      const iy = Math.sin(innerAngle) * (this.radius * 0.45);
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
