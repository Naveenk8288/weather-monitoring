export const PROJECT_META = {
  title: 'FPGA-Based Weather Condition Detector and Alert System Using Verilog HDL',
  shortTitle: 'FPGA Weather Monitor',
  courseName: 'Digital Design and Computer Organization',
  courseCode: 'BAML24303',
  department: 'Department of Artificial Intelligence & Machine Learning',
  college: 'Global Academy of Technology, Bengaluru',
  address: 'Ideal Homes Township, Rajarajeshwari Nagar, Bengaluru, Karnataka 560098, India',
  naacBadge: 'NAAC Accredited Institution',
  facultyGuide: 'Prof B K S V L Varaprasad',
  team: [
    { name: 'Naveena Kanakannanavar', usn: '1GA25AI030', role: 'DHT11 Protocol & Testbench Verification' },
    { name: 'Goutham S', usn: '1GA25AI012', role: 'RTL Architecture & FSM Design' },
    { name: 'Chetan Kumar', usn: '1GA25AI009', role: 'Condition Decoder & Gate-Level Synthesis' },
    { name: 'Mithun', usn: '1GA26AI405', role: 'LCD Driver FSM & Hardware Integration' }
  ]
};

export const OVERVIEW_CONTENT = {
  abstract:
    'Real-time environmental monitoring demands deterministic latency, low power consumption, and fail-safe alert generation that software-polled microcontrollers often struggle to guarantee under heavy interrupt load. This project presents a complete hardware-accelerated Weather Condition Detector and Alert System designed in synthesizable Verilog HDL and targeted at the Xilinx Artix-7 (Basys 3) FPGA. The architecture integrates a 5-state Moore Control FSM, a single-wire DHT11 digital acquisition engine with 40-bit SIPO shift register and 8-bit checksum validation, parallel combinational threshold comparators, clock-enabled output registers with asynchronous reset, and a 16x2 HD44780 LCD driver alongside tri-color alert LEDs.',
  problemStatement:
    'Conventional microcontroller-based weather monitors rely on sequential instruction execution and busy-wait timing loops to decode microsecond-level protocols like DHT11. Interrupt jitter can corrupt 26–70 µs bit timings, while single-threaded loops delay alert actuation and display refreshes. Designing a dedicated RTL datapath and FSM in FPGA fabric eliminates software timing jitter and evaluates temperature, humidity, and rainfall thresholds in parallel within a single clock cycle.',
  objectives: [
    'Design a modular, synthesizable Verilog HDL architecture separating the Control Path (5-state Moore FSM) from the Data Path (sensor capture, comparators, registers, LCD driver).',
    'Implement an accurate single-wire DHT11 hardware interface supporting the 18 ms start pulse, 54 µs pulse-width threshold decoding, 40-bit MSB-first shifting, and checksum rejection.',
    'Build glitch-free registered weather classification (HOT >= 40°C, COLD <= 10°C, NORMAL 11–39°C) with dedicated humidity (>= 80%) and rain alert flags plus asynchronous reset recovery.',
    'Verify complete cycle-by-cycle RTL behavior via self-checking simulation testbenches ($monitor & timing waveforms) covering normal, extreme, cold, and corrupted-frame scenarios.'
  ]
};

export interface EvolutionStage {
  phase: string;
  badge: string;
  title: string;
  module: string;
  description: string;
  highlights: string[];
  accent: string;
}

export const EVOLUTION_TIMELINE: EvolutionStage[] = [
  {
    phase: 'Assignment 1',
    badge: 'Combinational Core',
    title: 'Threshold Comparators & Status Encoder',
    module: 'weather_monitor.v',
    description:
      'Established the pure digital decision core: parallel 8-bit magnitude comparators (temp >= 40, temp <= 10, humidity >= 80), 2-bit mutually exclusive thermal status encoder, and direct rain pass-through.',
    highlights: [
      'Parallel 8-bit comparators: HOT (10), NORMAL (01), COLD (00)',
      'Zero-cycle combinational evaluation with minimal LUT footprint',
      'Validated against all 4 core environmental scenarios',
      'Foundation for glitch-free registered latching'
    ],
    accent: '#22d3ee'
  },
  {
    phase: 'Bridge Layer',
    badge: 'Sequential Registers',
    title: 'Enable-MUX D Flip-Flops & Async Reset',
    module: 'weather_monitor.v (Registered)',
    description:
      'Wrapped the combinational evaluator in clock-enabled edge-triggered D flip-flops (Y = S\'·I0 + S·I1) with asynchronous reset so display and LEDs remain rock-steady between measurement cycles.',
    highlights: [
      'Outputs update strictly on posedge clk when eval_en = 1',
      'Async reset immediately forces NORMAL (01) and clears alerts',
      'Eliminates transient combinational glitches on physical LEDs'
    ],
    accent: '#f59e0b'
  },
  {
    phase: 'Assignment 2',
    badge: 'Full Sequential RTL System',
    title: '5-State Moore FSM, DHT11 Protocol & LCD Driver',
    module: 'weather_top.v + fsm_control.v + dht11_interface.v + lcd_driver.v',
    description:
      'Evolved into a self-contained autonomous hardware system with a 24-bit 5-second sampling timer, bidirectional single-wire DHT11 acquisition with checksum error recovery, and a 16x2 HD44780 LCD driver.',
    highlights: [
      '5-state Moore Control FSM: IDLE -> REQUEST -> MEASURE -> EVALUATE -> DISPLAY',
      '40-bit SIPO shift register + 6-bit bit counter + 54 µs pulse discriminator',
      'Checksum mismatch safely aborts to S_IDLE without firing data_ready',
      'Full HD44780 ASCII display formatting + self-checking testbench'
    ],
    accent: '#10b981'
  }
];

export interface SpecRow {
  component: string;
  model: string;
  specification: string;
  role: string;
}

export const HARDWARE_SPECS: SpecRow[] = [
  {
    component: 'FPGA Development Board',
    model: 'Digilent Basys 3 (Artix-7 XC7A35T)',
    specification: '33,280 logic cells · 100 MHz oscillator · 4 PMOD ports · 16 LEDs · USB-UART',
    role: 'Executes synthesized Verilog RTL Control FSM, DHT11 capture, comparators & LCD controller.'
  },
  {
    component: 'Temp & Humidity Sensor',
    model: 'DHT11 (DHT22 Drop-in Compatible)',
    specification: '0–50°C (±2°C) / 20–90% RH · Single-wire 40-bit digital protocol · 4.7 kΩ pull-up',
    role: 'Streams calibrated 40-bit temperature, humidity & 8-bit checksum frames to PMOD JA1.'
  },
  {
    component: 'Raindrop Sensor Module',
    model: 'YL-83 / LM393 Comparator Board',
    specification: 'Nickel-plated interdigitated sensing pad · Adjustable potentiometer · Digital DO pin',
    role: 'Provides active digital rain-detection flag to PMOD JA2 for instant storm alerting.'
  },
  {
    component: 'Character Display',
    model: '16x2 Alphanumeric LCD (HD44780)',
    specification: '16 chars × 2 rows · 8-bit/4-bit parallel bus (RS, EN, D0–D7) · Green/Blue LED backlight',
    role: 'Renders live "T:XXC H:YY%" telemetry and HOT/COLD/HUM/RAIN alert banners.'
  },
  {
    component: 'Wireless Expansion Node',
    model: 'ESP32-WROOM-32 (UART / Wi-Fi)',
    specification: 'Dual-core 240 MHz · IEEE 802.11 b/g/n Wi-Fi · 3.3V UART bridge',
    role: 'Optional IoT uplink receiving FPGA UART frames for campus cloud dashboards.'
  }
];

export const SOFTWARE_SPECS: SpecRow[] = [
  {
    component: 'FPGA Synthesis & Place-and-Route',
    model: 'AMD / Xilinx Vivado Design Suite',
    specification: 'RTL elaboration, XDC pin constraints, timing analysis, bitstream (.bit) generation',
    role: 'Synthesizes Verilog modules into Artix-7 LUTs/FFs and programs the Basys 3 board.'
  },
  {
    component: 'HDL Simulation & Waveforms',
    model: 'ModelSim / Vivado XSim',
    specification: 'Cycle-accurate event simulation · $monitor transcripts · VCD/WDB waveform viewer',
    role: 'Verifies FSM state transitions, 54 µs pulse decoding, checksum rejection & register latency.'
  },
  {
    component: 'Hardware Description Language',
    model: 'Verilog HDL (IEEE 1364-2005)',
    specification: 'Structural + Behavioral RTL · Parameterized timing counters · Non-blocking registers',
    role: 'Defines the complete synthesizable hardware architecture and self-checking testbench.'
  },
  {
    component: 'IoT Companion Firmware',
    model: 'Arduino IDE (ESP32 Core)',
    specification: 'Serial UART parser · Wi-Fi MQTT / HTTP client · Sensor cross-calibration utility',
    role: 'Programs the optional ESP32 telemetry gateway and validates baseline sensor curves.'
  }
];

export interface FlipCardItem {
  id: string;
  category: 'Advantage' | 'Application';
  title: string;
  tagline: string;
  accent: string;
  frontPoints: string[];
  backDetail: string;
  metric: string;
}

export const ADVANTAGES_AND_APPLICATIONS: FlipCardItem[] = [
  {
    id: 'agriculture',
    category: 'Application',
    title: 'Precision Agriculture',
    tagline: 'Greenhouse microclimate & irrigation gating',
    accent: '#10b981',
    frontPoints: ['Instant frost (<=10°C) & heatwave (>=40°C) alerts', 'Rain-aware irrigation cutoff'],
    backDetail:
      'Deployable inside polyhouses and nurseries to trigger automated misting fans on HOT (10), dehumidifiers on humidity >= 80%, and pause water pumps automatically whenever rainfall is detected.',
    metric: '1-cycle alert latency'
  },
  {
    id: 'smart-campus',
    category: 'Application',
    title: 'Smart Campus Kiosks',
    tagline: 'Outdoor ambient safety display at GAT',
    accent: '#22d3ee',
    frontPoints: ['Standalone solar-ready Basys 3 kiosk', 'High-visibility LCD & LED beacons'],
    backDetail:
      'Provides real-time outdoor heat-index and sudden rain warnings for students, sports grounds, and campus facilities without needing an OS or cloud connection to stay operational.',
    metric: '5 s autonomous refresh'
  },
  {
    id: 'weather-stations',
    category: 'Application',
    title: 'Automated Weather Stations',
    tagline: 'Rugged field telemetry acquisition',
    accent: '#3b82f6',
    frontPoints: ['Hardware checksum rejects noisy cables', 'Deterministic microsecond timing'],
    backDetail:
      'Checksum-gated 40-bit capture filters electromagnetic interference on long outdoor sensor leads, discarding corrupted packets cleanly without crashing or locking up the controller.',
    metric: '40-bit CRC/Sum gated'
  },
  {
    id: 'industrial',
    category: 'Application',
    title: 'Industrial Safety & Server Rooms',
    tagline: 'Thermal runaway & condensation watch',
    accent: '#ef4444',
    frontPoints: ['Detects >=40°C rack overheating', 'Flags >=80% RH condensation risk'],
    backDetail:
      'Hardware-only state machines eliminate firmware crashes and watchdog reboots in mission-critical switchgear rooms, battery vaults, and server closets requiring fail-safe thermal alarms.',
    metric: 'Zero OS crash surface'
  },
  {
    id: 'education',
    category: 'Application',
    title: 'Digital Design Learning Platform',
    tagline: 'End-to-end DDCO laboratory blueprint',
    accent: '#a855f7',
    frontPoints: ['Maps Verilog directly to LUTs & DFFs', 'Illustrates Moore FSM + SIPO + MUX'],
    backDetail:
      'Bridges classroom Boolean algebra (D2/D1/D0 equations, 2:1 enable MUX, async reset) directly to physical Basys 3 peripherals, making sequential RTL intuitive for engineering students.',
    metric: '< 0.7% Artix-7 LUTs'
  },
  {
    id: 'determinism',
    category: 'Advantage',
    title: 'Parallel Hardware Speed',
    tagline: 'Simultaneous evaluation vs MCU polling',
    accent: '#f59e0b',
    frontPoints: ['All comparators execute concurrently', 'Zero interrupt jitter on 54 µs pulses'],
    backDetail:
      'Unlike software loops that poll one condition at a time, FPGA fabric computes HOT, COLD, HUM_HIGH, and RAIN alerts in parallel on the exact same rising clock edge with nanosecond precision.',
    metric: '10 ns @ 100 MHz clk'
  }
];

export const LIMITATIONS_LIST = [
  {
    title: 'Fixed Hardcoded Thresholds',
    detail: 'Thresholds (40°C, 10°C, 80% RH) are synthesized as constants in RTL rather than dynamically configurable at runtime.'
  },
  {
    title: 'Sensor Resolution & Polling Rate',
    detail: 'DHT11 offers ±2°C integer resolution and a 1–2 Hz hardware sampling floor (upgradable seamlessly to DHT22).'
  },
  {
    title: 'Local-Only Display & Volatile State',
    detail: 'Alerts appear locally on the 16x2 LCD and LEDs; historical readings are overwritten every 5-second sampling cycle.'
  },
  {
    title: 'Visual Alerts Without Audible Escalation',
    detail: 'Current prototype relies on tri-color LEDs and LCD banners rather than a PWM acoustic siren for unmanned rooms.'
  }
];

export interface RoadmapMilestone {
  id: string;
  step: string;
  title: string;
  shortLabel: string;
  description: string;
  hardwareChange: string;
  color: string;
  position: [number, number, number];
}

export const FUTURE_ROADMAP: RoadmapMilestone[] = [
  {
    id: 'thresholds',
    step: 'Phase 1',
    title: 'Programmable Thresholds',
    shortLabel: 'DIP / UART Limits',
    description:
      'Replace hardcoded comparator constants with writable threshold registers configured via Basys 3 slide switches or a UART CLI menu.',
    hardwareChange: '+24 register FFs · Runtime comparator inputs',
    color: '#22d3ee',
    position: [-4.5, 0.4, 0.8]
  },
  {
    id: 'cloud',
    step: 'Phase 2',
    title: 'ESP32 Cloud Logging',
    shortLabel: 'UART → Wi-Fi Cloud',
    description:
      'Add a Verilog UART TX FSM (115200 baud) streaming JSON/CSV packets to an ESP32 module for real-time MQTT/HTTPS cloud telemetry and mobile push alerts.',
    hardwareChange: '+UART TX FSM · ESP32 PMOD bridge',
    color: '#10b981',
    position: [-1.5, 1.15, -0.3]
  },
  {
    id: 'bram',
    step: 'Phase 3',
    title: 'On-Chip BRAM History Buffer',
    shortLabel: 'Block RAM Logger',
    description:
      'Store 24-hour rolling min/max/average temperature and humidity logs inside Artix-7 Block RAM (BRAM) with circular FIFO addressing for trend graphs.',
    hardwareChange: '1× RAMB18E1 Block RAM · Ring pointer FSM',
    color: '#a855f7',
    position: [1.5, 1.9, 0.4]
  },
  {
    id: 'buzzer',
    step: 'Phase 4',
    title: 'Audible Piezo Buzzer & PWM Siren',
    shortLabel: 'PWM Audio Alarm',
    description:
      'Drive a piezo transducer with distinct multi-tone PWM patterns (fast pulse for HOT+RAIN, slow chime for HIGH HUMIDITY) plus a manual acknowledge/mute button.',
    hardwareChange: '+16-bit PWM generator · PMOD piezo driver',
    color: '#f59e0b',
    position: [4.5, 2.65, -0.4]
  }
];
