// server.js — Aurora v1.4 (UK/AU beauty studio pipeline)
import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

let ExcelJS;
try { ExcelJS = (await import('exceljs')).default; }
catch { console.warn('[Excel] run: npm install exceljs'); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const clientDist = join(__dirname, 'client', 'dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  console.log('[Static] Serving React build from client/dist')
} else {
  app.use(express.static(join(__dirname, 'public')))
}

const client   = new Anthropic();
const MAPS_KEY = process.env.GOOGLE_MAPS_KEY;
const CSE_KEY  = process.env.GOOGLE_CSE_KEY;
const CSE_ID   = process.env.GOOGLE_CSE_ID;

const AGGREGATOR_DOMAINS = [
  'linktr.ee', 'beacons.ai', 'linkin.bio', 'stan.store',
  'bio.site', 'taplink.cc', 'campsite.bio', 'lnk.bio', 'bento.me'
];

const IG_INVALID_PATHS = new Set([
  'p', 'explore', 'reel', 'reels', 'stories', 'tv', 'accounts',
  'hashtag', 'direct', 'about', 'legal', 'privacy', 'security',
  'help', 'press', 'api', 'blog', 'developer', 'developers',
  'instagram', 'share', 'sharer', 'intent', 'ar', 'web'
]);

// ─── SHORTLIST ────────────────────────────────────────────────────────────────
const SHORTLIST_PATH = './shortlist.json';
function loadShortlist() {
  try {
    const data = JSON.parse(readFileSync(SHORTLIST_PATH, 'utf8'));
    return new Map(data.map(l => [l.id, l]));
  } catch { return new Map(); }
}
function saveShortlist(map) {
  writeFileSync(SHORTLIST_PATH, JSON.stringify([...map.values()], null, 2));
}
const shortlist = loadShortlist();
console.log(`[Shortlist] Loaded ${shortlist.size} saved leads`);

// ─── SEEN LEADS ───────────────────────────────────────────────────────────────
const SEEN_PATH = './seen-leads.json';
function loadSeen() {
  try { return new Set(JSON.parse(readFileSync(SEEN_PATH, 'utf8'))); }
  catch { return new Set(); }
}
function saveSeen(s) { writeFileSync(SEEN_PATH, JSON.stringify([...s])); }
let seenLeads = loadSeen();
console.log(`[Seen] ${seenLeads.size} previously seen businesses`);

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
const EXCEL_PATH  = './leads-uk-au.xlsx';
const EXCEL_HEADS = [
  'Name','Type','Address','Phone','Website','Instagram','IG Method','Owner',
  'Score','Score Reason','Pain Points',
  'LinkedIn Message','Loom Brief','Follow Up',
  'Maps URL','Output Mode','Status','Saved At'
];

async function appendLeadToExcel(lead) {
  if (!ExcelJS) return;
  const wb = new ExcelJS.Workbook();
  if (existsSync(EXCEL_PATH)) {
    try { await wb.xlsx.readFile(EXCEL_PATH); }
    catch {
      const { unlinkSync } = await import('fs');
      unlinkSync(EXCEL_PATH);
    }
  }
  let ws = wb.getWorksheet('Leads');
  if (!ws) {
    ws = wb.addWorksheet('Leads');
    const hr = ws.addRow(EXCEL_HEADS);
    hr.font = { bold: true };
    const widths = [28,12,35,18,30,20,14,16,8,40,45,60,60,50,50,14,14,22];
    ws.columns = EXCEL_HEADS.map((h,i) => ({ header:h, width:widths[i] }));
  }
  ws.addRow([
    lead.name||'', lead.type||'', lead.address||'', lead.phone||'',
    lead.website||'', lead.instagramHandle||'',
    lead.igMethod ? `${lead.igMethod}${lead.igConfidence === 'unconfirmed' ? ' (unconfirmed)' : ''}` : '',
    lead.ownerName||'',
    lead.score||'', lead.scoreReason||'', lead.painPoints||'',
    lead.linkedinMessage||'', lead.loomBrief||'', lead.followUp||'',
    lead.googleMapsUrl||'', lead.outputMode||'linkedin',
    'new', new Date().toLocaleString('en-GB')
  ]);
  await wb.xlsx.writeFile(EXCEL_PATH);
}

// ─── UK/AU COUNTRY FILTER ─────────────────────────────────────────────────────
function isUKorAU(address) {
  if (!address) return false;
  const addr = address.toLowerCase();
  return (
    addr.includes(', uk') ||
    addr.includes('united kingdom') ||
    addr.includes('england') ||
    addr.includes('scotland') ||
    addr.includes('wales') ||
    addr.includes(', australia') ||
    addr.includes(' au ') ||
    addr.match(/\b(nsw|vic|qld|sa|wa|tas|act|nt)\b/) !== null ||
    addr.includes('new south wales') ||
    addr.includes('victoria') ||
    addr.includes('queensland')
  )
}

// ─── NICHE CONTEXT MAP ────────────────────────────────────────────────────────
const NICHE_CONTEXT = {
  'lash studio':    'Pain points: bookings managed entirely through Instagram DMs causing 2-3hrs daily admin, no deposit system so high no-show rate, clients cannot see pricing or portfolio without DMing, "lash studio near me" searches return competitors with proper booking sites, still on wixsite.com or squarespace.com subdomain meaning zero Google discoverability.',
  'lash artist':    'Pain points: bookings managed entirely through Instagram DMs causing 2-3hrs daily admin, no deposit system so high no-show rate, clients cannot see pricing or portfolio without DMing.',
  'lash':           'Pain points: bookings managed entirely through Instagram DMs, no deposit system, clients cannot see pricing or portfolio without DMing.',
  'brow studio':    'Pain points: no online booking so clients DM for every appointment, no deposit collection meaning high no-show rate, pricing not visible online, still on free subdomain meaning zero Google discoverability.',
  'brow artist':    'Pain points: no online booking, no deposit collection, pricing not visible online, still on free subdomain.',
  'brow':           'Pain points: no online booking, no deposit collection, pricing not visible online.',
  'beauty studio':  'Pain points: no online booking, appointments via DMs only causing missed revenue outside business hours, no portfolio gallery for new clients, site either missing or DIY template with broken contact form.',
  'beauty salon':   'Pain points: no online booking causing phone tag and lost clients, appointments via calls/DMs only, no service menu with transparent pricing, poor mobile performance losing Google traffic.',
  'nail studio':    'Pain points: no online booking system, clients DM to check availability, no gallery showcasing work, competitors with proper booking pages capturing walk-in traffic.',
  'nail salon':     'Pain points: no online booking, clients DM to check availability, no gallery showcasing work quality.',
  'microblading':   'Pain points: no online booking for consultations, no before/after gallery to build trust, no deposit system for high-value treatments.',
  'aesthetics':     'Pain points: no online consultation booking, no treatment menu with clear pricing, no before/after gallery.',
  'skin clinic':    'Pain points: no online booking for treatments, no service menu with pricing transparency, no practitioner credentials visible.',
  'wellness studio':'Pain points: no class schedule visible online, no online booking or membership signup.',
  'pilates':        'Pain points: no online class booking, class schedule not visible, no membership signup flow.',
  'yoga':           'Pain points: no online class schedule or booking, no way to sell memberships or class packs online.',
  clinic:      'Pain points: no online appointment booking, patients search at night and find competitors.',
  hospital:    'Pain points: no department listing, no OPD schedule online.',
  dentist:     'Pain points: no before/after gallery, no appointment booking.',
  restaurant:  'Pain points: no online menu, no table reservation system.',
  gym:         'Pain points: no online membership inquiry or trial class booking.',
  salon:       'Pain points: appointments only via calls/WhatsApp causing no-shows.',
};

function getNicheContext(niche) {
  const key = niche.toLowerCase().trim();
  if (NICHE_CONTEXT[key]) return NICHE_CONTEXT[key];
  for (const [k, v] of Object.entries(NICHE_CONTEXT)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 'Pain points: no website presence, customers search online and find competitors, missing trust signals for new customers.';
}

const OUTPUT_MODE_INSTRUCTIONS = {
  linkedin: 'Optimise the linkedinMessage for maximum reply rate. Specific, warm, not salesy.',
  loom:     'Optimise the loomBrief for maximum visual impact — exactly what to show on screen, in what order.',
};

// ─── INSTAGRAM HANDLE ENRICHMENT (3-layer fallback) ──────────────────────────
//
// Layer 1: Static HTML regex      — already in checkWebsiteQuality, instant
// Layer 2: Link-aggregator fetch  — follows Linktree/Beacons/etc. linked from the site
// Layer 3: Google CSE fallback    — finds IG even when the business never links it
//                                    Requires GOOGLE_CSE_KEY + GOOGLE_CSE_ID in .env
//                                    CSE must be set to "Search the entire web" mode

// Extract the first valid IG handle from any HTML or text string
function parseIgHandle(html) {
  if (!html) return null;
  const re = /instagram\.com\/([a-zA-Z0-9_.]{2,30})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const h = m[1].replace(/\/$/, '').toLowerCase();
    if (!IG_INVALID_PATHS.has(h)) return h;
  }
  return null;
}

// True if the given URL is a known link-aggregator service
function isAggregatorUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return AGGREGATOR_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

// Fetch an aggregator page (Linktree, Beacons, etc.) and extract the IG handle it lists
// Note: Linktree uses Next.js SSR — instagram.com/handle appears in __NEXT_DATA__ JSON
// embedded in raw HTML, so a plain fetch is enough (no headless browser needed)
async function fetchAggregatorHandle(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; aurora-agent/1.0)' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return parseIgHandle(await res.text());
  } catch { return null; }
}

// Score CSE results and extract a handle with name-match confidence
function extractFromCseItems(items, businessName) {
  const nameWords = businessName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const item of (items || [])) {
    const m = (item.link || '').match(/instagram\.com\/([a-zA-Z0-9_.]{2,30})/);
    if (!m) continue;
    const handle = m[1].replace(/\/$/, '').toLowerCase();
    if (IG_INVALID_PATHS.has(handle)) continue;

    const blob = ((item.title || '') + ' ' + (item.snippet || '')).toLowerCase();
    const matched = nameWords.length
      ? nameWords.filter(w => blob.includes(w)).length
      : 0;
    // At least 50% of significant name words must appear in title/snippet
    const confidence = !nameWords.length || matched >= Math.ceil(nameWords.length * 0.5)
      ? 'confirmed' : 'unconfirmed';

    return { handle, confidence };
  }
  return null;
}

// Layer 3: Google Custom Search Engine lookup
//
// CSE SETUP (Google removed "Search entire web" toggle on 20 Jan 2026):
//   cse.google.com → Create → name it "Zyvora" →
//   "Enter a site or pages" field: type  instagram.com/*  → click Add → Create
//   Copy the Search Engine ID → GOOGLE_CSE_ID in .env
//   Enable Custom Search API in Google Cloud Console (same project as Maps key)
//   Use same API key or new one → GOOGLE_CSE_KEY in .env
//   Free quota: 100 queries/day — well above Aurora's volume (~15 per scan)
//
// Because the CSE is scoped to instagram.com/* already, no site: operator needed —
// every result is an Instagram profile page. Simpler queries, same precision.
async function googleSearchInstagram(businessName) {
  if (!CSE_KEY || !CSE_ID) return null;
  const base = 'https://www.googleapis.com/customsearch/v1';
  try {
    // Primary: exact business name quoted — highest precision
    const p1 = new URLSearchParams({ key: CSE_KEY, cx: CSE_ID, q: `"${businessName}"`, num: 3 });
    const r1  = await fetch(`${base}?${p1}`);
    const d1  = await r1.json();
    const hit1 = extractFromCseItems(d1.items, businessName);
    if (hit1) return hit1;

    // Fallback: unquoted — catches handles where IG display name is slightly different
    const p2 = new URLSearchParams({ key: CSE_KEY, cx: CSE_ID, q: businessName, num: 3 });
    const r2  = await fetch(`${base}?${p2}`);
    const d2  = await r2.json();
    return extractFromCseItems(d2.items, businessName);
  } catch (err) {
    console.warn('[IG-CSE] Search error:', err.message);
    return null;
  }
}

// Master enrichment function — runs layers in order, returns on first hit
async function enrichInstagramHandle(businessName, websiteUrl, siteHandle, aggregatorUrl) {
  // Layer 1: already extracted from site HTML — return immediately, no HTTP calls
  if (siteHandle) {
    return { handle: siteHandle, confidence: 'confirmed', method: 'site' };
  }

  // Layer 2a: the website IS a link-aggregator (e.g. business uses linktr.ee as their main URL)
  if (websiteUrl && isAggregatorUrl(websiteUrl)) {
    const h = await fetchAggregatorHandle(websiteUrl);
    if (h) return { handle: h, confidence: 'confirmed', method: 'aggregator' };
  }

  // Layer 2b: website links TO an aggregator (e.g. social icon in footer)
  if (aggregatorUrl) {
    const h = await fetchAggregatorHandle(aggregatorUrl);
    if (h) return { handle: h, confidence: 'confirmed', method: 'aggregator' };
  }

  // Layer 3: Google CSE — finds IG even when the business never explicitly links it
  const cse = await googleSearchInstagram(businessName);
  if (cse?.handle) return { ...cse, method: 'google' };

  return { handle: null, confidence: null, method: null };
}

// ─── GOOGLE MAPS DISCOVERY ───────────────────────────────────────────────────
async function searchGoogleMaps(niche, city, count, minRating = 3.5, minReviews = 15) {
  if (!MAPS_KEY) throw new Error('GOOGLE_MAPS_KEY not set in .env');
  console.log(`[Maps] ${niche} in ${city} | filters: ≥${minRating} rating, ≥${minReviews} reviews`);

  let allPlaces = [], pageToken = null, page = 0;

  while (page < 3) {
    const params = new URLSearchParams({
      query: `${niche} in ${city}`,
      key: MAPS_KEY,
      ...(pageToken ? { pagetoken: pageToken } : {})
    });
    if (pageToken) await new Promise(r => setTimeout(r, 2000));

    const searchRes  = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
    const searchData = await searchRes.json();

    if (searchData.status === 'REQUEST_DENIED')
      throw new Error(`Google Maps denied: ${searchData.error_message || 'check API key'}`);
    if (searchData.status === 'ZERO_RESULTS') break;

    allPlaces.push(...(searchData.results || []));
    pageToken = searchData.next_page_token || null;
    page++;
    if (!pageToken) break;
  }

  console.log(`[Maps] Raw: ${allPlaces.length}`);

  const qualified = allPlaces.filter(p =>
    (p.rating || 0) >= minRating && (p.user_ratings_total || 0) >= minReviews
  );
  console.log(`[Maps] Qualified (≥${minRating}, ≥${minReviews} reviews): ${qualified.length}`);

  const ukAuOnly = qualified.filter(p => {
    const addr = p.formatted_address || '';
    if (!isUKorAU(addr)) {
      console.log(`[Maps] Filtered non-UK/AU: ${p.name} — ${addr}`);
      return false;
    }
    return true;
  });
  console.log(`[Maps] UK/AU only: ${ukAuOnly.length}`);

  const unseen = ukAuOnly.filter(p => !seenLeads.has(p.place_id));
  console.log(`[Maps] Unseen: ${unseen.length}`);

  if (!unseen.length) {
    console.log(`[Maps] All seen in ${city} — returning empty, other scans continue`);
    return [];
  }

  if (unseen.length < count)
    console.log(`[Maps] Only ${unseen.length} available (requested ${count}) — returning all`);

  for (let i = unseen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
  }

  const selected = unseen.slice(0, count);

  const results = await Promise.allSettled(selected.map(async place => {
    try {
      const dp = new URLSearchParams({
        place_id: place.place_id,
        fields: 'name,formatted_phone_number,website,formatted_address',
        key: MAPS_KEY
      });
      const dr = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${dp}`);
      const dd = await dr.json();
      const d  = dd.result || {};
      return {
        id:            `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        placeId:       place.place_id,
        name:          d.name || place.name,
        address:       d.formatted_address || place.formatted_address || city,
        phone:         d.formatted_phone_number || null,
        website:       d.website || null,
        rating:        place.rating || null,
        reviewCount:   place.user_ratings_total || 0,
        type:          (place.types || [niche])[0].replace(/_/g, ' '),
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name || place.name)}&query_place_id=${place.place_id}`
      };
    } catch {
      return {
        id:            `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        placeId:       place.place_id,
        name:          place.name,
        address:       place.formatted_address || city,
        phone:         null, website: null,
        rating:        place.rating || null,
        reviewCount:   place.user_ratings_total || 0,
        type:          niche,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`
      };
    }
  }));

  const detailed = results
    .filter((r,i) => {
      if (r.status==='rejected') { console.warn(`[Maps] Details failed ${i}`); return false; }
      return true;
    })
    .map(r => r.value)
    .filter(b => {
      if (!b.phone && !b.website) {
        seenLeads.add(b.placeId);
        console.log(`[Maps] Skipped (no phone + no website): ${b.name}`);
        return false;
      }
      return true;
    });

  selected.forEach(p => seenLeads.add(p.place_id));
  saveSeen(seenLeads);
  console.log(`[Maps] Returning ${detailed.length} contactable leads | Total seen: ${seenLeads.size}`);
  return detailed;
}

// ─── WEBSITE QUALITY CHECKER ─────────────────────────────────────────────────
async function checkWebsiteQuality(url) {
  if (!url) return null;

  const isOnSubdomain = /wixsite\.com|squarespace\.com\/[^/]+$|weebly\.com|wordpress\.com|godaddysites\.com/i.test(url);

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    const fetchStart = Date.now();

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; aurora-agent/1.0)' },
      redirect: 'follow',
    });
    const loadTime = Date.now() - fetchStart;
    clearTimeout(timeout);

    if (!res.ok) return { error: `HTTP ${res.status}`, url, isOnSubdomain };

    const html  = await res.text();
    const lower = html.toLowerCase();

    // 1. Mobile responsive
    const isMobile = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);

    // 2. Booking system keywords
    const bookingKeywords = [
      'book appointment', 'book now', 'book a', 'schedule', 'appointment',
      'booking', 'reserve', 'calendly', 'fresha', 'treatwell', 'square appointments',
      'timely', 'shortcuts', 'acuity', 'vagaro', 'mindbody', 'booker', 'setmore'
    ];
    const hasBooking = bookingKeywords.some(k => lower.includes(k));

    // 3. DM-to-book signal
    const dmKeywords = [
      'dm to book', 'dm us to book', 'message to book', 'message us to book',
      'inbox to book', 'contact us to book', 'whatsapp to book',
      'slide into', 'send us a message to book', 'reach out to book',
      'text to book', 'call to book', 'ring to book'
    ];
    const hasDMBooking = dmKeywords.some(k => lower.includes(k));

    // 4. Site freshness
    const yearMatch     = lower.match(/copyright[^0-9]*([0-9]{4})|©\s*([0-9]{4})/);
    const copyrightYear = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : null;
    const currentYear   = new Date().getFullYear();
    const isStale       = copyrightYear && copyrightYear < currentYear - 2;

    // 5. Subdomain (already checked above)

    // 6. Prices visible
    const priceKeywords = ['£', '$', 'price', 'pricing', 'from £', 'starting from', 'treatment menu', 'service menu', 'rate'];
    const hasPrices = priceKeywords.some(k => lower.includes(k));

    // 7. Instagram handle — Layer 1 (static HTML regex)
    // Uses shared parseIgHandle which filters invalid paths like /p/, /explore/, etc.
    const instagramHandle = parseIgHandle(html);

    // Aggregator link detection — scans entire HTML for any aggregator URL
    // Passed to enrichInstagramHandle for Layer 2 fetching
    const aggMatch = html.match(
      /https?:\/\/(?:www\.)?(?:linktr\.ee|beacons\.ai|linkin\.bio|stan\.store|bio\.site|taplink\.cc|campsite\.bio|lnk\.bio|bento\.me)\/([a-zA-Z0-9_.@-]+)/i
    );
    const aggregatorUrl = aggMatch ? aggMatch[0] : null;

    // 8. Load speed
    const isSlowLoading = loadTime > 4000;

    const issueCount = (
      (!isMobile      ? 1 : 0) +
      (!hasBooking    ? 2 : 0) +
      (hasDMBooking   ? 2 : 0) +
      (isStale        ? 1 : 0) +
      (isOnSubdomain  ? 2 : 0) +
      (!hasPrices     ? 1 : 0) +
      (isSlowLoading  ? 1 : 0)
    );

    let verdict, pitchAngle;
    if (issueCount >= 5) {
      verdict    = 'poor';
      pitchAngle = 'complete rebuild needed — multiple critical issues';
    } else if (issueCount >= 2) {
      verdict    = 'outdated';
      pitchAngle = 'targeted upgrade — clear gaps to address';
    } else {
      verdict    = 'decent';
      pitchAngle = 'minor improvements only — lower priority';
    }

    return {
      url, isMobile, hasBooking, hasDMBooking, hasPrices,
      isOnSubdomain, copyrightYear, isStale, isSlowLoading,
      loadTime,
      instagramHandle,   // Layer 1 result (null if not in static HTML)
      aggregatorUrl,     // aggregator page URL found linked from site (null if none)
      verdict, pitchAngle, issueCount
    };

  } catch (err) {
    return {
      url, isOnSubdomain,
      error: err.name === 'AbortError' ? 'timeout (8s)' : err.message,
      verdict: 'unverified',
      pitchAngle: 'could not verify — approach cautiously'
    };
  }
}

// ─── CLAUDE ANALYSIS ─────────────────────────────────────────────────────────
async function analyseLeads(businesses, service, niche, outputMode = 'linkedin') {
  console.log(`[Claude] Scoring ${businesses.length} leads | niche: ${niche} | outputMode: ${outputMode}`);

  const nicheContext    = getNicheContext(niche);
  const modeInstruction = OUTPUT_MODE_INSTRUCTIONS[outputMode] || OUTPUT_MODE_INSTRUCTIONS.linkedin;

  const systemPrompt = `You are a lead scoring agent for a freelance web developer targeting independent beauty studios in the UK and Australia.
The developer offers: modern website builds, online booking systems, deposit collection flows, mobile-first design.
Typical project value: $600–$1,500 USD. Clients are solo or small-team studio owners.

NICHE CONTEXT for "${niche}":
${nicheContext}

STRICT SCORING RULES (1-10) — follow exactly:
- 10: No website at all — pure opportunity, build from scratch
- 9:  Still on free subdomain (wixsite.com/squarespace.com) — zero SEO, needs migration
- 8:  Own domain BUT DM-to-book detected OR no booking system at all
- 7:  Has own domain + booking, BUT site is stale (2+ years old) OR not mobile responsive
- 6:  Has booking + mobile, BUT no prices visible OR very slow loading
- 4-5: Mostly decent site, one minor issue
- 2-3: Polished site, functional booking, good mobile — do NOT approach
- 1:  Perfect site — skip entirely

CRITICAL: If a site has working booking (Fresha/Mindbody/Calendly embedded), mobile responsive, recent copyright, and clear pricing — score it 2-3 MAX. Do not inflate scores.

OUTPUT MODE: ${outputMode.toUpperCase()}
${modeInstruction}

FOR EACH LEAD GENERATE:

1. linkedinMessage (3 sentences ONLY):
   - Sentence 1: Genuine specific compliment on their work (reference rating or review count)
   - Sentence 2: ONE specific issue — precise ("your site has no way to take a booking deposit" not "your site needs work")
   - Sentence 3: Soft ask — "I put together a 2-min walkthrough showing what this looks like fixed — worth a look?"
   - NEVER start with "I noticed" or mention being from India
   - Tone: peer-to-peer, not salesperson

2. loomBrief (exactly 3 bullets separated by |):
   - What to open first on screen
   - What specific problem to show
   - How to close the video

3. followUp (1 sentence for day 4 if no reply)

YOUR ENTIRE RESPONSE = ONE RAW JSON OBJECT. No markdown. No preamble.

{
  "leads": [
    {
      "name": "string",
      "website": "url or null",
      "phone": "string or null",
      "address": "string",
      "rating": 4.2,
      "reviewCount": 143,
      "score": 8,
      "scoreReason": "one sentence — reference specific issues found",
      "painPoints": "2-3 specific issues for this business",
      "pitch": "copy of linkedinMessage",
      "linkedinMessage": "3-sentence message",
      "loomBrief": "bullet 1 | bullet 2 | bullet 3",
      "followUp": "one sentence",
      "type": "lash studio / brow studio / etc",
      "instagramHandle": "handle or null"
    }
  ],
  "summary": "one sentence about this batch"
}`;

  const businessData = businesses.map((b, i) => {
    let websiteInfo = 'NO WEBSITE — score 10, perfect target';
    if (b.website) {
      if (b.websiteQuality) {
        const wq = b.websiteQuality;
        if (wq.error) {
          websiteInfo = `${b.website} (unverified — ${wq.error})`;
        } else {
          const issues = [];
          if (!wq.isMobile)      issues.push('NOT mobile responsive');
          if (!wq.hasBooking)    issues.push('NO booking system');
          if (wq.hasDMBooking)   issues.push('DM-TO-BOOK on site');
          if (wq.isOnSubdomain)  issues.push(`FREE SUBDOMAIN (${wq.url.split('/')[2]})`);
          if (wq.isStale)        issues.push(`STALE (copyright ${wq.copyrightYear})`);
          if (!wq.hasPrices)     issues.push('NO prices visible');
          if (wq.isSlowLoading)  issues.push(`SLOW (${wq.loadTime}ms)`);
          // Use Layer 1 handle for Claude's context — enrichment result applied after scoring
          const ig = wq.instagramHandle || b.instagramHandle || null;
          websiteInfo = `${b.website}
     verdict: ${wq.verdict} (${wq.issueCount} issues)
     issues: ${issues.length > 0 ? issues.join(', ') : 'none — score LOW (2-3)'}
     pitch angle: ${wq.pitchAngle}
     instagram: ${ig ? '@' + ig : 'not found on site (enrichment running in parallel)'}`;
        }
      } else {
        websiteInfo = b.website;
      }
    }
    return `${i+1}. ${b.name}
   Type: ${b.type}
   Address: ${b.address}
   Phone: ${b.phone || 'not listed'}
   Website: ${websiteInfo}
   Rating: ${b.rating || 'n/a'} (${b.reviewCount || 0} reviews)`;
  }).join('\n\n');

  const MAX_ATTEMPTS = 3;
  let parsed = null;
  let lastRawJSON = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Businesses:\n\n${businessData}\n\nService offered: ${service}\n\nReturn only JSON.` },
          { role: 'assistant', content: '{' }
        ]
      });

      const rawJSON = '{' + res.content.filter(b=>b.type==='text').map(b=>b.text).join('').trim();
      lastRawJSON = rawJSON;

      if (attempt === 1) {
        console.log('[Claude] Response (first 300):\n', rawJSON.slice(0,300));
      } else {
        console.log(`[Claude] Retry ${attempt} response (first 200):`, rawJSON.slice(0,200));
      }

      try { parsed = JSON.parse(rawJSON); } catch {}
      if (!parsed) { try { parsed = JSON.parse(rawJSON.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch {} }
      if (!parsed) { const m = rawJSON.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch {} } }
      if (!parsed) {
        const lastBrace = rawJSON.lastIndexOf('}');
        if (lastBrace > -1) {
          try { parsed = JSON.parse(rawJSON.slice(0, lastBrace + 1)); } catch {}
        }
      }

      if (parsed && Array.isArray(parsed.leads)) {
        if (attempt > 1) console.log(`[Claude] Succeeded on retry ${attempt}`);
        break;
      } else {
        parsed = null;
        console.warn(`[Claude] Attempt ${attempt} parsed but missing valid leads array — retrying`);
      }

    } catch (apiErr) {
      console.error(`[Claude] Attempt ${attempt} API call failed:`, apiErr.message);
    }

    if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 1500));
  }

  if (!parsed) {
    console.error('[Claude] All attempts failed. Last raw response:', lastRawJSON.slice(0, 500));
  }

  return parsed;
}


// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.post('/api/leads', async (req, res) => {
  const {
    niche, city, service,
    count      = 5,
    minRating  = 3.5,
    minReviews = 15,
    outputMode = 'linkedin'
  } = req.body;

  if (!niche || !city || !service)
    return res.status(400).json({ error: 'niche, city, and service are required' });

  try {
    const businesses = await searchGoogleMaps(
      niche, city, parseInt(count),
      parseFloat(minRating), parseInt(minReviews)
    );

    if (!businesses.length) {
      console.log(`[Route] No businesses returned for ${niche} in ${city} — returning empty`);
      return res.json({ leads: [], summary: `No new leads found for ${niche} in ${city}.` });
    }

    // ── Website quality checks (Layer 1 IG extraction happens inside here) ──
    console.log(`[Website] Checking ${businesses.filter(b=>b.website).length} sites...`);
    const siteChecks = await Promise.allSettled(
      businesses.map(b => b.website ? checkWebsiteQuality(b.website) : Promise.resolve(null))
    );
    businesses.forEach((b, i) => {
      const result = siteChecks[i];
      b.websiteQuality = (result.status === 'fulfilled') ? result.value : null;

      // Apply Layer 1 handle immediately so Claude sees it in analyseLeads below
      if (b.websiteQuality?.instagramHandle) {
        b.instagramHandle = b.websiteQuality.instagramHandle;
        b.igMethod        = 'site';
        b.igConfidence    = 'confirmed';
      }

      if (b.websiteQuality) {
        const wq = b.websiteQuality;
        const flags = [];
        if (wq.hasDMBooking)  flags.push('DM-TO-BOOK');
        if (wq.isOnSubdomain) flags.push('SUBDOMAIN');
        if (!wq.hasBooking)   flags.push('NO-BOOKING');
        if (wq.isSlowLoading) flags.push(`SLOW-${wq.loadTime}ms`);
        if (wq.instagramHandle) flags.push(`@${wq.instagramHandle}[L1]`);
        if (wq.aggregatorUrl)   flags.push(`agg:${new URL(wq.aggregatorUrl).hostname}`);
        console.log(`[Website] ${b.name}: ${wq.verdict || wq.error} [issues:${wq.issueCount||0}]${flags.length ? ` ${flags.join(' ')}` : ''}`);
      }
    });

    // ── Run Claude scoring + IG enrichment Layers 2 & 3 in PARALLEL ──
    // No added latency — enrichment runs alongside scoring, not after it.
    console.log('[IG] Enriching handles (Layers 2+3 in parallel with Claude scoring)...');
    const [parsed, igEnrichments] = await Promise.all([
      analyseLeads(businesses, service, niche, outputMode),
      Promise.allSettled(
        businesses.map(b => enrichInstagramHandle(
          b.name,
          b.website || null,
          b.websiteQuality?.instagramHandle || null,
          b.websiteQuality?.aggregatorUrl   || null
        ))
      )
    ]);

    // Apply enrichment results — overwrites Layer 1 only if Layer 2/3 found something
    // (Layer 1 results that were already applied above are re-confirmed here, not changed)
    businesses.forEach((b, i) => {
      const r = igEnrichments[i];
      if (r.status === 'fulfilled' && r.value.handle) {
        b.instagramHandle = r.value.handle;
        b.igConfidence    = r.value.confidence;
        b.igMethod        = r.value.method;
      }
      const ig = b.instagramHandle;
      const tag = ig ? `@${ig} [${b.igMethod}${b.igConfidence === 'unconfirmed' ? '??' : ''}]` : '✗ not found';
      console.log(`[IG] ${b.name}: ${tag}`);
    });

    if (!parsed || !Array.isArray(parsed.leads)) {
      console.error(`[Route] Scoring failed completely for ${niche} in ${city} after retries — returning empty`);
      return res.json({
        leads: [],
        summary: `Scoring failed for ${niche} in ${city} after 3 attempts — skipped this batch.`
      });
    }

    if (!parsed.leads.length) {
      return res.json(parsed);
    }

    const bizByName = {};
    businesses.forEach(b => { bizByName[b.name.toLowerCase().trim()] = b; });

    parsed.leads = parsed.leads.map((lead, i) => {
      const key = (lead.name || '').toLowerCase().trim();
      const src = bizByName[key] || businesses[i] || {};

      const phone = src.phone || lead.phone || null;

      return {
        ...src, ...lead,
        googleMapsUrl:   src.googleMapsUrl || lead.googleMapsUrl,
        id:              src.id || `${Date.now()}-${i}`,
        outputMode,
        websiteQuality:  src.websiteQuality || null,
        // IG handle: enriched result takes priority over whatever Claude echoed back
        instagramHandle: src.instagramHandle || lead.instagramHandle || null,
        igConfidence:    src.igConfidence || null,
        // igMethod tells you HOW the handle was found: 'site' | 'aggregator' | 'google'
        igMethod:        src.igMethod || null,
        phone,
        // callTag: drop {{lead.callTag}} into your n8n Telegram template to include phone
        callTag:         phone ? `📞 ${phone}` : null,
        linkedinMessage: lead.linkedinMessage || lead.pitch || '',
        loomBrief:       lead.loomBrief || '',
        followUp:        lead.followUp || '',
        pitch:           lead.linkedinMessage || lead.pitch || '',
      };
    });

    console.log(`[Done] ${parsed.leads.length} leads scored | mode: ${outputMode}\n`);
    res.json(parsed);
  } catch (err) {
    console.error('[Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/seen/count', (req, res) => res.json({ count: seenLeads.size }));

app.delete('/api/seen', (req, res) => {
  seenLeads = new Set();
  saveSeen(seenLeads);
  console.log('[Seen] Reset');
  res.json({ ok: true });
});

app.get('/api/saved', (req, res) => res.json({ saved: [...shortlist.values()] }));

app.post('/api/saved', async (req, res) => {
  const lead = req.body;
  if (!lead?.id) return res.status(400).json({ error: 'Lead must have an id' });
  shortlist.set(lead.id, { ...lead, savedAt: new Date().toISOString(), status: 'new' });
  saveShortlist(shortlist);
  try { await appendLeadToExcel(lead); console.log(`[Excel] Appended: ${lead.name}`); }
  catch (err) { console.error('[Excel] Failed:', err.message); }
  res.json({ ok: true, saved: shortlist.size });
});

app.patch('/api/saved/:id', (req, res) => {
  const lead = shortlist.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  shortlist.set(req.params.id, { ...lead, ...req.body });
  saveShortlist(shortlist);
  res.json({ ok: true });
});

app.delete('/api/saved/:id', (req, res) => {
  shortlist.delete(req.params.id);
  saveShortlist(shortlist);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'client', 'dist', 'index.html')
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ error: 'React build not found. Run: cd client && npm run build' })
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`\nAurora v1.5 → http://localhost:${PORT}`);
  console.log(`Pipeline:      UK / AU Beauty Studios`);
  console.log(`Model:         claude-haiku-4-5 (scoring) + claude-sonnet-4-6 (available)`);
  console.log(`Google Maps:   ${MAPS_KEY ? '✓' : '✗ GOOGLE_MAPS_KEY missing'}`);
  console.log(`Google CSE:    ${CSE_KEY && CSE_ID ? '✓ IG fallback active' : '✗ GOOGLE_CSE_KEY / GOOGLE_CSE_ID missing — Layer 3 disabled'}`);
  console.log(`Anthropic:     ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗ missing'}`);
  console.log(`Excel:         ${ExcelJS ? '✓' : '✗ run npm install exceljs'}`);
  console.log(`Shortlist:     ${shortlist.size} saved leads`);
  console.log(`Seen leads:    ${seenLeads.size} businesses\n`);
  console.log(`IG Enrichment: Layer 1 (site HTML) → Layer 2 (aggregator) → Layer 3 (Google CSE)\n`);
});