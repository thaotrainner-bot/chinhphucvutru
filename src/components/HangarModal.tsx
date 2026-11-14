import React, { useEffect, useRef } from 'react';
import {
  Check,
  Crosshair,
  Flame,
  RotateCcw,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { AmmoId, AMMO_ORDER, AMMO_TYPES, ShipId, SHIP_ORDER, SHIPS } from '../types/game';
import { drawShipHull } from '../utils/shipRenderer';

export function ShipPreviewCanvas({
  shipId,
  active,
  size = 86,
}: {
  shipId: ShipId;
  active: boolean;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = 0;

    const render = () => {
      phase += 0.18;
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const grad = ctx.createRadialGradient(
        cvs.width / 2,
        cvs.height / 2,
        4,
        cvs.width / 2,
        cvs.height / 2,
        cvs.width * 0.48
      );
      grad.addColorStop(0, active ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.08)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      drawShipHull(
        ctx,
        shipId,
        cvs.width / 2,
        cvs.height / 2 + 4,
        size / 86,
        phase,
        shipId === 'titan' && active
      );
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [shipId, active, size]);

  return <canvas ref={ref} width={size} height={size} className="shrink-0" />;
}

interface HangarModalProps {
  selectedShip: ShipId;
  selectedAmmo: AmmoId;
  weaponTier: number;
  soundOn: boolean;
  isGameActive: boolean;
  onSelectShip: (id: ShipId) => void;
  onSelectAmmo: (id: AmmoId) => void;
  onChangeTier: (tier: number) => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({
  selectedShip,
  selectedAmmo,
  weaponTier,
  soundOn,
  isGameActive,
  onSelectShip,
  onSelectAmmo,
  onChangeTier,
  onToggleSound,
  onRestart,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900/95 border border-cyan-500/35 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg md:text-xl font-black tracking-wider uppercase text-white">
                Cài Đặt & Xưởng Chiến Cơ
              </h2>
              <p className="text-xs text-slate-400">
                100% điều khiển bằng nút bấm trực quan · Thay đổi áp dụng ngay lập tức vào chiến trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* 1. Chọn Chiến Cơ (4 nút bấm) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs md:text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                1. Chọn Chiến Cơ Xuất Kích (4 Phi Thuyền)
              </h3>
              <span className="text-xs text-slate-400">
                Đang chọn: <strong className="text-white">{SHIPS[selectedShip].name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SHIP_ORDER.map((id) => {
                const ship = SHIPS[id];
                const active = selectedShip === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectShip(id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      active
                        ? 'bg-cyan-950/55 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
                        : 'bg-slate-950/65 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-display font-bold text-sm text-white">
                          {ship.name}
                        </span>
                        {active && (
                          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã chọn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-cyan-300/90 font-medium mb-2">
                        {ship.tagline} · {ship.maxHp} HP
                      </p>

                      <div className="flex justify-center bg-slate-950/80 rounded-lg border border-slate-800/80 py-1.5 mb-2.5">
                        <ShipPreviewCanvas shipId={id} active={active} size={76} />
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                        {ship.perkText}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Tốc độ bay</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${ship.speedStat}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Hỏa lực</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${ship.powerStat}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Giáp trụ</span>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${ship.armorStat}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Loại Đạn (4 nút bấm) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs md:text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                2. Chọn Loại Đạn Chiến Đấu (Phím Tắt 1 – 4)
              </h3>
              <span className="text-xs text-slate-400">
                Đang nạp: <strong className="text-white">{AMMO_TYPES[selectedAmmo].name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AMMO_ORDER.map((id) => {
                const ammo = AMMO_TYPES[id];
                const active = selectedAmmo === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectAmmo(id)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      active
                        ? 'bg-amber-950/45 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-950/65 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: ammo.color,
                              boxShadow: `0 0 8px ${ammo.color}`,
                            }}
                          />
                          {ammo.name}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          [{ammo.hotkey}]
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {ammo.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-amber-300/90 font-semibold">{ammo.badge}</span>
                      {active && <span className="text-emerald-400 font-bold">Đang dùng</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Chọn Cấp Đạn Trực Tiếp Từ [1] Đến [10] Bằng Nút Bấm */}
          <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-display text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  3. Chọn Trực Tiếp Cấp Độ Hỏa Lực (Cấp 1 – Cấp 10)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm trực tiếp vào nút số bên dưới để thử nghiệm ngay mọi cấp độ tia đạn (Cấp 9–10 mở khóa pháo chéo & hậu vệ)
                </p>
              </div>
              <span className="font-display text-sm font-black text-emerald-400 tabular-nums">
                Đang chọn: CẤP {weaponTier} / 10
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => {
                const active = weaponTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChangeTier(t)}
                    className={`py-2.5 rounded-lg font-display font-black text-sm transition-all cursor-pointer tabular-nums flex flex-col items-center justify-center border ${
                      active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.5)] scale-105'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                    }`}
                  >
                    <span>[{t}]</span>
                    <span className="text-[9px] font-sans font-semibold opacity-80">
                      {t >= 9 ? 'Siêu Cấp' : `Cấp ${t}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Nút Âm Thanh & Thao Tác Hệ Thống */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleSound}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                  soundOn
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/25'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                Âm thanh hiệu ứng: {soundOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </button>

              {isGameActive && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRestart();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 font-display font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Chơi Lại Từ Đầu
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-display font-black text-xs md:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(34,211,238,0.4)] transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <Zap className="w-4 h-4" />
              Lưu & Tiếp Tục Chiến Đấu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
