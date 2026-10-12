# Decisions

One line each, for anything the brief left open.

- Built in a Linux cloud container, not on the Mac. `mdfind` does not exist there and a full filesystem search found no `ui-consistency-standard.md`, so the UI follows section 3 of the brief alone. If you drop the standard into `docs/`, the tokens to bring into line are all in `tailwind.config.ts` and `src/index.css`.
- The proxy blocked ntvr.ie, so the logo files could not be downloaded. `src/components/Logo.tsx` is a stand-in wordmark in NTVR navy and yellow. Swap in `logo-white.webp` when you have it.
- Accent yellow set to #FFCD00 (a close match for NTVR livery yellow) because the logo could not be sampled. It is one token (`--accent`) in `src/index.css`.
- shadcn/ui pattern used (Radix primitives, cva, tailwind-merge) with the components written into `src/components/ui`, not pulled in by the CLI. Same result, fully restyled.
- Added `topojson-client` to turn the world-atlas TopoJSON into GeoJSON for d3-geo. The 50m atlas is lazy-loaded, so it only downloads when the map is opened.
- The demo clock is today's date, starting at 07:44 machine local time and moving forward in real time. The morning story, the 07:42 driver report and "Morning, Martin" always line up.
- The seed is rebuilt from a fixed seed on every load and only changes are saved to localStorage, which keeps storage small. Saved state resets itself on a new calendar day, so the relative dates stay right.
- Starting the walkthrough, from the welcome card or the ? button, resets the demo first. That way the script always lines up, whatever someone clicked beforehand.
- Breakdown vehicles keep the status "On hire" and are counted as live breakdowns, separate from the 9 VOR. The Today tile reads "9 off road, 2 live breakdowns on top".
- Returns waiting for check-in stay "On hire" until check-in finishes, then become "Available".
- 4x4 commercials and dropsides are folded into the existing families (dropside sits with tipper) so the illustration set stays at the nine drawings the brief lists. The refrigerated van reuses the high-roof van drawing with a roof-mounted fridge unit.
- Motor tax is renewed by the office. Booking it creates no workshop job and needs no replacement vehicle, and it shows as "Renewal filed, no downtime".
- Recharge amounts (damage, fuel, excess mileage) are shown in EUR because the brief asks for a running total recovered. Rental rates and pricing are never shown.
- Registrations use non-breaking hyphens so they never wrap across lines. Search accepts normal hyphens.
- Tabular figures go on every number through the `.num` class. Registrations are left proportional because Inter's tabular set makes hyphens noticeably wider.
- The nearside diagram shows the vehicle facing left, because the nearside is the left side in Ireland.
- Commits were made locally after each phase. The branch was pushed to GitHub only when you asked. A private claude.ai page hosts the hash-router build (`VITE_HASH_ROUTER=1 npx vite build --base ./ --outDir dist-artifact`) so it can be viewed without running anything.
