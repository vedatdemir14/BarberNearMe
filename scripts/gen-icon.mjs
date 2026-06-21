// Marka ikonu üretici — sarı zemin (#FFCE38) + siyah makas (#020000)
// Çalıştır: node scripts/gen-icon.mjs
import { PNG } from 'pngjs';
import { writeFileSync } from 'fs';

const SIZE = 1024;
const YELLOW = [255, 206, 56, 255];
const BLACK = [2, 0, 0, 255];

function blank() {
  return new PNG({ width: SIZE, height: SIZE });
}

function setPx(png, x, y, [r, g, b, a]) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  // alpha-compositing değil; üzerine yaz (basit)
  png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = a;
}

function fill(png, color) {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) setPx(png, x, y, color);
}

function disk(png, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPx(png, x, y, color);
}

function thickLine(png, x0, y0, x1, y1, t, color) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    disk(png, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, t, color);
  }
}

function ring(png, cx, cy, rOut, rIn, color) {
  for (let y = cy - rOut; y <= cy + rOut; y++)
    for (let x = cx - rOut; x <= cx + rOut; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= rOut * rOut && d2 >= rIn * rIn) setPx(png, x, y, color);
    }
}

// Makas çizimi — merkez (cx,cy), ölçek scale
function scissors(png, cx, cy, scale, color) {
  const P  = (x, y) => [cx + (x - 512) * scale, cy + (y - 512) * scale];
  const T  = 30 * scale;            // bıçak/sap kalınlığı
  const pivot = P(512, 545);
  const t1 = P(372, 205), t2 = P(652, 205);   // bıçak uçları (V)
  const h1 = P(398, 745), h2 = P(626, 745);   // sap halka merkezleri
  // bıçaklar
  thickLine(png, pivot[0], pivot[1], t1[0], t1[1], T, color);
  thickLine(png, pivot[0], pivot[1], t2[0], t2[1], T, color);
  // saplara bağlantı
  thickLine(png, pivot[0], pivot[1], h1[0], h1[1], T, color);
  thickLine(png, pivot[0], pivot[1], h2[0], h2[1], T, color);
  // sap halkaları
  ring(png, h1[0], h1[1], 92 * scale, 52 * scale, color);
  ring(png, h2[0], h2[1], 92 * scale, 52 * scale, color);
  // pivot (vida)
  disk(png, pivot[0], pivot[1], 26 * scale, color);
}

// 1) icon.png — sarı zemin + siyah makas
{
  const png = blank();
  fill(png, YELLOW);
  scissors(png, 512, 512, 1.0, BLACK);
  writeFileSync('assets/icon.png', PNG.sync.write(png));
  console.log('✓ assets/icon.png');
}

// 2) adaptive-icon.png — saydam zemin + siyah makas (güvenli alan için küçük)
//    Zemin rengi app.json adaptiveIcon.backgroundColor = #FFCE38 ile gelir.
{
  const png = blank();
  fill(png, [0, 0, 0, 0]); // transparent
  scissors(png, 512, 512, 0.62, BLACK);
  writeFileSync('assets/adaptive-icon.png', PNG.sync.write(png));
  console.log('✓ assets/adaptive-icon.png');
}

// 3) splash-icon.png — koyu zemin (#0F0F1E) + sarı makas
{
  const png = blank();
  fill(png, [15, 15, 30, 255]);
  scissors(png, 512, 512, 0.8, YELLOW);
  writeFileSync('assets/splash-icon.png', PNG.sync.write(png));
  console.log('✓ assets/splash-icon.png');
}
