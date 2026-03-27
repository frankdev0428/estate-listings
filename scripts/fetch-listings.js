// ============================================================
// fetch-listings.js
// Fetches Bay Area property listings from Realty in US API
// (RapidAPI) and inserts them into your Supabase database
//
// SETUP:
//   1. npm install @supabase/supabase-js node-fetch dotenv
//   2. Create a .env file with your keys (see below)
//   3. node fetch-listings.js
// ============================================================

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { log } from "node:console";
dotenv.config({ path: ".env.local"});

//DRY run
const DRY_RUN = false; // ← set to false when ready to actually run

// ── Config ──────────────────────────────────────────────────
const RAPIDAPI_KEY      = process.env.RAPIDAPI_KEY;
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Target cities & zip codes ────────────────────────────────
// Map your existing city IDs to the zip codes you want to fetch
const CITY_TARGETS = [
   { city_id: "11111111-1111-4111-a111-111111111111", city: "San Leandro",   state: "CA", postal_code: "94577" },
   { city_id: "22222222-2222-4222-a222-222222222222", city: "Hayward",       state: "CA", postal_code: "94541" },
   { city_id: "33333333-3333-4333-a333-333333333333", city: "Castro Valley", state: "CA", postal_code: "94546" },
   { city_id: "44444444-4444-4444-a444-444444444444", city: "Oakland",       state: "CA", postal_code: "94611" },
  { city_id: "55555555-5555-4555-a555-555555555555", city: "Fremont",       state: "CA", postal_code: "94538" },
];

// random rotate agent 
const AGENT_IDS = [
  "a1b2c3d4-0004-4000-a000-000000000004",
  "a1b2c3d4-0006-4000-a000-000000000006",
  "a1b2c3d4-0008-4000-a000-000000000008",
  "a1b2c3d4-0011-4000-a000-000000000011",
  "a1b2c3d4-0012-4000-a000-000000000012",
];

function randomAgent() {
  return AGENT_IDS[Math.floor(Math.random() * AGENT_IDS.length)];
}



///

const LISTINGS_PER_CITY = 10; // how many listings to fetch per city

// ── Step 1: Fetch listings from RapidAPI ────────────────────
async function fetchListings(postal_code) {
  const url = "https://realty-in-us.p.rapidapi.com/properties/v3/list";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "realty-in-us.p.rapidapi.com",
    },
    body: JSON.stringify({
      limit: LISTINGS_PER_CITY,
      offset: 0,
      postal_code,
      status: ["for_sale"],
      sort: {
        direction: "desc",
        field: "list_date",
      },
    }),
  });

  if (!response.ok) {
    console.error(`API error for ${postal_code}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data?.data?.home_search?.results ?? [];
}

// fet photos

async function fetchPhotos(property_id) {
  const url = `https://realty-in-us.p.rapidapi.com/properties/v3/get-photos?property_id=${property_id}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "realty-in-us.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    console.error(`  Photo fetch error for ${property_id}: ${response.status}`);
    return [];
  }

  const data = await response.json();
// //DEBUG - show full response stru ture
// console.log(`DEBUG photo repsonse:`, JSON.stringify(data).slice(0,500));

  // Photos are nested under home.photos
  // return data?.data?.home?.photos ?? [];
  const photos =  data?.data?.home_search?.results?.[0]?.photos ?? [];
  // Upgrade thumbnail URLs to full resolution
const fullRes = photos.map(p => ({
  ...p,
  href: p.href.replace(/s\.jpg$/, "od-w1280_h960_x2.jpg")
}));

return fullRes;
}
// ── Step 2: Map API response to your listings schema ─────────
function mapToListing(raw, city_id, photos = []) {
  const loc  = raw?.location?.address ?? {};
  const desc = raw?.description ?? {};

  const coverImage  = photos[0]?.href ?? null;
  const extraPhotos = photos.slice(1).map((p, i) => ({
    url:        p.href,
    alt_text:   `Photo ${i + 2}`,
    is_cover:   false,
    sort_order: i + 1,
  }));

  return {
    listing: {
      title:         `${desc.beds ?? "?"}BD ${normalizeType(desc.type)} in ${loc.city ?? ""}`,
      price:         raw?.list_price ?? null,
      address:       loc.line ?? null,
      city_id:       city_id,
      agent_id:      randomAgent(),
      bedrooms:      desc.beds ?? null,
      bathrooms:     desc.baths_consolidated ?? desc.baths ?? null,
      sqft:          desc.sqft ?? null,
      image_url:     coverImage,
      images:        [],
      description:   desc.text ?? null,
      property_type: normalizeType(desc.type),
      year_built:    desc.year_built ?? null,
      parking:       desc.garage ?? 0,
      hoa_fee:       null,
    },
    extraPhotos,
    coverImage,
  };
}

// ── Step 3: Insert into Supabase ─────────────────────────────
async function insertListing(mapped) {
  const { listing, extraPhotos, coverImage } = mapped;

  const { data: inserted, error } = await supabase
    .from("listings")
    .insert(listing)
    .select("id")
    .single();

  if (error) {
    console.error(`  Insert error: ${error.message}`);
    return;
  }

  const listingId = inserted.id;
  console.log(`  Inserted: ${listing.title} → ${listingId}`);

  if (coverImage) {
    await supabase.from("listing_images").insert({
      listing_id: listingId,
      url:        coverImage,
      alt_text:   `Cover – ${listing.title}`,
      is_cover:   true,
      sort_order: 0,
    });
  }

  if (extraPhotos.length > 0) {
    const imageRows = extraPhotos.map((p) => ({
      listing_id: listingId,
      url:        p.url,
      alt_text:   p.alt_text,
      is_cover:   false,
      sort_order: p.sort_order,
    }));

    const { error: imgError } = await supabase
      .from("listing_images")
      .insert(imageRows);

    if (imgError) {
      console.error(`  Image insert error: ${imgError.message}`);
    } else {
      console.log(`  Inserted ${imageRows.length} images`);
    }
  }
}
// ── Helpers ──────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeType(type) {
  if (!type) return "House";
  const t = type.toLowerCase();
  if (t.includes("condo"))     return "Condo";
  if (t.includes("town"))      return "Townhouse";
  if (t.includes("multi"))     return "Multi-Family";
  if (t.includes("land"))      return "Land";
  return "House";
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(`Starting listing import... ${DRY_RUN ? "(DRY RUN — no API calls, no inserts)" : ""}\n`);

  if (DRY_RUN) {
    console.log("✓ SUPABASE_URL:", SUPABASE_URL ? "found" : "MISSING");
    console.log("✓ SUPABASE_KEY:", SUPABASE_KEY ? "found" : "MISSING");
    console.log("✓ RAPIDAPI_KEY:", RAPIDAPI_KEY ? "found" : "MISSING");
    console.log("\n✓ Cities to fetch:");
    for (const t of CITY_TARGETS) {
      console.log(`   ${t.city} (${t.postal_code}) → city_id: ${t.city_id}`);
    }
    console.log(`\n✓ Listings per city: ${LISTINGS_PER_CITY}`);
    console.log(`✓ Total API calls needed: ${CITY_TARGETS.length * 2} (1 list + 1 photo per city)`);
    console.log(`✓ Total listings to insert: ${CITY_TARGETS.length * LISTINGS_PER_CITY}`);
    console.log(`✓ Agent IDs available: ${AGENT_IDS.length}`);
    console.log("\nDry run complete. Set DRY_RUN = false to run for real.");
    return;
  }

  for (const target of CITY_TARGETS) {
    console.log(`\nFetching ${LISTINGS_PER_CITY} listings for ${target.city} (${target.postal_code})...`);

    const raw = await fetchListings(target.postal_code);
    console.log(`  Found ${raw.length} results from API`);

    for (const item of raw) {
      const property_id = item?.property_id;
      console.log(`  Fetching photos for ${item?.location?.address?.line}...`);

      const photos = await fetchPhotos(property_id);
      console.log(`  Found ${photos.length} photos`);

      const mapped = mapToListing(item, target.city_id, photos);
      await insertListing(mapped);

      // Delay between each listing to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    // Delay between cities
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone!");
}

main().catch(console.error);
