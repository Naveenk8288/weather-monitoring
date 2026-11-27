import { describe, it, expect } from 'vitest';
import {
  evaluateCombinational,
  createResetRegisteredState,
  stepRegisteredState,
  formatLcdLines,
  mux2to1,
  REPORT_PRESETS
} from './weatherLogic';
import {
  computeNextState,
  getMooreOutputs,
  asyncResetFsm,
  stepFsmAutomatic,
  FsmStateName
} from './fsmSim';
import {
  buildDht11Frame,
  decodePulseDurationUs,
  getDht11Snapshot,
  DHT11_TOTAL_STEPS
} from './dht11Sim';
import {
  decodeWmoWeather,
  formatCoords,
  isRainWmoCode,
  mapLiveWeatherToFpgaInputs
} from '../services/liveWeather';

describe('Weather Condition Decoder & Registered Outputs (Verilog exact)', () => {
  it('decodes boundary temperatures precisely: >=40 HOT(10), <=10 COLD(00), 11..39 NORMAL(01)', () => {
    expect(evaluateCombinational({ temp: 40, humidity: 50, rain: false }).tempStatus).toBe('10');
    expect(evaluateCombinational({ temp: 39, humidity: 50, rain: false }).tempStatus).toBe('01');
    expect(evaluateCombinational({ temp: 11, humidity: 50, rain: false }).tempStatus).toBe('01');
    expect(evaluateCombinational({ temp: 10, humidity: 50, rain: false }).tempStatus).toBe('00');
  });

  it('matches all four report test scenarios', () => {
    const [s1, s2, s3, s4] = REPORT_PRESETS;
    const r1 = evaluateCombinational(s1.inputs);
    expect(r1.tempStatus).toBe('01');
    expect(r1.humidityAlert).toBe(false);
    expect(r1.rainAlert).toBe(false);

    const r2 = evaluateCombinational(s2.inputs);
    expect(r2.tempStatus).toBe('10');
    expect(r2.humidityAlert).toBe(true);
    expect(r2.rainAlert).toBe(true);

    const r3 = evaluateCombinational(s3.inputs);
    expect(r3.tempStatus).toBe('01');
    expect(r3.humidityAlert).toBe(false);
    expect(r3.rainAlert).toBe(false);

    const r4 = evaluateCombinational(s4.inputs);
    expect(r4.tempStatus).toBe('00');
    expect(r4.humidityAlert).toBe(true);
    expect(r4.rainAlert).toBe(false);
  });

  it('registers outputs only on rising clock edge and holds when evalEn=false (2-to-1 MUX)', () => {
    let reg = createResetRegisteredState();
    expect(reg.tempStatus).toBe('01');
    expect(reg.humidityAlert).toBe(false);
    expect(reg.rainAlert).toBe(false);

    // Hold when evalEn=false
    reg = stepRegisteredState(reg, { temp: 45, humidity: 90, rain: true }, false);
    expect(reg.tempStatus).toBe('01');
    expect(reg.humidityAlert).toBe(false);

    // Latch on rising clock edge with evalEn=true
    reg = stepRegisteredState(reg, { temp: 45, humidity: 90, rain: true }, true);
    expect(reg.tempStatus).toBe('10');
    expect(reg.humidityAlert).toBe(true);
    expect(reg.rainAlert).toBe(true);

    // Async reset restores NORMAL (01) and clears alerts immediately
    const resetReg = createResetRegisteredState(reg.clockCount);
    expect(resetReg.tempStatus).toBe('01');
    expect(resetReg.humidityAlert).toBe(false);
    expect(resetReg.rainAlert).toBe(false);
  });

  it('implements 2-to-1 MUX truth table Y = S\'I0 + SI1', () => {
    expect(mux2to1(false, false, true)).toBe(false);
    expect(mux2to1(false, true, false)).toBe(true);
    expect(mux2to1(true, false, true)).toBe(true);
    expect(mux2to1(true, true, false)).toBe(false);
  });

  it('formats 16x2 LCD lines strictly to 16 characters each', () => {
    const reg = stepRegisteredState(
      createResetRegisteredState(),
      { temp: 41, humidity: 82, rain: false },
      true
    );
    const [l1, l2] = formatLcdLines(reg);
    expect(l1.length).toBe(16);
    expect(l2.length).toBe(16);
    expect(l1.startsWith('T:41C H:82%')).toBe(true);
    expect(l2.startsWith('HOT')).toBe(true);
  });
});

describe('Control FSM (5-state Moore machine & Boolean D2/D1/D0 equations)', () => {
  it('cycles IDLE -> REQUEST -> MEASURE -> EVALUATE -> DISPLAY -> IDLE via exact D2/D1/D0 equations', () => {
    let state: FsmStateName = 'IDLE';
    const sequence: FsmStateName[] = [state];
    for (let i = 0; i < 5; i++) {
      state = stepFsmAutomatic(state).nextState;
      sequence.push(state);
    }
    expect(sequence).toEqual(['IDLE', 'REQUEST', 'MEASURE', 'EVALUATE', 'DISPLAY', 'IDLE']);
  });

  it('holds state when handshake inputs remain 0 (except EVALUATE which advances in 1 cycle)', () => {
    const zeroInputs = { sample_tick: false, req_done: false, data_ready: false, lcd_done: false };
    expect(computeNextState('IDLE', zeroInputs).nextState).toBe('IDLE');
    expect(computeNextState('REQUEST', zeroInputs).nextState).toBe('REQUEST');
    expect(computeNextState('MEASURE', zeroInputs).nextState).toBe('MEASURE');
    expect(computeNextState('EVALUATE', zeroInputs).nextState).toBe('DISPLAY');
    expect(computeNextState('DISPLAY', zeroInputs).nextState).toBe('DISPLAY');
  });

  it('asserts one-hot Moore outputs in each active state and resets asynchronously to IDLE', () => {
    expect(getMooreOutputs('IDLE')).toEqual({ start: 0, shift_en: 0, eval_en: 0, lcd_update: 0 });
    expect(getMooreOutputs('REQUEST')).toEqual({ start: 1, shift_en: 0, eval_en: 0, lcd_update: 0 });
    expect(getMooreOutputs('MEASURE')).toEqual({ start: 0, shift_en: 1, eval_en: 0, lcd_update: 0 });
    expect(getMooreOutputs('EVALUATE')).toEqual({ start: 0, shift_en: 0, eval_en: 1, lcd_update: 0 });
    expect(getMooreOutputs('DISPLAY')).toEqual({ start: 0, shift_en: 0, eval_en: 0, lcd_update: 1 });
    expect(asyncResetFsm()).toBe('IDLE');
  });
});

describe('DHT11 Single-Wire Protocol & Checksum Simulator', () => {
  it('classifies pulses cleanly around the 54 us decision threshold', () => {
    expect(decodePulseDurationUs(27)).toBe(0);
    expect(decodePulseDurationUs(54)).toBe(0);
    expect(decodePulseDurationUs(55)).toBe(1);
    expect(decodePulseDurationUs(70)).toBe(1);
  });

  it('validates 41°C / 82% frame checksum (0x52 + 0x00 + 0x29 + 0x00 = 0x7B) and fires data_ready', () => {
    const frame = buildDht11Frame(82, 41, false);
    expect(frame.bits.length).toBe(40);
    expect(frame.expectedChecksum).toBe(0x7b);
    expect(frame.checksumValid).toBe(true);

    const doneSnap = getDht11Snapshot(frame, DHT11_TOTAL_STEPS);
    expect(doneSnap.phase).toBe('S_DONE');
    expect(doneSnap.dataReady).toBe(true);
  });

  it('corrupts frame cleanly so checksum fails, FSM returns to S_IDLE, and data_ready NEVER fires', () => {
    const badFrame = buildDht11Frame(82, 41, true);
    expect(badFrame.checksumValid).toBe(false);

    for (let step = 0; step <= DHT11_TOTAL_STEPS; step++) {
      const snap = getDht11Snapshot(badFrame, step);
      expect(snap.dataReady).toBe(false);
    }

    const finalSnap = getDht11Snapshot(badFrame, DHT11_TOTAL_STEPS);
    expect(finalSnap.phase).toBe('S_ERROR_RETURN_IDLE');
    expect(finalSnap.dataReady).toBe(false);
  });
});

describe('Live Weather Telemetry -> FPGA Input Mapping', () => {
  it('maps real-world readings cleanly into 8-bit DHT11 and 1-bit rain_in inputs', () => {
    const mapped = mapLiveWeatherToFpgaInputs({
      temperatureC: 29.4,
      humidityPct: 81.6,
      rainMm: 0,
      precipitationMm: 0,
      weatherCode: 3
    });

    expect(mapped.fpgaInputs).toEqual({ temp: 29, humidity: 82, rain: false });
    expect(mapped.tempClamped).toBe(false);
    expect(mapped.isRaining).toBe(false);

    const decoded = evaluateCombinational(mapped.fpgaInputs);
    expect(decoded.tempStatus).toBe('01');
    expect(decoded.humidityAlert).toBe(true);
    expect(decoded.rainAlert).toBe(false);
  });

  it('clamps sub-zero winter temperatures to 0°C (COLD 00) and detects rain via mm or WMO code', () => {
    const freezing = mapLiveWeatherToFpgaInputs({
      temperatureC: -6.3,
      humidityPct: 91,
      rainMm: 0,
      weatherCode: 73
    });
    expect(freezing.fpgaInputs).toEqual({ temp: 0, humidity: 91, rain: false });
    expect(freezing.tempClamped).toBe(true);
    expect(evaluateCombinational(freezing.fpgaInputs).tempStatus).toBe('00');

    const storm = mapLiveWeatherToFpgaInputs({
      temperatureC: 42.2,
      humidityPct: 86,
      rainMm: 0,
      weatherCode: 95
    });
    expect(storm.fpgaInputs).toEqual({ temp: 42, humidity: 86, rain: true });
    expect(storm.isRaining).toBe(true);
    expect(isRainWmoCode(95)).toBe(true);
    expect(isRainWmoCode(3)).toBe(false);
    expect(decodeWmoWeather(95)).toBe('Thunderstorm');
    expect(formatCoords(12.926, -21.9426)).toBe('12.93°N, 21.94°W');
  });
});
