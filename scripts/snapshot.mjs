// Refreshes the songbook built into the app, so a phone with no signal on its
// first open still has every song. Run before each store build:
//
//   node scripts/snapshot.mjs                      # from the live website
//   node scripts/snapshot.mjs http://localhost:3000 # from a local copy
//
// A local copy writes its own address into every picture; those are rewritten
// to the live website's, which is where the phone will fetch them from.
import { writeFile } from "node:fs/promises";

const live = (process.env.EXPO_PUBLIC_SITE_URL || "https://hoziana-choir.vercel.app").replace(/\/+$/, "");
const source = (process.argv[2] || live).replace(/\/+$/, "");

const response = await fetch(`${source}/api/app/content`);
if (!response.ok) throw new Error(`${source} answered ${response.status}`);
let text = await response.text();
if (source !== live) text = text.split(source).join(live);
const content = JSON.parse(text);
if (content.schema !== 1) throw new Error(`Unexpected schema ${content.schema}`);

await writeFile(new URL("../assets/content-snapshot.json", import.meta.url), JSON.stringify(content));
console.log(`Saved ${content.songs.length} songs, ${content.videos.length} videos and ${content.updates.length} updates from ${source}.`);
