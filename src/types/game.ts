export type ShipId = 'falcon' | 'phantom' | 'titan' | 'valkyrie';
export type AmmoId = 'laser' | 'plasma' | 'cryo' | 'shuriken';
export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export interface ShipConfig {
  id: ShipId;
  name: string;
  tagline: string;
  perkText: string;
  maxHp: number;
  speed: number;
  fireDelay: number;
  baseDamage: number;
  speedStat: number;
  powerStat: number;
  armorStat: number;
}

export interface AmmoConfig {
  id: AmmoId;
  hotkey: string;
  name: string;
  shortName: string;
  description: string;
  badge: string;
  color: string;
  coreColor: string;
  speed: number;
  damageMult: number;
  fireDelayMult: number;
  pierceCount: number;
  slowFactor: number;
}

export const SHIP_ORDER: ShipId[] = ['falcon', 'phantom', 'titan', 'valkyrie'];
export const AMMO_ORDER: AmmoId[] = ['laser', 'plasma', 'cryo', 'shuriken'];

export const SHIPS: Record<ShipId, ShipConfig> = {
  falcon: {
    id: 'falcon',
    name: 'Chim Ưng Ngân Hà',
    tagline: 'Cân bằng toàn diện',
    perkText: '100 HP · Tốc độ bay và hỏa lực cân bằng chuẩn mực cho mọi chiến dịch.',
    maxHp: 100,
    speed: 6.6,
    fireDelay: 170,
    baseDamage: 14,
    speedStat: 75,
    powerStat: 75,
    armorStat: 70,
  },
  phantom: {
    id: 'phantom',
    name: 'Bóng Ma Siêu Thanh',
    tagline: 'Cánh ngược tàng hình',
    perkText: 'Tốc độ di chuyển +35%, tốc độ bắn +22%, cơ động né mưa trứng cực nhanh.',
    maxHp: 100,
    speed: 8.9,
    fireDelay: 135,
    baseDamage: 13.5,
    speedStat: 100,
    powerStat: 78,
    armorStat: 65,
  },
  titan: {
    id: 'titan',
    name: 'Pháo Đài Titan',
    tagline: 'Thiết giáp hạng nặng',
    perkText: 'Giáp 160 HP, sát thương +25%, tự động bật sẵn Lá Chắn khi xuất kích & qua màn.',
    maxHp: 160,
    speed: 5.7,
    fireDelay: 180,
    baseDamage: 17.5,
    speedStat: 62,
    powerStat: 96,
    armorStat: 100,
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Valkyrie Ánh Sao',
    tagline: 'Chiến thần hồi phục',
    perkText: '125 HP, sát thương +15%, tốc bắn +12%, tăng +50% lượng HP khi nhặt vật phẩm (H).',
    maxHp: 125,
    speed: 7.2,
    fireDelay: 150,
    baseDamage: 16.1,
    speedStat: 84,
    powerStat: 88,
    armorStat: 82,
  },
};

export const AMMO_TYPES: Record<AmmoId, AmmoConfig> = {
  laser: {
    id: 'laser',
    hotkey: '1',
    name: 'Đạn Tia Laser',
    shortName: 'Tia Laser',
    description: 'Tốc độ bay siêu cao, đường đạn thẳng chuẩn xác với nhịp bắn dồn dập.',
    badge: 'Tốc độ siêu cao',
    color: '#00f3ff',
    coreColor: '#ffffff',
    speed: 13.5,
    damageMult: 1.0,
    fireDelayMult: 0.92,
    pierceCount: 1,
    slowFactor: 1,
  },
  plasma: {
    id: 'plasma',
    hotkey: '2',
    name: 'Cầu Nhiệt Plasma',
    shortName: 'Cầu Plasma',
    description: 'Quả cầu năng lượng nhiệt hạch cỡ lớn, tăng +35% sát thương mỗi phát bắn.',
    badge: '+35% Sát thương',
    color: '#ff5500',
    coreColor: '#fde047',
    speed: 10.6,
    damageMult: 1.35,
    fireDelayMult: 1.06,
    pierceCount: 1,
    slowFactor: 1,
  },
  cryo: {
    id: 'cryo',
    hotkey: '3',
    name: 'Sóng Băng Từ Trường',
    shortName: 'Sóng Băng',
    description: 'Lưỡi sóng bán nguyệt quét rộng và làm chậm 45% tốc độ bay của gà địch & thiên thạch.',
    badge: 'Làm chậm 45%',
    color: '#38bdf8',
    coreColor: '#e0f2fe',
    speed: 11.2,
    damageMult: 1.08,
    fireDelayMult: 1.0,
    pierceCount: 1,
    slowFactor: 0.55,
  },
  shuriken: {
    id: 'shuriken',
    hotkey: '4',
    name: 'Phi Tiêu Xuyên Phá',
    shortName: 'Phi Tiêu',
    description: 'Ngôi sao 4 cánh xoay tròn siêu tốc có khả năng xuyên thấu qua nhiều mục tiêu liên tiếp.',
    badge: 'Xuyên 4 mục tiêu',
    color: '#c084fc',
    coreColor: '#f5d0fe',
    speed: 12.6,
    damageMult: 0.96,
    fireDelayMult: 0.96,
    pierceCount: 4,
    slowFactor: 1,
  },
};
