export interface TimingCycle {
  cycle: string; // T1..T9
  timeNs: number;
  reset: 0 | 1;
  sample_tick: 0 | 1;
  state: 'IDLE' | 'REQUEST' | 'MEASURE' | 'EVALUATE' | 'DISPLAY';
  stateBits: string;
  data_ready: 0 | 1;
  cond: '01' | '10';
  condLabel: string;
  alert_out: 0 | 1;
  lcd_update: 0 | 1;
  title: string;
  explanation: string;
  monitorLine: string;
}

/**
 * Full 9-cycle representative measurement sequence from the project report
 * for the 41°C / 82% relative humidity test frame (COND: 01 NORMAL -> 10 HOT).
 */
export const TIMING_CYCLES: TimingCycle[] = [
  {
    cycle: 'T1',
    timeNs: 10,
    reset: 1,
    sample_tick: 0,
    state: 'IDLE',
    stateBits: '000',
    data_ready: 0,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: 'Asynchronous Reset Initialization',
    explanation:
      'reset = 1 forces the 3-bit Control FSM register immediately into IDLE (000), presets temp_status = 01 (NORMAL), and clears alert_out = 0 without waiting for a clock edge.',
    monitorLine: 'T=10ns  | rst=1 | tick=0 | state=IDLE(000)     | drdy=0 | cond=01(NORM) | alert=0 | lcd_upd=0  // Async reset'
  },
  {
    cycle: 'T2',
    timeNs: 20,
    reset: 0,
    sample_tick: 1,
    state: 'IDLE',
    stateBits: '000',
    data_ready: 0,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: '5-Second Sample Tick Arrives',
    explanation:
      'reset deasserts and the 24-bit periodic timer asserts sample_tick = 1 for one clock cycle. Next-state logic computes D2D1D0 = 001 (REQUEST) ready for the next posedge clk.',
    monitorLine: 'T=20ns  | rst=0 | tick=1 | state=IDLE(000)     | drdy=0 | cond=01(NORM) | alert=0 | lcd_upd=0  // sample_tick fired'
  },
  {
    cycle: 'T3',
    timeNs: 30,
    reset: 0,
    sample_tick: 0,
    state: 'REQUEST',
    stateBits: '001',
    data_ready: 0,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: 'DHT11 Host Start Pulse (18 ms Low + 30 µs Release)',
    explanation:
      'Control FSM enters REQUEST (001) and drives Moore output start = 1. The DHT11 interface pulls the 1-wire line LOW for 18 ms then releases it for 30 µs, raising req_done at cycle end.',
    monitorLine: 'T=30ns  | rst=0 | tick=0 | state=REQUEST(001)  | drdy=0 | cond=01(NORM) | alert=0 | lcd_upd=0  // start=1 (18ms wake)'
  },
  {
    cycle: 'T4',
    timeNs: 40,
    reset: 0,
    sample_tick: 0,
    state: 'MEASURE',
    stateBits: '010',
    data_ready: 0,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: 'Serial 40-Bit Acquisition in Progress',
    explanation:
      'Control FSM enters MEASURE (010) with shift_en = 1. DHT11 responds (80 µs LOW + 80 µs HIGH) and streams 40 bits (Hum=82%=0x52, Temp=41°C=0x29, Checksum=0x7B) against the 54 µs threshold.',
    monitorLine: 'T=40ns  | rst=0 | tick=0 | state=MEASURE(010)  | drdy=0 | cond=01(NORM) | alert=0 | lcd_upd=0  // Shifting 40b frame'
  },
  {
    cycle: 'T5',
    timeNs: 50,
    reset: 0,
    sample_tick: 0,
    state: 'MEASURE',
    stateBits: '010',
    data_ready: 1,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: 'Checksum Pass & data_ready Pulse',
    explanation:
      'Bit counter reaches 39. Checksum verifies (0x52 + 0x00 + 0x29 + 0x00 = 0x7B == 0x7B). DHT11 interface asserts data_ready = 1. Registered cond[1:0] still holds 01 until EVALUATE latches it.',
    monitorLine: 'T=50ns  | rst=0 | tick=0 | state=MEASURE(010)  | drdy=1 | cond=01(NORM) | alert=0 | lcd_upd=0  // Checksum 0x7B OK!'
  },
  {
    cycle: 'T6',
    timeNs: 60,
    reset: 0,
    sample_tick: 0,
    state: 'EVALUATE',
    stateBits: '011',
    data_ready: 0,
    cond: '01',
    condLabel: '01 (NORM)',
    alert_out: 0,
    lcd_update: 0,
    title: 'Single-Cycle Evaluation (eval_en = 1)',
    explanation:
      'FSM transitions to EVALUATE (011) and asserts eval_en = 1. Comparators see T=41°C (>=40 -> HOT) and H=82% (>=80 -> HUM_HIGH). The 2-to-1 enable MUX feeds 10 (HOT) & alert=1 to the DFF inputs.',
    monitorLine: 'T=60ns  | rst=0 | tick=0 | state=EVALUATE(011) | drdy=0 | cond=01->10*  | alert=0 | lcd_upd=0  // eval_en=1 (T=41C,H=82%)'
  },
  {
    cycle: 'T7',
    timeNs: 70,
    reset: 0,
    sample_tick: 0,
    state: 'DISPLAY',
    stateBits: '100',
    data_ready: 0,
    cond: '10',
    condLabel: '10 (HOT)',
    alert_out: 1,
    lcd_update: 1,
    title: 'Registered Outputs Latch & LCD Update Starts',
    explanation:
      'On the rising clock edge leaving EVALUATE, cond[1:0] updates 01 -> 10 (HOT) and alert_out rises 0 -> 1! FSM enters DISPLAY (100) and asserts lcd_update = 1 to write "T:41C H:82%" / "HOT HUM ALERT!".',
    monitorLine: 'T=70ns  | rst=0 | tick=0 | state=DISPLAY(100)  | drdy=0 | cond=10(HOT)  | alert=1 | lcd_upd=1  // LATCHED! LEDs + LCD ON'
  },
  {
    cycle: 'T8',
    timeNs: 80,
    reset: 0,
    sample_tick: 0,
    state: 'DISPLAY',
    stateBits: '100',
    data_ready: 0,
    cond: '10',
    condLabel: '10 (HOT)',
    alert_out: 1,
    lcd_update: 1,
    title: 'HD44780 LCD Character Streaming Complete',
    explanation:
      'LCD driver finishes clocking all 34 HD44780 command/ASCII transactions to the 16x2 screen and pulses lcd_done = 1. Registered cond=10 and alert_out=1 remain continuously latched.',
    monitorLine: 'T=80ns  | rst=0 | tick=0 | state=DISPLAY(100)  | drdy=0 | cond=10(HOT)  | alert=1 | lcd_upd=1  // LCD "T:41C H:82%" done'
  },
  {
    cycle: 'T9',
    timeNs: 90,
    reset: 0,
    sample_tick: 0,
    state: 'IDLE',
    stateBits: '000',
    data_ready: 0,
    cond: '10',
    condLabel: '10 (HOT)',
    alert_out: 1,
    lcd_update: 0,
    title: 'Return to IDLE — Outputs Held Until Next 5 s Sample',
    explanation:
      'FSM returns to IDLE (000) and clears lcd_update = 0. Because eval_en = 0, the enable MUX feeds Q back into D so cond = 10 (HOT) and alert_out = 1 persist seamlessly until the next sample_tick.',
    monitorLine: 'T=90ns  | rst=0 | tick=0 | state=IDLE(000)     | drdy=0 | cond=10(HOT)  | alert=1 | lcd_upd=0  // Hold Q until next 5s tick'
  }
];
