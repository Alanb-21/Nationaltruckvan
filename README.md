# Fleet Command for National Truck & Van Rental

A frontend-only client demo. It has no backend: everything runs in the browser and state is saved to localStorage.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

For a production build: `npm run build`, then `npm run preview`.

## Reset the demo

Click the avatar (MB) in the top right, then **Reset demo**. That brings back this morning's seeded state.

Starting the walkthrough also resets the demo.

## Restart the walkthrough

Click the **?** button in the top bar at any time. You can also choose **Show welcome** in the profile menu to bring back the welcome card.

Inside the walkthrough:
- Next and Back buttons, or the arrow keys, move between steps.
- Esc or Skip leaves it.
- The dots jump straight to a step.

## The three lenses

The segmented control in the top bar switches between them. All three read and write the same store.

- **Operations**: Martin's command centre. Today, Fleet, Compliance, Workshop, Live, Returns, Inbox and Insights. Press Cmd+K or Ctrl+K to search.
- **Driver**: the dashboard QR walkaround and breakdown app, shown in an iPhone frame.
- **Customer**: the portal for Slaney Pharma Logistics.

## Where things live

- `src/data/seed.ts`: the deterministic data generator (fixed seed, 1,312 vehicles).
- `src/store/index.ts`: the single Zustand store with persist and reset.
- `src/components/vehicles/VehicleArt.tsx`: the vehicle illustration set. `/__art` shows them all side by side.
- `src/components/IrelandMap.tsx`: the island-of-Ireland map (d3-geo with world-atlas 50m).
- `src/tour/`: the walkthrough engine and the 10-step story.
- `qa/`: Playwright scripts for screenshots and repeated tour runs.
