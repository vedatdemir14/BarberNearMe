/**
 * Luhn validation test — Node ile doğrudan çalıştır:
 *   node src/utils/luhn.test.ts
 *
 * (Node 23.6+ .ts dosyalarını ek kurulum olmadan çalıştırır; sende v24 var.)
 *
 * Ne yapar:
 *  1) Bilinen geçerli/geçersiz kartlarla hızlı kontrol.
 *  2) Raporun §4.3 istediği 100 kartlık seti üretir (50 geçerli + 50 geçersiz)
 *     ve doğruluk oranını yazar.
 */

import { isValidLuhn } from './luhn.ts';

let passed = 0;
let failed = 0;

function expect(label: string, actual: boolean, want: boolean) {
  const ok = actual === want;
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (beklenen=${want}, gelen=${actual})`);
}

// --- 1) Bilinen kartlar ------------------------------------------------
console.log('--- Bilinen kartlar ---');
expect('4242 4242 4242 4242 (Visa test)',  isValidLuhn('4242 4242 4242 4242'), true);
expect('5555 5555 5555 4444 (MC test)',    isValidLuhn('5555 5555 5555 4444'), true);
expect('4242 4242 4242 4241 (son hane bozuk)', isValidLuhn('4242 4242 4242 4241'), false);
expect('1234 5678 9012 3456 (rastgele)',   isValidLuhn('1234 5678 9012 3456'), false);
expect('bos string',                       isValidLuhn(''), false);
expect('harf iceren',                      isValidLuhn('4242abcd42424242'), false);

// --- 2) 100 kartlik set (rapor §4.3) -----------------------------------
// Luhn kontrol hanesini bagimsiz olarak hesapla (test edilen fonksiyondan ayri).
function checkDigit(first15: string): number {
  let sum = 0;
  let dbl = true; // 16. hane check; saga dogru 15. haneden basladigimiz icin ilk ciftlenen odur
  for (let i = first15.length - 1; i >= 0; i--) {
    let d = parseInt(first15[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10;
}

function randomDigits(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

console.log('\n--- 100 kartlik test seti ---');
let validPass = 0, invalidFail = 0;

for (let i = 0; i < 50; i++) {
  const base = randomDigits(15);
  const card = base + checkDigit(base);     // gecerli 16 haneli kart
  if (isValidLuhn(card)) validPass++;
}

for (let i = 0; i < 50; i++) {
  const base = randomDigits(15);
  const good = base + checkDigit(base);
  const last = parseInt(good[15], 10);
  const bad = good.slice(0, 15) + ((last + 1) % 10); // son haneyi boz -> Luhn kirilir
  if (!isValidLuhn(bad)) invalidFail++;
}

console.log(`Gecerli 50 karttan dogru kabul edilen : ${validPass}/50`);
console.log(`Gecersiz 50 karttan dogru reddedilen  : ${invalidFail}/50`);
const accuracy = ((validPass + invalidFail) / 100) * 100;
console.log(`Toplam dogruluk: ${accuracy}%`);

// --- Ozet --------------------------------------------------------------
console.log(`\n=== Bilinen-kart testleri: ${passed} PASS, ${failed} FAIL ===`);
if (failed === 0 && accuracy === 100) {
  console.log('TUM TESTLER GECTI ✅');
} else {
  console.log('BAZI TESTLER BASARISIZ ❌');
  process.exit(1);
}
