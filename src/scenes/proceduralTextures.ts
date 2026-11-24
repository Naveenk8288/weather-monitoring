import * as THREE from 'three';

/**
 * Draws an authentic 16x2 HD44780 character LCD onto a CanvasTexture.
 */
export function drawLcdCanvas(
  canvas: HTMLCanvasElement,
  line1: string,
  line2: string,
  alertTint: 'normal' | 'hot' | 'cold' | 'alert' = 'normal'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Backlight gradient (classic emerald-lime HD44780 with subtle status tint)
  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (alertTint === 'hot') {
    grad.addColorStop(0, '#9bd95a');
    grad.addColorStop(1, '#78b83d');
  } else if (alertTint === 'cold') {
    grad.addColorStop(0, '#78d5cb');
    grad.addColorStop(1, '#50b6ab');
  } else {
    grad.addColorStop(0, '#8fe05a');
    grad.addColorStop(1, '#6ec23d');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle scanline / pixel matrix background cells (16 cols x 2 rows)
  const padX = 24;
  const padY = 20;
  const cellW = (w - padX * 2) / 16;
  const cellH = (h - padY * 2 - 12) / 2;

  ctx.fillStyle = 'rgba(12, 34, 10, 0.11)';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 16; col++) {
      const cx = padX + col * cellW + 2;
      const cy = padY + row * (cellH + 12) + 2;
      ctx.fillRect(cx, cy, cellW - 4, cellH - 4);
    }
  }

  // Crisp monospace characters
  ctx.fillStyle = '#0c240c';
  ctx.font = '700 34px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const rows = [line1.padEnd(16, ' ').slice(0, 16), line2.padEnd(16, ' ').slice(0, 16)];
  rows.forEach((txt, rowIdx) => {
    for (let col = 0; col < 16; col++) {
      const ch = txt[col];
      if (ch && ch !== ' ') {
        const cx = padX + col * cellW + cellW / 2;
        const cy = padY + rowIdx * (cellH + 12) + cellH / 2 + 2;
        ctx.fillText(ch, cx, cy);
      }
    }
  });

  // Subtle glass reflection diagonal
  const shine = ctx.createLinearGradient(0, 0, w * 0.6, h);
  shine.addColorStop(0, 'rgba(255,255,255,0.22)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Generates crisp Artix-7 FPGA IC top silkscreen texture.
 */
export function createFpgaChipTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181c24';
  ctx.fillRect(0, 0, 256, 256);

  // Inner die bevel border
  ctx.strokeStyle = '#2d3544';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 232, 232);

  // Pin-1 orientation dot
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(34, 34, 8, 0, Math.PI * 2);
  ctx.fill();

  // Silkscreen markings
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('XILINX', 128, 92);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText('ARTIX-7', 128, 126);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText('XC7A35T-1CPG236C', 128, 158);
  ctx.fillText('WEATHER RTL v2', 128, 186);

  ctx.fillStyle = '#10b981';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText('BAML24303', 128, 214);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates Basys 3 PCB copper traces & white silkscreen overlay.
 */
export function createPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Deep emerald solder mask
  ctx.fillStyle = '#0d4a2e';
  ctx.fillRect(0, 0, 512, 384);

  // Subtle etched copper trace grid
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 24; i < 512; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 16);
    ctx.lineTo(i, 368);
    ctx.stroke();
  }
  for (let j = 24; j < 384; j += 24) {
    ctx.beginPath();
    ctx.moveTo(16, j);
    ctx.lineTo(496, j);
    ctx.stroke();
  }

  // Highlighted bus traces radiating from center FPGA
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.lineWidth = 2.5;
  const traces = [
    [256, 170, 90, 170, 55, 130],
    [256, 185, 90, 185, 55, 225],
    [256, 170, 420, 170, 455, 130],
    [256, 195, 420, 195, 455, 240],
    [240, 210, 240, 315, 140, 315],
    [272, 210, 272, 315, 380, 315]
  ];
  for (const t of traces) {
    ctx.beginPath();
    ctx.moveTo(t[0], t[1]);
    ctx.lineTo(t[2], t[3]);
    ctx.lineTo(t[4], t[5]);
    ctx.stroke();
  }

  // White silkscreen border & text
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 492, 364);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('DIGILENT  BASYS 3', 30, 44);

  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('PMOD JA', 24, 120);
  ctx.fillText('PMOD JB', 24, 230);
  ctx.fillText('PMOD JC', 432, 120);
  ctx.fillText('JXADC', 442, 230);
  ctx.fillText('SW15 ──────────────────────────────────────── SW0', 52, 362);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates golden interdigitated comb traces for the Rain Sensor module.
 */
export function createRainPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 256, 384);

  // Interdigitated gold-plated comb fingers
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(24, 30, 14, 320); // Left rail
  ctx.fillRect(218, 30, 14, 320); // Right rail

  for (let i = 0; i < 11; i++) {
    const y = 42 + i * 28;
    if (i % 2 === 0) {
      ctx.fillRect(38, y, 162, 10);
    } else {
      ctx.fillRect(56, y, 162, 10);
    }
  }

  // Silkscreen label
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RAIN SENSOR YL-83', 128, 372);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a crisp signboard texture for the 3D Campus Weather Kiosk.
 */
export function createKioskSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAT BENGALURU · SMART WEATHER KIOSK', 256, 48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillText('ARTIX-7 FPGA · REAL-TIME DHT11 + RAIN MONITOR', 256, 86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
