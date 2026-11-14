import { ShipId } from '../types/game';

export function drawShipHull(
  targetCtx: CanvasRenderingContext2D,
  shipType: ShipId,
  x: number,
  y: number,
  scale = 1,
  thrusterPhase = 0,
  hasShield = false
) {
  const w = 44;
  const h = 48;

  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.scale(scale, scale);

  // Vòng năng lượng Khiên Bảo Vệ
  if (hasShield) {
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.arc(0, 0, w * 0.92, 0, Math.PI * 2);
    targetCtx.strokeStyle = '#00f3ff';
    targetCtx.lineWidth = 2.5;
    targetCtx.shadowBlur = 14;
    targetCtx.shadowColor = '#00f3ff';
    targetCtx.stroke();
    targetCtx.fillStyle = 'rgba(0, 243, 255, 0.13)';
    targetCtx.fill();
    targetCtx.restore();
  }

  // Lửa phản lực động cơ
  const flame = 13 + Math.abs(Math.sin(thrusterPhase)) * 10;

  if (shipType === 'falcon') {
    // Chim Ưng Ngân Hà: Xanh Cyan / Xanh Dương sắc nét
    targetCtx.fillStyle = '#00f3ff';
    targetCtx.shadowBlur = 12;
    targetCtx.shadowColor = '#00f3ff';
    targetCtx.beginPath();
    targetCtx.moveTo(-10, h / 2 - 4);
    targetCtx.lineTo(-6, h / 2 + flame);
    targetCtx.lineTo(-2, h / 2 - 4);
    targetCtx.moveTo(2, h / 2 - 4);
    targetCtx.lineTo(6, h / 2 + flame);
    targetCtx.lineTo(10, h / 2 - 4);
    targetCtx.fill();
    targetCtx.shadowBlur = 0;

    // Cánh Chim Ưng
    targetCtx.fillStyle = '#0284c7';
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 4);
    targetCtx.lineTo(w / 2 + 12, h / 2 - 3);
    targetCtx.lineTo(w / 2 + 7, h / 2 + 5);
    targetCtx.lineTo(0, h / 2 - 8);
    targetCtx.lineTo(-w / 2 - 7, h / 2 + 5);
    targetCtx.lineTo(-w / 2 - 12, h / 2 - 3);
    targetCtx.closePath();
    targetCtx.fill();

    // Thân chính
    targetCtx.fillStyle = '#f1f5f9';
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 2 - 5);
    targetCtx.lineTo(12, h / 2 - 2);
    targetCtx.lineTo(6, h / 2 + 4);
    targetCtx.lineTo(-6, h / 2 + 4);
    targetCtx.lineTo(-12, h / 2 - 2);
    targetCtx.closePath();
    targetCtx.fill();

    // Buồng lái
    targetCtx.fillStyle = '#38bdf8';
    targetCtx.beginPath();
    targetCtx.ellipse(0, -h / 8, 4.8, 12, 0, 0, Math.PI * 2);
    targetCtx.fill();
  } else if (shipType === 'phantom') {
    // Bóng Ma Siêu Thanh: Cánh ngược Tàng Hình màu Tím Neon
    targetCtx.fillStyle = '#f43f5e';
    targetCtx.shadowBlur = 14;
    targetCtx.shadowColor = '#e879f9';
    targetCtx.beginPath();
    targetCtx.moveTo(-7, h / 2 - 2);
    targetCtx.lineTo(0, h / 2 + flame + 5);
    targetCtx.lineTo(7, h / 2 - 2);
    targetCtx.fill();
    targetCtx.shadowBlur = 0;

    // Cánh quét ngược về phía trước
    targetCtx.fillStyle = '#4c1d95';
    targetCtx.strokeStyle = '#e879f9';
    targetCtx.lineWidth = 1.5;
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 5);
    targetCtx.lineTo(w / 2 + 14, -h / 3);
    targetCtx.lineTo(w / 2 + 6, h / 2);
    targetCtx.lineTo(0, h / 2 - 6);
    targetCtx.lineTo(-w / 2 - 6, h / 2);
    targetCtx.lineTo(-w / 2 - 14, -h / 3);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    // Thân kim cương tàng hình
    targetCtx.fillStyle = '#1e1b4b';
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 2 - 7);
    targetCtx.lineTo(10, h / 4);
    targetCtx.lineTo(0, h / 2 + 4);
    targetCtx.lineTo(-10, h / 4);
    targetCtx.closePath();
    targetCtx.fill();

    // Buồng lái hồng neon
    targetCtx.fillStyle = '#f0abfc';
    targetCtx.beginPath();
    targetCtx.ellipse(0, -h / 7, 4, 11, 0, 0, Math.PI * 2);
    targetCtx.fill();
  } else if (shipType === 'titan') {
    // Pháo Đài Titan: Giáp hạng nặng Vàng Kim & 2 Nòng Pháo Lớn
    targetCtx.fillStyle = '#fb923c';
    targetCtx.shadowBlur = 12;
    targetCtx.shadowColor = '#f59e0b';
    targetCtx.beginPath();
    targetCtx.moveTo(-15, h / 2 - 2);
    targetCtx.lineTo(-10, h / 2 + flame);
    targetCtx.lineTo(-5, h / 2 - 2);
    targetCtx.moveTo(5, h / 2 - 2);
    targetCtx.lineTo(10, h / 2 + flame);
    targetCtx.lineTo(15, h / 2 - 2);
    targetCtx.fill();
    targetCtx.shadowBlur = 0;

    // 2 Pháo Hạng Nặng hai bên cánh
    targetCtx.fillStyle = '#94a3b8';
    targetCtx.fillRect(-w / 2 - 6, -h / 2 + 4, 5.5, 24);
    targetCtx.fillRect(w / 2 + 0.5, -h / 2 + 4, 5.5, 24);

    // Cánh bọc thép
    targetCtx.fillStyle = '#b45309';
    targetCtx.strokeStyle = '#fbbf24';
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.moveTo(-13, -h / 3);
    targetCtx.lineTo(w / 2 + 13, 0);
    targetCtx.lineTo(w / 2 + 11, h / 2);
    targetCtx.lineTo(-w / 2 - 11, h / 2);
    targetCtx.lineTo(-w / 2 - 13, 0);
    targetCtx.lineTo(13, -h / 3);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    // Thân Pháo Đài
    targetCtx.fillStyle = '#f59e0b';
    targetCtx.beginPath();
    targetCtx.roundRect(-13, -h / 2, 26, h, 6);
    targetCtx.fill();

    // Buồng lái bọc thép
    targetCtx.fillStyle = '#fef08a';
    targetCtx.fillRect(-6, -h / 4, 12, 15);
  } else {
    // Valkyrie Ánh Sao: Lục Bảo & Vàng Trắng thanh thoát
    targetCtx.fillStyle = '#34d399';
    targetCtx.shadowBlur = 14;
    targetCtx.shadowColor = '#10b981';
    targetCtx.beginPath();
    targetCtx.moveTo(-8, h / 2 - 4);
    targetCtx.lineTo(0, h / 2 + flame + 4);
    targetCtx.lineTo(8, h / 2 - 4);
    targetCtx.fill();
    targetCtx.shadowBlur = 0;

    // Đôi cánh Vũ Thần Ánh Sao
    targetCtx.fillStyle = '#059669';
    targetCtx.strokeStyle = '#a7f3d0';
    targetCtx.lineWidth = 1.5;
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 3);
    targetCtx.lineTo(w / 2 + 15, -h / 8);
    targetCtx.lineTo(w / 2 + 5, h / 2 - 2);
    targetCtx.lineTo(11, h / 3);
    targetCtx.lineTo(-11, h / 3);
    targetCtx.lineTo(-w / 2 - 5, h / 2 - 2);
    targetCtx.lineTo(-w / 2 - 15, -h / 8);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    // Thân trắng ánh kim
    targetCtx.fillStyle = '#ecfdf5';
    targetCtx.beginPath();
    targetCtx.moveTo(0, -h / 2 - 6);
    targetCtx.lineTo(11, h / 2 - 4);
    targetCtx.lineTo(0, h / 2 + 5);
    targetCtx.lineTo(-11, h / 2 - 4);
    targetCtx.closePath();
    targetCtx.fill();

    // Ngọc năng lượng lục bảo giữa thân
    targetCtx.fillStyle = '#10b981';
    targetCtx.beginPath();
    targetCtx.arc(0, -4, 5.5, 0, Math.PI * 2);
    targetCtx.fill();
  }

  targetCtx.restore();
}
