// server.js — Aurora v1 (UK/AU beauty studio pipeline)
//
// FORKED FROM: lead-agent v7 (India pipeline)
// CHANGES FROM v7:
//   1. Removed hardcoded "India" from Maps query — now searches globally
//   2. Added beauty/lash/brow niche contexts (UK/AU pain points)
//   3. Rewired Claude output — LinkedIn message + Loom brief instead of WhatsApp pitch
//   4. Output mode toggle: "linkedin" vs "loom" (replaces language toggle)
//   5. Recalibrated default filters for UK/AU market (lower review thresholds)
//   6. Added 2 extra website quality checks: subdomain detection + "DM to book" signal
//   7. Budget reframed: $600–$1500 USD instead of INR
//
// FLOW:
//   Browser → Google Maps (60 raw results, filtered by UI thresholds)
//           → Site quality checker (6 criteria)
//           → Claude (niche-aware prompt → LinkedIn message + Loom brief)
//           → shortlist + Excel export

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
  'Name','Type','Address','Phone','Website','Score','Score Reason',
  'Pain Points','LinkedIn Message','Loom Brief','Follow Up',
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
    const widths = [28,12,35,18,30,8,40,45,60,60,50,50,14,14,22];
    ws.columns = EXCEL_HEADS.map((h,i) => ({ header:h, width:widths[i] }));
  }
  ws.addRow([
    lead.name||'', lead.type||'', lead.address||'', lead.phone||'',
    lead.website||'', lead.score||'', lead.scoreReason||'',
    lead.painPoints||'', lead.linkedinMessage||'', lead.loomBrief||'',
    lead.followUp||'', lead.googleMapsUrl||'',
    lead.outputMode||'linkedin', 'new', new Date().toLocaleString('en-GB')
  ]);
  await wb.xlsx.writeFile(EXCEL_PATH);
}

// ─── NICHE CONTEXT MAP ────────────────────────────────────────────────────────
// Maps niche keywords → specific pain points for that business type.
// Split into two sections: UK/AU beauty niches (primary) + legacy India niches (kept for compatibility)
const NICHE_CONTEXT = {

  // ── UK / AU BEAUTY STUDIOS (primary targets) ─────────────────────────────
  'lash studio':    'Pain points: bookings managed entirely through Instagram DMs causing 2-3hrs daily admin, no deposit system so high no-show rate, clients cannot see pricing or portfolio without DMing, "lash studio near me" searches return competitors with proper booking sites, still on wixsite.com or squarespace.com subdomain meaning zero Google discoverability.',
  'lash artist':    'Pain points: bookings managed entirely through Instagram DMs causing 2-3hrs daily admin, no deposit system so high no-show rate, clients cannot see pricing or portfolio without DMing, "lash studio near me" searches return competitors with proper booking sites, still on wixsite.com or squarespace.com subdomain meaning zero Google discoverability.',
  'lash':           'Pain points: bookings managed entirely through Instagram DMs causing 2-3hrs daily admin, no deposit system so high no-show rate, clients cannot see pricing or portfolio without DMing, "lash studio near me" searches return competitors with proper booking sites.',
  'brow studio':    'Pain points: no online booking so clients DM for every appointment, no deposit collection meaning high no-show rate, pricing not visible online, still on wixsite.com or squarespace.com subdomain meaning zero Google discoverability, competitors with proper booking pages are taking their walk-in traffic.',
  'brow artist':    'Pain points: no online booking so clients DM for every appointment, no deposit collection meaning high no-show rate, pricing not visible online, still on wixsite.com or squarespace.com subdomain meaning zero Google discoverability.',
  'brow':           'Pain points: no online booking so clients DM for every appointment, no deposit collection meaning high no-show rate, pricing not visible online.',
  'beauty studio':  'Pain points: no online booking, appointments via DMs only causing missed revenue outside business hours, no portfolio gallery for new clients to assess work quality, site either missing or DIY template with broken contact form or booking widget.',
  'beauty salon':   'Pain points: no online booking causing phone tag and lost clients, appointments via calls/DMs only, no service menu with transparent pricing, clients cannot find them on Google because site has poor mobile performance.',
  'nail studio':    'Pain points: no online booking system, clients DM to check availability wasting hours daily, pricing inconsistency, no gallery showcasing nail work, competitors with proper booking pages are capturing their walk-in traffic.',
  'nail salon':     'Pain points: no online booking system, clients DM to check availability wasting hours daily, no gallery showcasing work quality, site either on free subdomain or visually outdated.',
  'microblading':   'Pain points: no online booking for consultations, no before/after gallery to build trust, no deposit system for high-value treatments, new clients cannot assess artist credibility without a proper portfolio site.',
  'aesthetics':     'Pain points: no online consultation booking, no treatment menu with clear pricing, no before/after gallery, clients research aesthetics providers heavily online before committing — a weak site loses them to competitors immediately.',
  'skin clinic':    'Pain points: no online booking for treatments, no service menu with pricing transparency, no practitioner credentials visible, clients research skin clinics extensively before booking — weak site loses them instantly.',
  'wellness studio':'Pain points: no class schedule visible online, no online booking or membership signup, clients discover studios via Google and immediately compare booking ease — studios without online booking lose most of these.',
  'pilates':        'Pain points: no online class booking, class schedule not visible, no membership signup flow, competitors using Mindbody or similar have seamless booking — manual DM booking is losing clients who want instant confirmation.',
  'yoga':           'Pain points: no online class schedule or booking, students contact via DMs for every session, no way to sell memberships or class packs online, competitors with booking systems convert discovery traffic that this studio loses.',

  // ── LEGACY INDIA NICHES (kept for backward compatibility) ─────────────────
  clinic:      'Pain points: no online appointment booking, patients search at night and find competitors, no way to verify credentials or see services online.',
  clinics:     'Pain points: no online appointment booking, patients search at night and find competitors, no way to verify credentials or see services online.',
  hospital:    'Pain points: no department listing, no OPD schedule online, patients call for basic info (wastes staff time), no doctor profiles.',
  hospitals:   'Pain points: no department listing, no OPD schedule online, patients call for basic info (wastes staff time), no doctor profiles.',
  dentist:     'Pain points: patients research dentists online before visiting, no before/after gallery, no appointment booking, anxiety patients need trust signals.',
  dental:      'Pain points: patients research dentists online before visiting, no before/after gallery, no appointment booking, anxiety patients need trust signals.',
  pharmacy:    'Pain points: no medicine availability checker, no home delivery option visible, customers go to competitors with apps.',
  doctor:      'Pain points: no online consultation option, patients cannot verify qualifications, no appointment system.',
  restaurant:  'Pain points: no online menu, no table reservation system, food delivery apps take 30% commission, customers cannot see ambience or specialties before visiting.',
  restaurants: 'Pain points: no online menu, no table reservation system, food delivery apps take 30% commission.',
  cafe:        'Pain points: no menu online, competitors have Instagram menus and pre-order systems, event bookings happen through scattered WhatsApp messages.',
  cafes:       'Pain points: no menu online, competitors have Instagram menus and pre-order systems.',
  bakery:      'Pain points: no online order system for cakes and custom orders, customers cannot see catalogue.',
  hotel:       'Pain points: no direct booking system (OTAs take 15-20% commission), no gallery showing rooms, amenities not clearly listed.',
  hotels:      'Pain points: no direct booking system (OTAs take 15-20% commission), no gallery showing rooms.',
  gym:         'Pain points: no online membership inquiry or trial class booking, class schedule not visible.',
  gyms:        'Pain points: no online membership inquiry or trial class booking, class schedule not visible.',
  salon:       'Pain points: appointments only via calls/WhatsApp causing no-shows, no service menu with prices visible online.',
  salons:      'Pain points: appointments only via calls/WhatsApp causing no-shows, no service menu with prices visible online.',
  spa:         'Pain points: no online booking for specific treatments, pricing not transparent.',
  beauty:      'Pain points: no online booking, no service catalogue with prices, before/after results not showcased.',
  school:      'Pain points: admissions process only via phone or in-person visits, no fee structure online.',
  college:     'Pain points: course details not accessible online, admissions information scattered.',
  coaching:    'Pain points: no online enrollment, course schedule and fees not visible.',
  lawyer:      'Pain points: no case type specialisation listed online, clients cannot assess credibility, no consultation booking system.',
  ca:          'Pain points: services and fees not listed, clients need to call for basic information.',
  accountant:  'Pain points: services and fees not listed, clients need to call for basic information.',
  travel:      'Pain points: packages not displayed online, customers book with competitors who have clear itineraries and pricing.',
};

function getNicheContext(niche) {
  const key = niche.toLowerCase().trim();
  if (NICHE_CONTEXT[key]) return NICHE_CONTEXT[key];
  for (const [k, v] of Object.entries(NICHE_CONTEXT)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return `Pain points: no website presence, customers search online and find competitors, no way to contact or book services digitally, missing trust signals for new customers.`;
}

// ─── OUTPUT MODE INSTRUCTIONS ─────────────────────────────────────────────────
// "linkedin" → generates LinkedIn connection message + follow-up
// "loom"     → generates Loom recording brief (what to show on screen)
// Both modes always generate both fields — mode just affects which Claude optimises for
const OUTPUT_MODE_INSTRUCTIONS = {
  linkedin: 'Optimise the linkedinMessage for maximum reply rate. It should feel like a real person wrote it — specific, warm, not salesy. The loomBrief should still be generated as bullet points the dev can use if they choose to record.',
  loom:     'Optimise the loomBrief for maximum visual impact — exactly what to show on screen, in what order, what to say. The linkedinMessage should still be generated as a clean connection message to send alongside the Loom link.',
};

// ─── GOOGLE MAPS DISCOVERY ───────────────────────────────────────────────────
// CHANGE FROM v7: Removed hardcoded "India" — query is now region-neutral
// The city field carries full location context e.g. "Leeds UK" or "Melbourne Australia"
async function searchGoogleMaps(niche, city, count, minRating = 3.5, minReviews = 15) {
  if (!MAPS_KEY) throw new Error('GOOGLE_MAPS_KEY not set in .env');
  console.log(`[Maps] ${niche} in ${city} | filters: ≥${minRating} rating, ≥${minReviews} reviews`);

  let allPlaces = [], pageToken = null, page = 0;

  while (page < 3) {
    const params = new URLSearchParams({
      // CHANGED: removed "India" suffix — city now carries full location context
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

  // CHANGED: default thresholds lowered for UK/AU market
  // UK/AU small businesses have fewer reviews than Indian businesses on average
  const qualified = allPlaces.filter(p =>
    (p.rating || 0) >= minRating && (p.user_ratings_total || 0) >= minReviews
  );
  console.log(`[Maps] Qualified (≥${minRating}, ≥${minReviews} reviews): ${qualified.length}`);

  const unseen = qualified.filter(p => !seenLeads.has(p.place_id));
  console.log(`[Maps] Unseen: ${unseen.length}`);

  if (!unseen.length) throw new Error(
    `All qualified ${niche} in ${city} already seen. Hit "Reset seen leads" to start over.`
  );

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
      // For UK/AU pipeline: phone is still useful but not hard-required
      // Some UK studios are website-only contact — keep them, just flag
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
// EXTENDED FROM v7: added 2 new checks specific to UK/AU beauty studios:
//   5. Subdomain detection — still on wixsite.com or squarespace.com = zero SEO
//   6. DM-to-book signal  — "dm to book" or "message to book" in page = major pain point
//
// All 6 checks:
//   1. Mobile responsive  — has <meta name="viewport"> tag
//   2. Booking system     — booking/appointment/schedule keywords present
//   3. Online booking     — WhatsApp booking OR no booking at all (UK/AU = neither)
//   4. Site freshness     — copyright year in footer
//   5. Subdomain          — still on free platform subdomain (wixsite/squarespace)
//   6. DM booking         — explicitly tells users to DM to book

async function checkWebsiteQuality(url) {
  if (!url) return null;

  // NEW: subdomain check before even fetching
  const isOnSubdomain = /wixsite\.com|squarespace\.com\/[^/]+$|weebly\.com|wordpress\.com|godaddysites\.com/i.test(url);

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; aurora-agent/1.0)' },
      redirect: 'follow',
    });
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
      'timely', 'shortcuts', 'acuity', 'vagaro', 'mindbody', 'booker'
    ];
    const hasBooking = bookingKeywords.some(k => lower.includes(k));

    // 3. NEW: DM-to-book signal — biggest pain point for beauty studios
    const dmKeywords = [
      'dm to book', 'dm us to book', 'message to book', 'message us to book',
      'inbox to book', 'contact us to book', 'whatsapp to book',
      'slide into', 'send us a message to', 'reach out to book'
    ];
    const hasDMBooking = dmKeywords.some(k => lower.includes(k));

    // 4. Site freshness
    const yearMatch    = lower.match(/copyright[^0-9]*([0-9]{4})|©\s*([0-9]{4})/);
    const copyrightYear = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : null;
    const currentYear   = new Date().getFullYear();
    const isStale       = copyrightYear && copyrightYear < currentYear - 2;

    // 5. Subdomain (already checked above, include in result)
    // 6. DM booking already checked above

    // Scoring: more issues = higher priority for outreach
    const issueCount = (
      (!isMobile    ? 1 : 0) +
      (!hasBooking  ? 1 : 0) +
      (hasDMBooking ? 1 : 0) +  // DM booking is a positive issue signal
      (isStale      ? 1 : 0) +
      (isOnSubdomain ? 1 : 0)
    );

    let verdict, pitchAngle;
    if (issueCount >= 3) {
      verdict    = 'poor';
      pitchAngle = 'complete rebuild needed — multiple critical issues';
    } else if (issueCount >= 1) {
      verdict    = 'outdated';
      pitchAngle = 'upgrade existing site — clear gaps to fix';
    } else {
      verdict    = 'decent';
      pitchAngle = 'minor improvements only';
    }

    // Override: DM booking alone is a strong signal regardless of other issues
    if (hasDMBooking) {
      verdict    = verdict === 'decent' ? 'outdated' : verdict;
      pitchAngle = 'DM booking detected — strong automation opportunity';
    }

    // Override: subdomain alone is a credibility killer
    if (isOnSubdomain && verdict === 'decent') {
      verdict    = 'outdated';
      pitchAngle = 'free subdomain — no Google presence, credibility issue';
    }

    return {
      url, isMobile, hasBooking, hasDMBooking,
      isOnSubdomain, copyrightYear, isStale,
      verdict, pitchAngle, issueCount
    };

  } catch (err) {
    return {
      url, isOnSubdomain,
      error: err.name === 'AbortError' ? 'timeout' : err.message,
      verdict: 'unverified',
      pitchAngle: 'could not check site — approach as unknown'
    };
  }
}

// ─── CLAUDE ANALYSIS ─────────────────────────────────────────────────────────
// FULLY REWRITTEN FROM v7:
//   - Target changed: UK/AU beauty studios instead of India businesses
//   - Budget: $600-1500 USD instead of INR
//   - Output: LinkedIn message + Loom brief + follow-up (not WhatsApp pitch)
//   - Language: English only (not Hindi/Hinglish)
//   - Scoring calibrated for UK/AU market signals

async function analyseLeads(businesses, service, niche, outputMode = 'linkedin') {
  console.log(`[Claude] Scoring | niche: ${niche} | outputMode: ${outputMode}`);

  const nicheContext      = getNicheContext(niche);
  const modeInstruction   = OUTPUT_MODE_INSTRUCTIONS[outputMode] || OUTPUT_MODE_INSTRUCTIONS.linkedin;

  const systemPrompt = `You are a lead scoring agent for a freelance web developer targeting independent beauty studios in the UK and Australia.
The developer offers: modern website builds, online booking systems, deposit collection flows, mobile-first design.
Typical project value: $600–$1,500 USD. Clients are solo or small-team studio owners.

NICHE CONTEXT for "${niche}":
${nicheContext}

SCORING RULES (1-10):
- 9-10: No website at all OR still on free subdomain (wixsite/squarespace.com) = perfect target
- 8:    Has own domain but DM-to-book detected OR no booking system = high priority
- 6-7:  Has booking but site is outdated/poor mobile = upgrade opportunity
- 4-5:  Decent site, minor issues = lower priority
- 1-3:  Polished site with working booking = skip, not worth approaching

OUTPUT MODE: ${outputMode.toUpperCase()}
${modeInstruction}

FOR EACH LEAD GENERATE:

1. linkedinMessage (3 sentences ONLY):
   - Sentence 1: Genuine specific compliment on their work or business (not generic)
   - Sentence 2: ONE specific issue you identified — be precise, not vague ("your booking button leads nowhere" not "your site has issues")
   - Sentence 3: Soft ask — "I recorded a 2-minute walkthrough of what I found — worth a look?"
   - Tone: Real person, not a salesperson. Warm but specific.
   - NEVER start with "I noticed" — vary the opening
   - NEVER mention you're from India or your location

2. loomBrief (exactly 3 bullet points):
   - Bullet 1: First thing to show on screen (what page, what element)
   - Bullet 2: The specific problem to demonstrate visually
   - Bullet 3: What the solution would look like / what to say at the end
   - Format: "bullet 1 | bullet 2 | bullet 3"

3. followUp (1 sentence):
   - For day 4 if no reply
   - Casual, not pushy — reference the original message briefly

RULES:
- Reference their actual review count or rating — makes it personal
- Reference ONE specific pain point from the niche context above
- All output in professional English only
- Score honestly — it is better to surface 3 great leads than 8 mediocre ones

YOUR ENTIRE RESPONSE = ONE RAW JSON OBJECT. Start with { end with }. No markdown. No preamble.

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
      "scoreReason": "one sentence explaining the score",
      "painPoints": "2-3 specific issues identified for this business",
      "pitch": "copy of linkedinMessage (legacy field — keep for compatibility)",
      "linkedinMessage": "3-sentence LinkedIn connection message",
      "loomBrief": "bullet 1 | bullet 2 | bullet 3",
      "followUp": "one sentence day-4 follow-up message",
      "type": "lash studio / brow studio / beauty salon / etc"
    }
  ],
  "summary": "one sentence overall finding about this batch"
}`;

  const businessData = businesses.map((b, i) => {
    let websiteInfo = 'NO WEBSITE — build from scratch, highest priority opportunity';
    if (b.website) {
      if (b.websiteQuality) {
        const wq = b.websiteQuality;
        if (wq.error) {
          websiteInfo = `${b.website} (could not verify — treat as unknown quality)`;
        } else {
          const issues = [];
          if (!wq.isMobile)       issues.push('NOT mobile responsive');
          if (!wq.hasBooking)     issues.push('NO booking system');
          if (wq.hasDMBooking)    issues.push('DM-TO-BOOK detected on site');
          if (wq.isOnSubdomain)   issues.push(`FREE SUBDOMAIN (${wq.url.split('/')[2]})`);
          if (wq.isStale)         issues.push(`STALE SITE (copyright ${wq.copyrightYear})`);
          websiteInfo = `${b.website}` +
            `\n     verdict: ${wq.verdict}` +
            `\n     issues: ${issues.length > 0 ? issues.join(', ') : 'none found'}` +
            `\n     pitch angle: ${wq.pitchAngle}`;
        }
      } else {
        websiteInfo = b.website;
      }
    }
    return `${i+1}. ${b.name}` +
    `\n   Type: ${b.type}` +
    `\n   Address: ${b.address}` +
    `\n   Phone: ${b.phone || 'not listed'}` +
    `\n   Website: ${websiteInfo}` +
    `\n   Rating: ${b.rating || 'n/a'} (${b.reviewCount || 0} reviews)`;
  }).join('\n\n');

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
  console.log('[Claude] Response (first 300):\n', rawJSON.slice(0,300));

  let parsed;
  try { parsed = JSON.parse(rawJSON); } catch {}
  if (!parsed) { try { parsed = JSON.parse(rawJSON.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()); } catch {} }
  if (!parsed) { const m = rawJSON.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch {} } }
  return parsed;
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.post('/api/leads', async (req, res) => {
  const {
    niche, city, service,
    count      = 5,
    minRating  = 3.5,   // CHANGED: lowered from 4.0 for UK/AU market
    minReviews = 15,    // CHANGED: lowered from 50 for UK/AU market
    outputMode = 'linkedin'  // CHANGED: replaces "language" param
  } = req.body;

  if (!niche || !city || !service)
    return res.status(400).json({ error: 'niche, city, and service are required' });

  try {
    const businesses = await searchGoogleMaps(
      niche, city, parseInt(count),
      parseFloat(minRating), parseInt(minReviews)
    );

    console.log(`[Website] Checking ${businesses.filter(b=>b.website).length} sites...`);
    const siteChecks = await Promise.allSettled(
      businesses.map(b => b.website ? checkWebsiteQuality(b.website) : Promise.resolve(null))
    );
    businesses.forEach((b, i) => {
      const result = siteChecks[i];
      b.websiteQuality = (result.status === 'fulfilled') ? result.value : null;
      if (b.websiteQuality) {
        const wq = b.websiteQuality;
        const flags = [];
        if (wq.hasDMBooking)  flags.push('DM-TO-BOOK');
        if (wq.isOnSubdomain) flags.push('SUBDOMAIN');
        console.log(`[Website] ${b.name}: ${wq.verdict || wq.error}${flags.length ? ` [${flags.join(', ')}]` : ''}`);
      }
    });

    const parsed = await analyseLeads(businesses, service, niche, outputMode);
    if (!parsed?.leads?.length)
      return res.status(500).json({ error: 'Could not score leads. Check terminal.' });

    const bizByName = {};
    businesses.forEach(b => { bizByName[b.name.toLowerCase().trim()] = b; });

    parsed.leads = parsed.leads.map((lead, i) => {
      const key = (lead.name || '').toLowerCase().trim();
      const src = bizByName[key] || businesses[i] || {};
      return {
        ...src, ...lead,
        googleMapsUrl:  src.googleMapsUrl || lead.googleMapsUrl,
        id:             src.id || `${Date.now()}-${i}`,
        outputMode,
        websiteQuality: src.websiteQuality || null,
        // Ensure new fields always exist even if Claude missed them
        linkedinMessage: lead.linkedinMessage || lead.pitch || '',
        loomBrief:       lead.loomBrief || '',
        followUp:        lead.followUp || '',
        pitch:           lead.linkedinMessage || lead.pitch || '', // legacy compat
      };
    });

    console.log(`[Done] ${parsed.leads.length} leads | mode: ${outputMode}\n`);
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
})

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`\nAurora v1 → http://localhost:${PORT}`);
  console.log(`Pipeline:      UK / AU Beauty Studios`);
  console.log(`Google Maps:   ${MAPS_KEY ? '✓' : '✗ GOOGLE_MAPS_KEY missing'}`);
  console.log(`Anthropic:     ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗ missing'}`);
  console.log(`Excel:         ${ExcelJS ? '✓' : '✗ run npm install exceljs'}`);
  console.log(`Shortlist:     ${shortlist.size} saved leads`);
  console.log(`Seen leads:    ${seenLeads.size} businesses\n`);
});