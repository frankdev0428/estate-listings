// ============================================================
// fetch-listings.js
// Fetches Bay Area property listings from Realty in US API
// (RapidAPI) and upserts them into your Supabase database
//
// SETUP:
//   1. npm install @supabase/supabase-js node-fetch dotenv
//   2. Create a .env.local file with your keys (see below)
//   3. node fetch-listings.js
// ============================================================

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── Config ──────────────────────────────────────────────────
const DRY_RUN = false; // ← set to false when ready to actually run

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ── Guard: validate env before doing anything ────────────────
function validateEnv() {
  const missing = [];
  if (!RAPIDAPI_KEY) missing.push("RAPIDAPI_KEY");
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_KEY) missing.push("SUPABASE_KEY");
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    console.error("   Check your .env.local file.");
    process.exit(1);
  }
}

validateEnv();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Target cities & zip codes ────────────────────────────────
const CITY_TARGETS = [
  { city_id: "11111111-1111-4111-a111-111111111111", city: "San Leandro",   state: "CA", postal_code: "94577" },
  { city_id: "22222222-2222-4222-a222-222222222222", city: "Hayward",       state: "CA", postal_code: "94541" },
   { city_id: "33333333-3333-4333-a333-333333333333", city: "Castro Valley", state: "CA", postal_code: "94546" },
   { city_id: "44444444-4444-4444-a444-444444444444", city: "Oakland",       state: "CA", postal_code: "94611" },
  { city_id: "55555555-5555-4555-a555-555555555555", city: "Fremont",       state: "CA", postal_code: "94538" },
   { city_id: "66666666-6666-4666-a666-666666666666", city: "San Francisco", state: "CA", postal_code: "94102" },
   { city_id: "77777777-7777-4777-a777-777777777777", city: "Berkeley",      state: "CA", postal_code: "94710" },
   { city_id: "88888888-8888-4888-a888-888888888888", city: "Sunnyvale",     state: "CA", postal_code: "94086" },
  { city_id: "99999999-9999-4999-a999-999999999999", city: "Concord",       state: "CA", postal_code: "94520" },
  { city_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", city: "San Mateo",     state: "CA", postal_code: "94401" },
 { city_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", city: "Santa Clara",   state: "CA", postal_code: "95050" },
  { city_id: "cccccccc-cccc-4ccc-cccc-cccccccccccc", city: "Richmond",      state: "CA", postal_code: "94801" },
  { city_id: "dddddddd-dddd-4ddd-dddd-dddddddddddd", city: "Daly City",     state: "CA", postal_code: "94015" },
   { city_id: "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee", city: "Vallejo",       state: "CA", postal_code: "94590" },
   { city_id: "ffffffff-ffff-4fff-ffff-ffffffffffff", city: "Redwood City",  state: "CA", postal_code: "94063" },
];

// ── Agent rotation ───────────────────────────────────────────
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

// ── Step 1: Fetch listings from RapidAPI ─────────────────────
const LISTINGS_PER_CITY = 10;

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
      sort: { direction: "desc", field: "list_date" },
    }),
  });

  if (!response.ok) {
    console.error(`API error for ${postal_code}: ${response.status}`);
    return [];
  }
console.log("RapidAPI quota remaining:", response.headers.get("x-ratelimit-requests-remaining"));
console.log("RapidAPI quota limit:", response.headers.get("x-ratelimit-requests-limit"));
  const data = await response.json();
  return data?.data?.home_search?.results ?? [];
}

// ── Fetch detail of a single listing ────────────────────────
async function fetchDetail(property_id) {
  const url = `https://realty-in-us.p.rapidapi.com/properties/v3/get-detail?property_id=${property_id}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "realty-in-us.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    console.error(`  Detail fetch error for ${property_id}: ${response.status}`);
    return {};
  }

  const data = await response.json();
  return data?.data?.home ?? {};
}

// ── Fetch photos ─────────────────────────────────────────────
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
  const photos = data?.data?.home_search?.results?.[0]?.photos ?? [];

  // Upgrade thumbnail URLs to full resolution
  return photos.map((p) => ({
    ...p,
    href: p.href.replace(/s\.jpg$/, "od-w1280_h960_x2.jpg"),
  }));
}

// ── Step 2: Map API response to your listings schema ─────────
function mapToListing(raw, detail, city_id, photos = []) {
  const loc   = raw?.location?.address ?? {};
  const desc  = raw?.description ?? {};
  const flags = raw?.flags ?? {};

  const detailDesc = detail?.description ?? {};
  const detailLoc  = detail?.location?.address ?? {};

  // Merge description — detail wins where available
  const beds      = detailDesc.beds        ?? desc.beds        ?? null;
  const baths     = detailDesc.baths       ?? desc.baths       ?? null;
  const bathsFull = detailDesc.baths_full  ?? desc.baths_full  ?? null;
  const bathsHalf = detailDesc.baths_half  ?? desc.baths_half  ?? null;
  const sqft      = detailDesc.sqft        ?? desc.sqft        ?? null;
  const lotSqft   = detailDesc.lot_sqft    ?? desc.lot_sqft    ?? null;
  const yearBuilt = detailDesc.year_built  ?? desc.year_built  ?? null;
  const garage    = detailDesc.garage      ?? desc.garage      ?? 0;
  const descText  = detailDesc.text        ?? desc.text        ?? null;
  const subType   = detailDesc.sub_type    ?? desc.sub_type    ?? null;

  // Virtual tours
  const virtualTours   = raw?.virtual_tours ?? detail?.virtual_tours ?? [];
  const hasVirtualTour = virtualTours.length > 0;
  const virtualTourUrl = virtualTours[0]?.href ?? null;

  // Open houses — stored separately
  const openHouses = raw?.open_houses ?? [];

  // Pet policy
  const petPolicy       = raw?.pet_policy ?? detail?.pet_policy ?? null;
  const petsAllowedCats = petPolicy?.cats ?? null;
  const petsAllowedDogs = petPolicy?.dogs ?? null;

  // Agent / brokerage info
  const branding        = raw?.branding?.[0] ?? {};
  const sourceAgentName = branding?.name ?? null;

  const advertiser      = raw?.advertisers?.[0] ?? {};
  const advertiserName  = advertiser?.name  ?? null;
  const advertiserEmail = advertiser?.email ?? null;

  const mlsSource     = raw?.source ?? {};
  const mlsAgents     = mlsSource?.agents ?? [];
  const mlsAgentName  = mlsAgents[0]?.agent_name  ?? null;
  const mlsOfficeName = mlsAgents[0]?.office_name ?? null;
  const mlsListingId  = mlsSource?.listing_id ?? null;
  const mlsId         = mlsSource?.id ?? null;

  // Coordinates
  const coord = loc?.coordinate ?? detailLoc?.coordinate ?? {};
  const lat   = coord?.lat ?? null;
  const lon   = coord?.lon ?? null;

  // Photos
  const coverImage  = photos[0]?.href ?? raw?.primary_photo?.href ?? null;
  const extraPhotos = photos.slice(1).map((p, i) => ({
    url:        p.href,
    alt_text:   `Photo ${i + 2}`,
    is_cover:   false,
    sort_order: i + 1,
  }));

  const estimatedValue = raw?.estimate?.estimate ?? detail?.estimate?.estimate ?? null;
  const status = normalizeStatus(flags);

  return {
    listing: {
      // ── Existing columns ──────────────────────────────────
      title:         `${beds ?? "?"}BD ${normalizeType(desc.type)} in ${loc.city ?? ""}`,
      price:         raw?.list_price ?? null,
      address:       loc.line ?? null,
      city_id,
      agent_id:      randomAgent(),
      bedrooms:      beds,
      bathrooms:     baths,
      sqft,
      image_url:     coverImage,
      description:   descText,
      property_type: normalizeType(desc.type),
      year_built:    yearBuilt,
      parking:       garage,
      hoa_fee:       null,

      // ── New columns ───────────────────────────────────────
      source_property_id:   raw?.property_id    ?? null,
      source_listing_id:    raw?.listing_id     ?? null,
      mls_listing_id:       mlsListingId,
      mls_id:               mlsId,
      listing_url:          raw?.href           ?? null,
      street_view_url:      raw?.location?.street_view_url ?? null,

      list_price_min:       raw?.list_price_min ?? null,
      list_price_max:       raw?.list_price_max ?? null,
      last_sold_price:      raw?.last_sold_price ?? null,
      last_sold_date:       raw?.last_sold_date  ?? null,
      price_reduced_amount: raw?.price_reduced_amount ?? null,
      estimated_value:      estimatedValue,

      lot_sqft:             lotSqft,
      baths_full:           bathsFull,
      baths_half:           bathsHalf,
      property_sub_type:    subType,
      photo_count:          raw?.photo_count ?? photos.length,

      status,
      is_new_listing:       flags?.is_new_listing      ?? false,
      is_price_reduced:     flags?.is_price_reduced     ?? false,
      is_new_construction:  flags?.is_new_construction  ?? false,
      is_foreclosure:       flags?.is_foreclosure       ?? false,
      is_contingent:        flags?.is_contingent        ?? false,
      is_pending:           flags?.is_pending           ?? false,

      has_matterport:       raw?.matterport   ?? false,
      has_virtual_tour:     hasVirtualTour,
      virtual_tour_url:     virtualTourUrl,

      pets_allowed_cats:    petsAllowedCats,
      pets_allowed_dogs:    petsAllowedDogs,

      source_agent_name:    mlsAgentName  ?? advertiserName  ?? sourceAgentName,
      source_agent_email:   advertiserEmail ?? null,
      source_office_name:   mlsOfficeName  ?? null,

      latitude:             lat,
      longitude:            lon,
      postal_code:          loc?.postal_code ?? null,
      county_fips:          raw?.location?.county?.fips_code ?? null,

      list_date:            raw?.list_date ?? null,
      updated_at:           new Date().toISOString(),
    },
    extraPhotos,
    coverImage,
    openHouses,
  };
}

// ── Step 3: Upsert into Supabase ─────────────────────────────
//
// Uses source_property_id as the conflict key so re-running
// the script updates existing rows instead of duplicating them.
// Requires a UNIQUE constraint on listings(source_property_id).
//
async function upsertListing(mapped) {
  const { listing, extraPhotos, coverImage, openHouses } = mapped;

  if (!listing.source_property_id) {
    console.warn(`  ⚠ Skipping — no source_property_id for: ${listing.title}`);
    return;
  }

  const { data: upserted, error } = await supabase
    .from("listings")
    .upsert(listing, { onConflict: "source_property_id" })
    .select("id")
    .single();

  if (error) {
    console.error(`  ❌ Upsert error: ${error.message}`);
    return;
  }

  const listingId = upserted.id;
  console.log(`  ✓ Upserted: ${listing.title} → ${listingId}`);

  // ── Images: delete old ones, re-insert fresh ─────────────
  await supabase.from("listing_images").delete().eq("listing_id", listingId);

  const imageRows = [];

  if (coverImage) {
    imageRows.push({
      listing_id: listingId,
      url:        coverImage,
      alt_text:   `Cover – ${listing.title}`,
      is_cover:   true,
      sort_order: 0,
    });
  }

  for (const p of extraPhotos) {
    imageRows.push({
      listing_id: listingId,
      url:        p.url,
      alt_text:   p.alt_text,
      is_cover:   false,
      sort_order: p.sort_order,
    });
  }

  if (imageRows.length > 0) {
    const { error: imgError } = await supabase
      .from("listing_images")
      .insert(imageRows);

    if (imgError) {
      console.error(`  ❌ Image insert error: ${imgError.message}`);
    } else {
      console.log(`  ✓ Inserted ${imageRows.length} image(s)`);
    }
  }

  // ── Open houses: delete-then-insert ──────────────────────
  await supabase.from("open_houses").delete().eq("listing_id", listingId);

  if (openHouses.length > 0) {
    const ohRows = openHouses.map((oh) => ({
      listing_id:  listingId,
      start_date:  oh.start_date,
      end_date:    oh.end_date,
      description: oh.description ?? null,
      time_zone:   oh.time_zone   ?? "PST",
    }));

    const { error: ohError } = await supabase
      .from("open_houses")
      .insert(ohRows);

    if (ohError) {
      console.error(`  ❌ Open house insert error: ${ohError.message}`);
    } else {
      console.log(`  ✓ Inserted ${ohRows.length} open house(s)`);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────
function normalizeType(type) {
  if (!type) return "House";
  const t = type.toLowerCase();
  if (t.includes("condo"))  return "Condo";
  if (t.includes("town"))   return "Townhouse";
  if (t.includes("multi"))  return "Multi-Family";
  if (t.includes("land"))   return "Land";
  return "House";
}

function normalizeStatus(flags) {
  if (!flags) return "for_sale";
  if (flags.is_pending)    return "pending";
  if (flags.is_contingent) return "contingent";
  return "for_sale";
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(`Starting listing import... ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  if (DRY_RUN) {
    console.log("✓ SUPABASE_URL:", SUPABASE_URL ? "found" : "MISSING");
    console.log("✓ SUPABASE_KEY:", SUPABASE_KEY ? "found" : "MISSING");
    console.log("✓ RAPIDAPI_KEY:", RAPIDAPI_KEY ? "found" : "MISSING");
    console.log("\n✓ Cities to fetch:");
    for (const t of CITY_TARGETS) {
      console.log(`   ${t.city} (${t.postal_code}) → city_id: ${t.city_id}`);
    }
    console.log(`\n✓ Listings per city:         ${LISTINGS_PER_CITY}`);
    console.log(`✓ Total API calls needed:    ${CITY_TARGETS.length * 3} (list + detail + photos per city)`);
    console.log(`✓ Total listings to insert:  ${CITY_TARGETS.length * LISTINGS_PER_CITY}`);
    console.log(`✓ Agent IDs available:       ${AGENT_IDS.length}`);
    console.log("\nDry run complete. Set DRY_RUN = false to run for real.");
    return;
  }

  for (const target of CITY_TARGETS) {
    console.log(`\nFetching ${LISTINGS_PER_CITY} listing(s) for ${target.city} (${target.postal_code})...`);

    const raw = await fetchListings(target.postal_code);
    console.log(`  Found ${raw.length} result(s) from API`);

    for (const item of raw) {
      const property_id = item?.property_id;
      console.log(`\n  Processing: ${item?.location?.address?.line}`);

      const [detail, photos] = await Promise.all([
        fetchDetail(property_id),
        fetchPhotos(property_id),
      ]);

      console.log(`  Detail fetched: ${Object.keys(detail).length} keys`);
      console.log(`  Photos fetched: ${photos.length}`);

      const mapped = mapToListing(item, detail, target.city_id, photos);
      await upsertListing(mapped);

      await new Promise((r) => setTimeout(r, 600));
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log("\n✓ Done!");
}

main().catch(console.error);
