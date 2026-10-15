// Profilin giriş görseli: solda ad ve kısa tanım, sağda proje türlerini
// listeleyen bir terminal. Satırlar sayfa açılınca sırayla belirir (tek
// hareketli an); animasyon desteklenmezse hepsi baştan görünür.
//
//   node scripts/hero.mjs   ->  assets/hero.svg
//
// GitHub, README görsellerinin dışarıdan font yüklemesine izin vermez; sitenin
// fontları (Unbounded, Space Grotesk, JetBrains Mono) küçültülüp gömülür
// (scripts/fonts.json).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const F = JSON.parse(readFileSync(join(KOK, 'scripts/fonts.json'), 'utf8'));

const R = {
    gece: '#07070b', panel: '#0d0d15', cizgi: 'rgba(255,255,255,.08)', cizgi2: 'rgba(255,255,255,.12)',
    yazi: '#eeedf6', soluk: '#a3a1b8', sonuk: '#67657a', mor: '#8b6cff', mor2: '#b6a2ff',
    limon: '#c6ff3d', mercan: '#ff5c7a', sari: '#ffc857',
};

const PROJELER = [
    ['web-siteleri/', 'React, TypeScript, harita ve SEO'],
    ['paneller/', 'yönetim ve izleme ekranları'],
    ['noc/', 'Proxmox, ağ ve kamera izleme'],
    ['discord-botlari/', 'sysmami, dokuz botluk ekip'],
    ['sunucular/', 'Ubuntu, Proxmox, Docker'],
    ['portfolyo/', 'React ve Three.js'],
    ['elektronik/', 'Arduino denemeleri'],
];

const kac = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (ad, aile, agirlik) => `@font-face{font-family:'${aile}';font-weight:${agirlik};src:url(data:font/woff2;base64,${F[ad]}) format('woff2');}`;

const W = 1200, H = 460;
const T = { x: 604, y: 44, w: 548, h: 372 };   // terminal penceresi
const tx = T.x + 28;                             // terminal metin başlangıcı
const sutun = { ad: 0, aciklama: 196 };

const ADIM = 27;
const satirlar = PROJELER.map(([ad, aciklama], n) => {
    const y = 176 + n * ADIM;
    const gecikme = (0.35 + n * 0.12).toFixed(2);
    return `<g class="satir" style="animation-delay:${gecikme}s">
      <text x="${tx + sutun.ad}" y="${y}" class="mb mor2">${kac(ad)}</text>
      <text x="${tx + sutun.aciklama}" y="${y}" class="m soluk">${kac(aciklama)}</text>
    </g>`;
}).join('\n');

const sonSatirY = 176 + (PROJELER.length - 1) * ADIM + 44;
const imlecGecikme = (0.35 + PROJELER.length * 0.12 + 0.1).toFixed(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="baslik aciklama">
  <title id="baslik">MaMi</title>
  <desc id="aciklama">Web siteleri, paneller, botlar ve sunucu altyapısı geliştiriyorum. Sağdaki terminal proje türlerini listeliyor.</desc>
  <style>
    ${font('unbounded800', 'Unbounded', 800)}
    ${font('grotesk400', 'Space Grotesk', 400)}
    ${font('grotesk500', 'Space Grotesk', 500)}
    ${font('mono400', 'JetBrains Mono', 400)}
    ${font('mono600', 'JetBrains Mono', 600)}
    .ad{font:800 136px 'Unbounded',sans-serif;letter-spacing:-5px;fill:${R.yazi}}
    .marka{font:500 20px 'JetBrains Mono',monospace;fill:${R.soluk}}
    .bio{font:500 27px 'Space Grotesk',sans-serif;fill:${R.yazi};letter-spacing:-.3px}
    .alt{font:400 18px 'Space Grotesk',sans-serif;fill:${R.soluk}}
    .m{font:400 14px 'JetBrains Mono',monospace}
    .mb{font:600 14px 'JetBrains Mono',monospace}
    .baslikcubugu{font:400 12.5px 'JetBrains Mono',monospace;fill:${R.sonuk}}
    .yazi{fill:${R.yazi}} .soluk{fill:${R.soluk}} .sonuk{fill:${R.sonuk}} .limon{fill:${R.limon}} .mor2{fill:${R.mor2}}
    .satir{animation:gir .45s cubic-bezier(.2,.8,.2,1) both}
    .imlec{animation:gir .3s ease ${imlecGecikme}s both}
    .yanip{animation:yanip 1.1s steps(1) ${imlecGecikme}s infinite}
    @keyframes gir{from{opacity:0;transform:translateY(5px)}}
    @keyframes yanip{50%{opacity:0}}
    @media (prefers-reduced-motion: reduce){.satir,.imlec,.yanip{animation:none}}
  </style>
  <defs>
    <pattern id="nokta" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#ffffff" opacity=".045"/>
    </pattern>
    <radialGradient id="isik" cx="78%" cy="20%" r="60%">
      <stop offset="0" stop-color="${R.mor}" stop-opacity=".16"/>
      <stop offset="1" stop-color="${R.mor}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="cerceve"><rect width="${W}" height="${H}" rx="28"/></clipPath>
  </defs>

  <g clip-path="url(#cerceve)">
    <rect width="${W}" height="${H}" fill="${R.gece}"/>
    <rect width="${W}" height="${H}" fill="url(#nokta)"/>
    <rect width="${W}" height="${H}" fill="url(#isik)"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="27.5" fill="none" stroke="${R.cizgi}"/>

  <text x="64" y="92" class="marka">@mam1-hub</text>

  <text x="56" y="242" class="ad">MaMi</text>
  <text x="64" y="310" class="bio">Web siteleri, paneller, botlar ve</text>
  <text x="64" y="346" class="bio">sunucu altyapısı geliştiriyorum.</text>
  <text x="64" y="396" class="alt">Arayüzden sunucuya kadar, kurulumu da bende. Türkiye.</text>

  <!-- terminal -->
  <rect x="${T.x}" y="${T.y}" width="${T.w}" height="${T.h}" rx="18" fill="${R.panel}" stroke="${R.cizgi2}"/>
  <line x1="${T.x}" y1="${T.y + 44}" x2="${T.x + T.w}" y2="${T.y + 44}" stroke="${R.cizgi}"/>
  <circle cx="${T.x + 24}" cy="${T.y + 22}" r="5.5" fill="${R.mercan}"/>
  <circle cx="${T.x + 42}" cy="${T.y + 22}" r="5.5" fill="${R.sari}"/>
  <circle cx="${T.x + 60}" cy="${T.y + 22}" r="5.5" fill="${R.limon}"/>
  <text x="${T.x + T.w / 2}" y="${T.y + 26}" text-anchor="middle" class="baslikcubugu">mami@ev: ~</text>

  <text x="${tx}" y="128" class="mb"><tspan class="limon">~</tspan><tspan class="sonuk"> $ </tspan><tspan class="yazi">ls ~/projeler</tspan></text>
  ${satirlar}
  <g class="imlec">
    <text x="${tx}" y="${sonSatirY}" class="mb"><tspan class="limon">~</tspan><tspan class="sonuk"> $ </tspan></text>
    <rect class="yanip" x="${tx + 30}" y="${sonSatirY - 13}" width="8.5" height="17" rx="1.5" fill="${R.limon}"/>
  </g>
</svg>
`;

mkdirSync(join(KOK, 'assets'), { recursive: true });
writeFileSync(join(KOK, 'assets/hero.svg'), svg);
console.log('assets/hero.svg', (svg.length / 1024).toFixed(1), 'KB');
