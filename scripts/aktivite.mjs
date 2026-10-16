// GitHub hareketi kartı: profildeki takvimin aynısı (son bir yıl) ve tek
// cümlelik özet (yıllık katkı, en uzun ve şu anki seri). Toplam, GitHub'ın
// kendi "son bir yıldaki katkı" sayısıdır. Hazır servislerin (vercel / heroku)
// yerine 30 dakikada bir GitHub Actions'ta yeniden üretilir ve `output`
// dalına yazılır; gizli repolardaki katkılar da sayılır (profilde "Private
// contributions" açıksa).
//
//   GITHUB_TOKEN=... node scripts/aktivite.mjs           (Actions)
//   node scripts/aktivite.mjs --veri takvim.json        (yerelde hazır veriyle)
//   -> assets/aktivite.svg

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const F = JSON.parse(readFileSync(join(KOK, 'scripts/fonts.json'), 'utf8'));
const KULLANICI = process.env.PROFIL_KULLANICI || 'mam1-hub';

const R = {
    gece: '#07070b', cizgi: 'rgba(255,255,255,.08)', yazi: '#eeedf6', soluk: '#a3a1b8', sonuk: '#67657a',
    seviye: ['#15141f', '#2b2456', '#4a3a9c', '#8b6cff', '#c6ff3d'],
};
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

async function takvimGetir() {
    const i = process.argv.indexOf('--veri');
    if (i > 0) return JSON.parse(readFileSync(process.argv[i + 1], 'utf8'));
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN yok (ya da --veri dosya.json ver)');
    const sorgu = `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
    const y = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'mam1-hub-profil' },
        body: JSON.stringify({ query: sorgu, variables: { u: KULLANICI } }),
    });
    const j = await y.json();
    if (!y.ok || j.errors) throw new Error(`GitHub GraphQL: ${y.status} ${JSON.stringify(j.errors || j).slice(0, 200)}`);
    return j;
}

/** Günler -> { toplam, enUzun, simdiki } (saf; test edilebilir). */
export function seriler(gunler, bugun) {
    let enUzun = 0, sayac = 0;
    for (const g of gunler) { sayac = g.contributionCount > 0 ? sayac + 1 : 0; enUzun = Math.max(enUzun, sayac); }
    // Şu anki seri: bugün henüz katkı yoksa dünden geriye sayılır.
    let simdiki = 0;
    let n = gunler.length - 1;
    if (n >= 0 && gunler[n].date === bugun && gunler[n].contributionCount === 0) n--;
    for (; n >= 0 && gunler[n].contributionCount > 0; n--) simdiki++;
    return { toplam: gunler.reduce((t, g) => t + g.contributionCount, 0), enUzun, simdiki };
}

/** Katkı sayısı -> 0..4 seviye (sıfır olmayan günlerin dörtte birlikleri). */
export function seviyeci(gunler) {
    const dolu = gunler.map((g) => g.contributionCount).filter((n) => n > 0).sort((a, b) => a - b);
    const q = (p) => dolu.length ? dolu[Math.min(dolu.length - 1, Math.floor(p * dolu.length))] : 1;
    const e = [q(0.25), q(0.5), q(0.85)];
    return (n) => (n <= 0 ? 0 : n <= e[0] ? 1 : n <= e[1] ? 2 : n <= e[2] ? 3 : 4);
}

const gunAdi = (n) => (n === 1 ? '1 gün' : `${n} gün`);

export function ciz(veri, simdi = new Date()) {
    const takvim = veri.data.user.contributionsCollection.contributionCalendar;
    const haftalar = takvim.weeks;
    const gunler = haftalar.flatMap((h) => h.contributionDays);
    const bugun = simdi.toISOString().slice(0, 10);
    // Toplam GitHub'ın profilde gösterdiği sayıyla aynı olsun.
    const s = { ...seriler(gunler, bugun), toplam: Number(takvim.totalContributions) || 0 };
    const guncelleme = simdi.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const sev = seviyeci(gunler);

    const W = 1200, H = 348, X = 56, Y = 128, HUC = 16, ARA = 4, ADIM = HUC + ARA;
    const hucreler = [];
    const aylar = [];
    let oncekiAy = -1;
    haftalar.forEach((h, hi) => {
        h.contributionDays.forEach((g) => {
            const gun = new Date(`${g.date}T00:00:00Z`).getUTCDay();
            const x = X + hi * ADIM, y = Y + gun * ADIM;
            const b = g.date === bugun;
            hucreler.push(`<rect x="${x}" y="${y}" width="${HUC}" height="${HUC}" rx="4" fill="${R.seviye[sev(g.contributionCount)]}"${b ? ` stroke="${R.yazi}" stroke-width="1.5"` : ''}><title>${g.date}: ${g.contributionCount} katkı</title></rect>`);
        });
        const ilk = h.contributionDays[0];
        const ay = new Date(`${ilk.date}T00:00:00Z`).getUTCMonth();
        if (ay !== oncekiAy && hi < haftalar.length - 2) {
            // Bir önceki etiket çok yakınsa (yarım ay) onu at, üst üste binmesin.
            if (aylar.length && hi - aylar[aylar.length - 1].hi < 3) aylar.pop();
            aylar.push({ hi, metin: `<text x="${X + hi * ADIM}" y="${Y - 12}" class="ay">${AYLAR[ay]}</text>` });
            oncekiAy = ay;
        }
    });
    const lejantX = X + haftalar.length * ADIM - ARA - 5 * (HUC + 4) + 4;
    const lejant = R.seviye.map((r, n) => `<rect x="${lejantX + n * (HUC + 4)}" y="${H - 50}" width="${HUC}" height="${HUC}" rx="4" fill="${r}"/>`).join('');

    const font = (ad, aile, agirlik) => `@font-face{font-family:'${aile}';font-weight:${agirlik};src:url(data:font/woff2;base64,${F[ad]}) format('woff2');}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="b a">
  <title id="b">GitHub hareketi</title>
  <desc id="a">Son 12 ayda ${s.toplam} katkı. En uzun seri ${gunAdi(s.enUzun)}, şu anki seri ${gunAdi(s.simdiki)}.</desc>
  <style>
    ${font('grotesk400', 'Space Grotesk', 400)}
    ${font('grotesk500', 'Space Grotesk', 500)}
    .ozet{font:400 23px 'Space Grotesk',sans-serif;fill:${R.soluk}}
    .ozet .s{font-weight:500;fill:${R.yazi}}
    .ay,.not{font:400 15px 'Space Grotesk',sans-serif;fill:${R.sonuk}}
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="27.5" fill="${R.gece}" stroke="${R.cizgi}"/>
  <text x="${X}" y="62" class="ozet">Son 12 ayda <tspan class="s">${s.toplam} katkı</tspan>. En uzun seri <tspan class="s">${gunAdi(s.enUzun)}</tspan>, şu anki seri <tspan class="s">${gunAdi(s.simdiki)}</tspan>.</text>
  ${aylar.map((a) => a.metin).join('\n  ')}
  ${hucreler.join('\n  ')}
  <text x="${X}" y="${H - 37}" class="not">30 dakikada bir yenilenir, son güncelleme ${guncelleme}. Gizli repolardaki katkılar da sayılır.</text>
  <text x="${lejantX - 10}" y="${H - 37}" text-anchor="end" class="not">az</text>
  ${lejant}
  <text x="${lejantX + 5 * (HUC + 4) + 6}" y="${H - 37}" class="not">çok</text>
</svg>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const veri = await takvimGetir();
    const svg = ciz(veri);
    mkdirSync(join(KOK, 'assets'), { recursive: true });
    writeFileSync(join(KOK, 'assets/aktivite.svg'), svg);
    console.log('assets/aktivite.svg', (svg.length / 1024).toFixed(1), 'KB');
}
