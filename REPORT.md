# Report

## What was built

Fleet Command is a frontend-only demo for National Truck & Van Rental. It uses Vite, React 18, strict TypeScript, Tailwind, shadcn-style components, Framer Motion, Zustand with persist, React Router, Recharts, TanStack Virtual, and d3-geo with world-atlas.

- **Seeded data.** One deterministic generator builds 1,312 vehicles with Irish registrations. It also builds 40 fictional customers, staff, technicians and mobile techs. Today's state has 9 VOR vehicles, 2 live breakdowns and 60 compliance items in the next 30 days (5 overdue or due within 48 hours). Both workshop boards are 75% full, 6 returns are waiting and there are unread messages. Every number on screen is computed from these records.
- **Operations lens.**
  - Today: greeting, four count-up tiles, and a "Needs you" feed where each item has one action and collapses when done.
  - Fleet: a virtualised list of all 1,312 vehicles with filters. Each vehicle opens a Spotify-style detail page with a compliance timeline, defects, history, documents and four actions.
  - Compliance radar: Book all proposes slots across both depots and a replacement matched to each, then notifies customers.
  - Workshop kanban for each depot: drag cards between columns or use the move menu. It shows bays and mobile techs.
  - Live: the Ireland map, the VOR list, and a breakdown flow you can step through.
  - Returns: before and after damage diagrams with tap-to-mark. The recharge builds itself and joins a queue with a running total.
  - Inbox: WhatsApp-style, with suggested replies and one-tap conversion to a job or booking.
  - Insights: charts with source chips.
- **Driver lens.** An iPhone-framed app: scan the code, see the vehicle, do the walkaround, flag a defect with fault, severity, photo and note, then submit. There is also a Breakdown button that shares location and shows recovery and the replacement.
- **Customer lens.** The Slaney Pharma Logistics portal with Fleet, Bookings, Requests (the website form options plus an extra vehicle) and Documents. Documents includes a generated compliance pack preview.
- **Walkthrough.** A welcome card and a 10-step story with a spotlight, a glass card and a visible tap indicator. Back, Next, Skip, the arrow keys and Esc all work. The ? button restarts it and Reset demo is in the profile menu. Every state change in the story is real, so the client can poke around afterwards.

## Checks run

- `npm run build`: passes with zero TypeScript errors.
- Playwright screenshots of every screen at 1440x900 and 390x844, plus every tour step at 1440x900. I looked at each one and fixed overflow, clipping and placement issues, then re-shot.
- The full tour runs three times in a row, with Reset demo between runs. The end state is checked after each run: defect, job, replacement, customer notice, bookings and recharge.
- Grep of UI strings for em dashes, lorem, TODO and the banned words: clean.
- All vehicle illustrations checked side by side at `/__art`.

## What I could not do

- **The NTVR logo files.** The network proxy blocked ntvr.ie, so the logo is a faithful stand-in wordmark and the yellow is #FFCD00 rather than sampled from the file. Both are a one-line swap (see DECISIONS.md).
- **ui-consistency-standard.md.** It was not on this machine. The build ran in a cloud container, not on your Mac. The UI follows section 3 of the brief.
- **The dev server on your Mac.** It was left running in the container on port 5173. On your Mac, run `npm install && npm run dev`.

## Talk track

1. **Today.** "This is Martin's morning. What's out working, what's off the road, what needs him. It's all on one screen and every number comes off the actual records, nobody typed them in."
2. **Driver lens.** "Now we're the driver, down in a yard in Naas at twenty to eight. He scans the sticker on the dash, no login, no app to set up. He goes down the checks, the tail-lift's not working, so he taps it, takes a photo and sends it. Under a minute."
3. **Back to Today.** "Back on Martin's screen, and there it is at the top already. No phone call, no paper sheet turning up on Friday. One tap and it's a workshop job."
4. **Workshop.** "It's landed on the Dublin board with a bay and a tail-lift tech on it. And it's already found the right replacement, a tail-lift rigid sitting in Ballycoolin. Hit dispatch and that's on the road."
5. **Customer lens.** "This is what Slaney see on their side. Replacement on the way, here's the ETA. They didn't have to ring anyone, and nobody had to ring them."
6. **Compliance.** "Here's everything due in the next month, CVRTs, 13-weeks, tachos, tail-lifts, fridge and probe calibrations, tax, colour-coded by week. Tick this week, book all, and it spreads them across both workshops and puts a matching replacement against each one. Customers get told automatically."
7. **Live.** "This is the live picture. Two breakdowns going on right now, and every vehicle that's off the road, why, how long it's been off, and when it's back. Nobody's surprised by downtime anymore."
8. **Returns.** "A van's just come back off hire. You've got how it went out and how it came back side by side. Tap the scuff on the side, and the fuel and the extra mileage are already worked out. Raise it and it's queued for invoicing. That's money that used to just disappear."
9. **Insights.** "And this is how the fleet's actually doing. Downtime, compliance on time, what we've clawed back in recharges, utilisation by vehicle type, and which units are worth looking at for defleet."
10. **Close.** "So that's it. One system for the whole operation, and it's built around the way National already works, sitting on top of the systems you've already got."
