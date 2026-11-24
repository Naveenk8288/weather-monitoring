# FPGA-Based Weather Condition Detector and Alert System Using Verilog HDL — 3D Interactive Showcase

Interactive, scroll-driven 3D engineering showcase for **Digital Design and Computer Organization (`BAML24303`)**, Department of AI & ML, **Global Academy of Technology, Bengaluru**.

## Features
- **3D Hero Workbench**: Procedural Basys 3 Artix-7 FPGA board floating over an animated circuit-trace grid with instanced electric pulses, wired to a DHT11 sensor, Rain Sensor module, and live 16×2 HD44780 LCD with mouse parallax & scroll-driven camera motion.
- **Exploded 3D System Architecture**: GSAP ScrollTrigger camera flight across all 7 datapath blocks plus the overhead Control FSM sending `start`/`done` handshakes. Hover to lift, click to inspect ports, Artix-7 resource estimates, and Verilog snippets.
- **Interactive 3D Moore Control FSM**: 5 glowing state spheres (`IDLE 000`, `REQUEST 001`, `MEASURE 010`, `EVALUATE 011`, `DISPLAY 100`), traveling transition token, Play/Pause/Step/Reset/Speed controls, immediate **Async reset → IDLE**, live `s2 s1 s0` & Moore outputs, and collapsible State Table + Boolean `D2/D1/D0` equations.
- **3D/2.5D DHT11 Single-Wire Protocol Visualizer**: Animates the 18 ms low start pulse, 30 µs release, 80 µs/80 µs sensor response, 40 serial data bits against the **54 µs threshold**, a 40-cell 3D shift register (Humidity 16b | Temp 16b | Checksum 8b), 6-bit bit counter (`0–39`), and a **"Corrupt the frame"** toggle verifying checksum rejection (`S_IDLE`, `data_ready` never fires).
- **3D Gate-Level Logic Explorer**: Live glowing comparators (`HOT >= 40`, `COLD <= 10`, `HUM_HIGH >= 80`), status encoder (`status[1] = HOT`, `status[0] = ~HOT & ~COLD`), and explicit **2-to-1 Enable MUX (`Y = S'·I0 + S·I1`) + D Flip-Flop** with async reset.
- **Live 3D FPGA Weather Simulator (+ Sticky Quick Dock)**: Exact Verilog combinational & registered sequential logic with side-by-side "Input vs Registered Output" clock-edge delay monitor, asynchronous reset, dynamic 3D weather effects (heat haze + sun glow, snow particles, falling rain, humidity fog), 3D LCD + tri-color Alert LEDs, and all 4 report presets.
- **Scrubbable Timing Diagram & `$monitor` Console**: Interactive SVG waveform across `T1–T9` (`41°C / 82%`, `COND: 01 → 10 HOT`) with cycle-by-cycle explanations and synchronized terminal log.
- **Complete Verilog HDL Viewer**: Prism-highlighted tabs for all 6 modules (`weather_monitor.v`, `fsm_control.v`, `dht11_interface.v`, `lcd_driver.v`, `weather_top.v`, `tb_weather_top.v`) with Copy, `.v` Download, and Verilog-to-Hardware realization mapping tables.
- **Campus Weather Kiosk, Specs, Flip Cards, 3D Future Roadmap & Team**.

## Tech Stack
- **React 18 + Vite + TypeScript + Tailwind CSS**
- **Three.js** via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- **GSAP ScrollTrigger** + **Framer Motion**
- **PrismJS** (Verilog syntax highlighting)
- **Vitest** (pure TypeScript simulation unit tests in `src/sim/`)

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Run unit tests for FSM, DHT11, and weather comparators/registers
npm test

# 4. Create an optimized production bundle
npm run build

# 5. Preview the production bundle locally
npm run preview
```

---

## Folder Structure

```text
src/
├── components/   # Page sections, navbar, loader, sticky simulator dock, timing SVG, code viewer
├── context/      # ThemeContext (Dark/Light) & SimulatorContext (shared RTL state)
├── data/         # Complete Verilog files, architecture blocks, timing cycles, project metadata
├── hooks/        # useIsMobile, useReducedMotion, useInView (viewport WebGL gating)
├── scenes/       # Procedural 3D Three.js/R3F hardware models & 8 interactive scenes
└── sim/          # Pure TypeScript Verilog-exact simulation engines + Vitest unit tests
```

---

## Deployment Guide

### Option 1: Vercel (Recommended)
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset is auto-detected as **Vite**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **Deploy**.

### Option 2: Netlify
1. Push this repository to Git.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Configure build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Click **Deploy site** (or run `npx netlify-cli deploy --prod --dir=dist`).

### Option 3: GitHub Pages
1. In `vite.config.ts`, add `base: '/<your-repo-name>/'`.
2. Build with `npm run build`.
3. Publish the `dist/` folder via GitHub Actions (`actions/deploy-pages`) or `gh-pages`.

---

## Screenshot Checklist (For Report & Presentation)
- [ ] **01 — Boot Loader**: "Powering on FPGA..." screen showing `XC7A35T` progress bar.
- [ ] **02 — 3D Hero Workbench**: Full-bleed Basys 3 board, glowing circuit grid, DHT11, Rain Sensor & 16×2 LCD (both Dark & Light modes).
- [ ] **03 — Exploded 3D System Architecture**: Mid-flight view showing overhead Control FSM handshakes + open RTL Side Inspector drawer.
- [ ] **04 — Control FSM**: Active state glowing with traveling transition token + expanded State Table & `D2/D1/D0` equations.
- [ ] **05 — DHT11 Visualizer (Valid vs Corrupt)**: Capture both a valid `41°C / 82%` frame (`0x7B` pass, `data_ready=1`) and **"Corrupt the frame"** ON (`CHECKSUM FAIL`, `data_ready=0`).
- [ ] **06 — Gate-Level Explorer**: Highlight `S (eval_en) = 0` showing amber `Q → I0` feedback hold path vs `S = 1` loading new comparator bits.
- [ ] **07 — Live Weather Simulator (All 4 Presets)**:
  - [ ] Scenario 1: `20°C, 70%, Dry` → `NORMAL (01)`
  - [ ] Scenario 2: `45°C, 90%, Rain` → `HOT (10)` + Heat Haze + Raindrops + Red/Blue/Cyan LEDs
  - [ ] Scenario 3: `35°C, 50%, Dry` → `NORMAL (01)`
  - [ ] Scenario 4: `5°C, 85%, Dry` → `COLD (00)` + Snowflakes + Fog + Blue Humidity LED
  - [ ] Pending Clock Edge diff ("Combinational D" vs "Registered Q") & Async Reset instant `01` recovery.
- [ ] **08 — Timing Diagram & `$monitor`**: Scrubbed to `T7` showing `cond[1:0]` changing `01 → 10 (HOT)` and console transcript.
- [ ] **09 — Verilog Code & Hardware Realization**: `weather_top.v` and `dht11_interface.v` alongside hardware mapping tables.
- [ ] **10 — Campus Weather Kiosk, 3D Future Roadmap & Team Section**: Showing GAT Bengaluru, Prof B K S V L Varaprasad, all 4 team USNs, and `BAML24303` footer.
