export type FsmStateName = 'IDLE' | 'REQUEST' | 'MEASURE' | 'EVALUATE' | 'DISPLAY';

export interface FsmStateMeta {
  name: FsmStateName;
  code: string; // 3-bit binary string
  bits: [0 | 1, 0 | 1, 0 | 1]; // [s2, s1, s0]
  color: string;
  description: string;
  nextState: FsmStateName;
  transitionLabel: string;
}

export interface FsmInputs {
  sample_tick: boolean;
  req_done: boolean;
  data_ready: boolean;
  lcd_done: boolean;
}

export interface FsmMooreOutputs {
  start: 0 | 1;
  shift_en: 0 | 1;
  eval_en: 0 | 1;
  lcd_update: 0 | 1;
}

export interface FsmNextStateEval {
  d2: 0 | 1;
  d1: 0 | 1;
  d0: 0 | 1;
  nextState: FsmStateName;
  nextCode: string;
  transitioned: boolean;
}

export const FSM_STATES: FsmStateMeta[] = [
  {
    name: 'IDLE',
    code: '000',
    bits: [0, 0, 0],
    color: '#64748b',
    description: 'Low-power standby waiting for the 5-second sample_tick from the 24-bit timer.',
    nextState: 'REQUEST',
    transitionLabel: 'sample_tick'
  },
  {
    name: 'REQUEST',
    code: '001',
    bits: [0, 0, 1],
    color: '#22d3ee',
    description: 'Asserts start to drive the 18 ms low host start pulse & 30 µs release on DHT11 line.',
    nextState: 'MEASURE',
    transitionLabel: 'req_done'
  },
  {
    name: 'MEASURE',
    code: '010',
    bits: [0, 1, 0],
    color: '#10b981',
    description: 'Enables shift_en to capture 40 serial DHT11 data bits and validate the 8-bit checksum.',
    nextState: 'EVALUATE',
    transitionLabel: 'data_ready'
  },
  {
    name: 'EVALUATE',
    code: '011',
    bits: [0, 1, 1],
    color: '#f59e0b',
    description: 'Asserts eval_en for 1 clock cycle to latch decoded temp_status and alert flags.',
    nextState: 'DISPLAY',
    transitionLabel: '1 cycle'
  },
  {
    name: 'DISPLAY',
    code: '100',
    bits: [1, 0, 0],
    color: '#a855f7',
    description: 'Asserts lcd_update to stream formatted ASCII weather text to the 16x2 HD44780 LCD.',
    nextState: 'IDLE',
    transitionLabel: 'lcd_done'
  }
];

export const FSM_STATE_MAP: Record<FsmStateName, FsmStateMeta> = {
  IDLE: FSM_STATES[0],
  REQUEST: FSM_STATES[1],
  MEASURE: FSM_STATES[2],
  EVALUATE: FSM_STATES[3],
  DISPLAY: FSM_STATES[4]
};

export function decodeStateBits(s2: 0 | 1, s1: 0 | 1, s0: 0 | 1): FsmStateName {
  const key = `${s2}${s1}${s0}`;
  switch (key) {
    case '000':
      return 'IDLE';
    case '001':
      return 'REQUEST';
    case '010':
      return 'MEASURE';
    case '011':
      return 'EVALUATE';
    case '100':
      return 'DISPLAY';
    default:
      return 'IDLE';
  }
}

/**
 * Moore Outputs depend strictly on current state bits (s2, s1, s0):
 *   start      = ~s2 & ~s1 &  s0   (REQUEST  001)
 *   shift_en   = ~s2 &  s1 & ~s0   (MEASURE  010)
 *   eval_en    = ~s2 &  s1 &  s0   (EVALUATE 011)
 *   lcd_update =  s2 & ~s1 & ~s0   (DISPLAY  100)
 */
export function getMooreOutputs(state: FsmStateName): FsmMooreOutputs {
  const [s2, s1, s0] = FSM_STATE_MAP[state].bits;
  return {
    start: (!s2 && !s1 && s0 ? 1 : 0) as 0 | 1,
    shift_en: (!s2 && s1 && !s0 ? 1 : 0) as 0 | 1,
    eval_en: (!s2 && s1 && s0 ? 1 : 0) as 0 | 1,
    lcd_update: (s2 && !s1 && !s0 ? 1 : 0) as 0 | 1
  };
}

/**
 * Exact Boolean Next-State Equations for 3 D Flip-Flops (D2, D1, D0):
 *   D2 = (~s2 & s1 & s0) | (s2 & ~s1 & ~s0 & ~lcd_done)
 *   D1 = (~s2 & ~s1 & s0 & req_done) | (~s2 & s1 & ~s0)
 *   D0 = (~s2 & ~s1 & ~s0 & sample_tick) | (~s2 & ~s1 & s0 & ~req_done) | (~s2 & s1 & ~s0 & data_ready)
 */
export function computeNextState(state: FsmStateName, inputs: FsmInputs): FsmNextStateEval {
  const [s2, s1, s0] = FSM_STATE_MAP[state].bits;
  const ns2 = !s2;
  const ns1 = !s1;
  const ns0 = !s0;

  const d2Bool = (ns2 && Boolean(s1) && Boolean(s0)) || (Boolean(s2) && ns1 && ns0 && !inputs.lcd_done);
  const d1Bool = (ns2 && ns1 && Boolean(s0) && inputs.req_done) || (ns2 && Boolean(s1) && ns0);
  const d0Bool =
    (ns2 && ns1 && ns0 && inputs.sample_tick) ||
    (ns2 && ns1 && Boolean(s0) && !inputs.req_done) ||
    (ns2 && Boolean(s1) && ns0 && inputs.data_ready);

  const d2 = (d2Bool ? 1 : 0) as 0 | 1;
  const d1 = (d1Bool ? 1 : 0) as 0 | 1;
  const d0 = (d0Bool ? 1 : 0) as 0 | 1;
  const nextState = decodeStateBits(d2, d1, d0);

  return {
    d2,
    d1,
    d0,
    nextState,
    nextCode: `${d2}${d1}${d0}`,
    transitioned: nextState !== state
  };
}

/**
 * Step FSM forward through its canonical measurement loop
 * (convenience helper for automated Play / Step mode).
 */
export function stepFsmAutomatic(state: FsmStateName): FsmNextStateEval {
  const activeInputs: FsmInputs = {
    sample_tick: state === 'IDLE',
    req_done: state === 'REQUEST',
    data_ready: state === 'MEASURE',
    lcd_done: state === 'DISPLAY'
  };
  return computeNextState(state, activeInputs);
}

/**
 * Asynchronous reset unconditionally forces state -> IDLE (000)
 * immediately without waiting for posedge clk.
 */
export function asyncResetFsm(): FsmStateName {
  return 'IDLE';
}

export const FSM_EQUATIONS = [
  {
    lhs: 'D2',
    expression: "(s2' · s1 · s0) + (s2 · s1' · s0' · lcd_done')",
    meaning: 'Enters DISPLAY (100) after EVALUATE (011), holds until lcd_done = 1.'
  },
  {
    lhs: 'D1',
    expression: "(s2' · s1' · s0 · req_done) + (s2' · s1 · s0')",
    meaning: 'Enters MEASURE (010) on req_done, stays high through EVALUATE (011).'
  },
  {
    lhs: 'D0',
    expression:
      "(s2' · s1' · s0' · sample_tick) + (s2' · s1' · s0 · req_done') + (s2' · s1 · s0' · data_ready)",
    meaning: 'Sets bit 0 for REQUEST (001) and EVALUATE (011).'
  }
];

export const MOORE_EQUATIONS = [
  { signal: 'start', expression: "s2' · s1' · s0", activeIn: 'REQUEST (001)' },
  { signal: 'shift_en', expression: "s2' · s1 · s0'", activeIn: 'MEASURE (010)' },
  { signal: 'eval_en', expression: "s2' · s1 · s0", activeIn: 'EVALUATE (011)' },
  { signal: 'lcd_update', expression: "s2 · s1' · s0'", activeIn: 'DISPLAY (100)' }
];
