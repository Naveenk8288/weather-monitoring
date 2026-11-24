export interface ArchitecturePort {
  name: string;
  dir: 'IN' | 'OUT' | 'INOUT';
  width: string;
  purpose: string;
}

export interface ArchitectureBlock {
  id: string;
  name: string;
  shortName: string;
  category: 'sensor' | 'datapath' | 'control' | 'output';
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  summary: string;
  functionDetail: string;
  hardwareEstimate: string;
  ports: ArchitecturePort[];
  verilogSnippet: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface ArchitectureLink {
  from: string;
  to: string;
  label: string;
  type: 'data' | 'handshake';
  color: string;
}

export const ARCHITECTURE_BLOCKS: ArchitectureBlock[] = [
  {
    id: 'sensors',
    name: 'DHT11 Sensor + Rain Sensor',
    shortName: 'Sensors',
    category: 'sensor',
    position: [-9.2, 0, 0],
    size: [2.1, 1.4, 1.5],
    color: '#38bdf8',
    summary: 'External physical sensing front-end (temperature, humidity, rainfall).',
    functionDetail:
      'DHT11 outputs a calibrated 40-bit serial digital packet on a single bidirectional open-drain wire with a 4.7 kΩ pull-up. The rain sensor module uses an LM393 comparator on an interdigitated nickel PCB to assert an active digital rain flag.',
    hardwareEstimate: 'External PMOD JA1 (1-wire) & JA2 (Digital IN)',
    ports: [
      { name: 'dht_data', dir: 'INOUT', width: '1-bit', purpose: 'Single-wire bidirectional serial frame' },
      { name: 'rain_in', dir: 'IN', width: '1-bit', purpose: 'Active-high digital rainfall detect' }
    ],
    verilogSnippet: `// Open-drain tri-state buffer to external DHT11 sensor
assign dht_data = drive_low ? 1'b0 : 1'bz;
// Rain sensor digital comparator input on PMOD JA2
input wire rain_sensor;`,
    cameraPos: [-10.2, 3.6, 7.2],
    cameraTarget: [-9.2, 0.2, 0]
  },
  {
    id: 'dht11_fsm',
    name: 'DHT11 Interface FSM',
    shortName: 'DHT11 FSM',
    category: 'datapath',
    position: [-6.1, 0, 0],
    size: [2.2, 1.4, 1.5],
    color: '#10b981',
    summary: 'Single-wire timing controller, 54 µs pulse discriminator & checksum validator.',
    functionDetail:
      'Drives the 18 ms start-low pulse and 30 µs release, verifies the 80 µs LOW + 80 µs HIGH sensor handshake, measures each bit high duration against the 54 µs threshold, and validates the 8-bit checksum before pulsing data_ready.',
    hardwareEstimate: '~62 LUTs · 38 Flip-Flops · 16-bit µs timer',
    ports: [
      { name: 'start / shift_en', dir: 'IN', width: '1-bit', purpose: 'Control FSM handshakes' },
      { name: 'req_done / data_ready', dir: 'OUT', width: '1-bit', purpose: 'Completion flags to Control FSM' },
      { name: 'bit_stream', dir: 'OUT', width: '1-bit', purpose: 'Decoded bit shifted MSB-first' }
    ],
    verilogSnippet: `// Pulse-width threshold decision at 54 us
shift_reg <= {shift_reg[38:0], (us_cnt > 16'd54) ? 1'b1 : 1'b0};
// Checksum integrity check
if (calc_checksum == shift_reg[7:0]) st <= S_DONE;
else st <= S_IDLE; // Reject corrupt frame`,
    cameraPos: [-6.5, 3.3, 6.8],
    cameraTarget: [-6.1, 0.3, 0]
  },
  {
    id: 'data_reg',
    name: '40-bit Data Register',
    shortName: '40-bit Reg',
    category: 'datapath',
    position: [-3.0, 0, 0],
    size: [2.2, 1.4, 1.5],
    color: '#22d3ee',
    summary: 'Serial-in parallel-out (SIPO) shift register storing Humidity, Temp & Checksum.',
    functionDetail:
      'Stores 5 bytes MSB-first: Humidity Integer [39:32], Humidity Decimal [31:24], Temperature Integer [23:16], Temperature Decimal [15:8], and 8-bit Checksum [7:0]. Latches clean parallel outputs only upon checksum pass.',
    hardwareEstimate: '40 D Flip-Flops (SIPO) + 32 Output Latch FFs',
    ports: [
      { name: 'shift_reg[39:0]', dir: 'IN', width: '40-bit', purpose: 'Incoming serial shift chain' },
      { name: 'hum_int[7:0]', dir: 'OUT', width: '8-bit', purpose: 'Integer relative humidity (%)' },
      { name: 'temp_int[7:0]', dir: 'OUT', width: '8-bit', purpose: 'Integer temperature (°C)' }
    ],
    verilogSnippet: `// Byte slicing of validated 40-bit DHT11 packet
humidity_int <= shift_reg[39:32];
humidity_dec <= shift_reg[31:24];
temp_int     <= shift_reg[23:16];
temp_dec     <= shift_reg[15:8];`,
    cameraPos: [-3.0, 3.2, 6.6],
    cameraTarget: [-3.0, 0.4, 0]
  },
  {
    id: 'decoder',
    name: 'Condition Decoder (Comparators)',
    shortName: 'Comparators',
    category: 'datapath',
    position: [0.1, 0, 0],
    size: [2.2, 1.4, 1.5],
    color: '#f59e0b',
    summary: 'Combinational threshold comparators & 2-bit temperature status encoder.',
    functionDetail:
      'Compares temp >= 40°C (HOT), temp <= 10°C (COLD), and humidity >= 80% (HUM_HIGH) in parallel. Encodes status[1] = HOT and status[0] = ~HOT & ~COLD (10=HOT, 01=NORMAL, 00=COLD).',
    hardwareEstimate: '~18 LUTs · 3 CARRY4 chains · 0 Flip-Flops (pure combinational)',
    ports: [
      { name: 'temp_int[7:0]', dir: 'IN', width: '8-bit', purpose: 'Measured temperature' },
      { name: 'hum_int[7:0]', dir: 'IN', width: '8-bit', purpose: 'Measured humidity' },
      { name: 'next_status[1:0]', dir: 'OUT', width: '2-bit', purpose: 'Encoded HOT / NORMAL / COLD' }
    ],
    verilogSnippet: `assign is_hot      = (temp >= 8'd40);
assign is_cold     = (temp <= 8'd10);
assign is_hum_high = (humidity >= 8'd80);
assign next_status = {is_hot, (~is_hot & ~is_cold)};`,
    cameraPos: [0.2, 3.2, 6.6],
    cameraTarget: [0.1, 0.5, 0]
  },
  {
    id: 'cond_reg',
    name: 'Condition + Alert Registers',
    shortName: 'Alert Regs',
    category: 'datapath',
    position: [3.2, 0, 0],
    size: [2.2, 1.4, 1.5],
    color: '#ef4444',
    summary: 'Clock-enabled D flip-flops with 2-to-1 enable MUX and async reset.',
    functionDetail:
      'Latches temp_status[1:0], humidity_alert, and rain_alert cleanly on posedge clk only when eval_en=1. Asynchronous reset immediately restores temp_status = 2\'b01 (NORMAL) and clears both alerts to 0.',
    hardwareEstimate: '4 Flip-Flops (1 FDPE Preset + 3 FDCE Clear) + Enable MUX',
    ports: [
      { name: 'eval_en', dir: 'IN', width: '1-bit', purpose: 'Clock-enable select S for 2:1 MUX' },
      { name: 'temp_status[1:0]', dir: 'OUT', width: '2-bit', purpose: 'Registered thermal state' },
      { name: 'humidity_alert / rain_alert', dir: 'OUT', width: '2-bit', purpose: 'Registered alert flags' }
    ],
    verilogSnippet: `always @(posedge clk or posedge reset) begin
    if (reset) begin
        temp_status    <= 2'b01; // NORMAL
        humidity_alert <= 1'b0;
        rain_alert     <= 1'b0;
    end else if (eval_en) begin
        temp_status    <= next_temp_status;
        humidity_alert <= is_hum_high;
        rain_alert     <= rain;
    end
end`,
    cameraPos: [3.3, 3.2, 6.6],
    cameraTarget: [3.2, 0.3, 0]
  },
  {
    id: 'lcd_fsm',
    name: 'LCD Driver FSM',
    shortName: 'LCD FSM',
    category: 'datapath',
    position: [6.3, 0, 0],
    size: [2.2, 1.4, 1.5],
    color: '#a855f7',
    summary: 'HD44780 character serializer, BCD-to-ASCII formatter & strobe timer.',
    functionDetail:
      'Converts binary temp/humidity into ASCII decimal digits, issues DDRAM address commands (0x80 line 1, 0xC0 line 2), pulses EN with >=450 ns hold timing, and raises lcd_done to return the Control FSM to IDLE.',
    hardwareEstimate: '~46 LUTs · 29 Flip-Flops · 34-char LUT ROM',
    ports: [
      { name: 'lcd_update', dir: 'IN', width: '1-bit', purpose: 'Trigger from Control FSM DISPLAY state' },
      { name: 'lcd_rs / lcd_en / lcd_data', dir: 'OUT', width: '10-bit', purpose: 'HD44780 parallel bus' },
      { name: 'lcd_done', dir: 'OUT', width: '1-bit', purpose: 'Completion handshake to Control FSM' }
    ],
    verilogSnippet: `// Line 1: "T:XXC H:YY%"  |  Line 2: "HOT HUM! RAIN!"
wire [7:0] t_tens = 8'h30 + (temp / 8'd10);
wire [7:0] t_ones = 8'h30 + (temp % 8'd10);
if (char_idx == 6'd33) lcd_done <= 1'b1;`,
    cameraPos: [6.4, 3.3, 6.8],
    cameraTarget: [6.3, 0.2, 0]
  },
  {
    id: 'outputs',
    name: '16x2 LCD + Alert LEDs',
    shortName: 'LCD + LEDs',
    category: 'output',
    position: [9.4, 0, 0],
    size: [2.1, 1.4, 1.5],
    color: '#22c55e',
    summary: 'Human-readable 16x2 character display and tri-color discrete alert LEDs.',
    functionDetail:
      'Displays live temperature, relative humidity, thermal category, and active alarms on a backlit 16x2 HD44780 LCD alongside immediate visual LED alerts: Red (Heat), Blue (Humidity >= 80%), and Cyan (Rain).',
    hardwareEstimate: 'Basys 3 PMOD JB/JC (LCD) + On-board LEDs LD0–LD2',
    ports: [
      { name: 'lcd_data[7:0]', dir: 'IN', width: '8-bit', purpose: 'ASCII character bus' },
      { name: 'led_heat / led_hum / led_rain', dir: 'OUT', width: '3-bit', purpose: 'Visual alert indicators' }
    ],
    verilogSnippet: `assign led_heat     = (temp_status == 2'b10);
assign led_humidity = humidity_alert;
assign led_rain     = rain_alert;
assign alert_out    = led_heat | led_humidity | led_rain;`,
    cameraPos: [9.8, 3.5, 7.4],
    cameraTarget: [9.4, 0.2, 0]
  },
  {
    id: 'control_fsm',
    name: 'Control FSM (Overhead Master)',
    shortName: 'Control FSM',
    category: 'control',
    position: [0.1, 3.6, -0.4],
    size: [4.6, 1.25, 1.7],
    color: '#06b6d4',
    summary: '5-state Moore machine orchestrating start/done handshakes across all blocks.',
    functionDetail:
      'Sits above the datapath in a classic RTL Control-Path / Data-Path separation. Driven by the 24-bit 5-second sample_tick, it sequences REQUEST -> MEASURE -> EVALUATE -> DISPLAY -> IDLE via deterministic Moore control signals.',
    hardwareEstimate: '3 State FFs (FDCE) + 24-bit Timer + ~19 LUTs',
    ports: [
      { name: 'sample_tick', dir: 'IN', width: '1-bit', purpose: '5-second periodic sample pulse' },
      { name: 'req_done / data_ready / lcd_done', dir: 'IN', width: '3-bit', purpose: 'Datapath status handshakes' },
      { name: 'start / shift_en / eval_en / lcd_update', dir: 'OUT', width: '4-bit', purpose: 'One-hot Moore control signals' }
    ],
    verilogSnippet: `// Moore outputs from 3-bit state register {s2, s1, s0}
assign start      = (state == REQUEST);  // 001
assign shift_en   = (state == MEASURE);  // 010
assign eval_en    = (state == EVALUATE); // 011
assign lcd_update = (state == DISPLAY);  // 100`,
    cameraPos: [0.1, 6.2, 9.8],
    cameraTarget: [0.1, 2.2, 0]
  }
];

export const ARCHITECTURE_LINKS: ArchitectureLink[] = [
  // Datapath horizontal flow
  { from: 'sensors', to: 'dht11_fsm', label: '1-Wire / Rain', type: 'data', color: '#38bdf8' },
  { from: 'dht11_fsm', to: 'data_reg', label: '40-bit Serial', type: 'data', color: '#10b981' },
  { from: 'data_reg', to: 'decoder', label: 'Temp[7:0], Hum[7:0]', type: 'data', color: '#22d3ee' },
  { from: 'decoder', to: 'cond_reg', label: 'Status[1:0], Alerts', type: 'data', color: '#f59e0b' },
  { from: 'cond_reg', to: 'lcd_fsm', label: 'Registered State', type: 'data', color: '#ef4444' },
  { from: 'lcd_fsm', to: 'outputs', label: 'RS / EN / ASCII[7:0]', type: 'data', color: '#a855f7' },

  // Overhead Control FSM start/done handshakes
  { from: 'control_fsm', to: 'dht11_fsm', label: 'start / shift_en ⇄ req_done / data_ready', type: 'handshake', color: '#22d3ee' },
  { from: 'control_fsm', to: 'cond_reg', label: 'eval_en (1 cycle)', type: 'handshake', color: '#f59e0b' },
  { from: 'control_fsm', to: 'lcd_fsm', label: 'lcd_update ⇄ lcd_done', type: 'handshake', color: '#c084fc' }
];
