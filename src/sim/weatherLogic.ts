export type TempStatusBits = '00' | '01' | '10';
export type TempStatusLabel = 'COLD' | 'NORMAL' | 'HOT';

export interface WeatherInputs {
  temp: number; // 0..60 °C
  humidity: number; // 0..100 %
  rain: boolean; // 0 or 1
}

export interface ComparatorSignals {
  hot: boolean; // temp >= 40
  cold: boolean; // temp <= 10
  humHigh: boolean; // humidity >= 80
  statusBit1: boolean; // status[1] = HOT
  statusBit0: boolean; // status[0] = !HOT && !COLD
  tempStatus: TempStatusBits;
  tempLabel: TempStatusLabel;
  humidityAlert: boolean;
  rainAlert: boolean;
}

export interface RegisteredWeatherState {
  tempStatus: TempStatusBits;
  tempLabel: TempStatusLabel;
  humidityAlert: boolean;
  rainAlert: boolean;
  latchedTemp: number;
  latchedHumidity: number;
  latchedRain: boolean;
  clockCount: number;
  isResetState: boolean;
}

export interface WeatherPreset {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  inputs: WeatherInputs;
  expectedSummary: string;
  fromReport: boolean;
}

export const TEMP_HOT_THRESHOLD = 40;
export const TEMP_COLD_THRESHOLD = 10;
export const HUMIDITY_HIGH_THRESHOLD = 80;

export const REPORT_PRESETS: WeatherPreset[] = [
  {
    id: 'report-normal-20',
    name: 'Scenario 1: Normal Ambient',
    shortLabel: '20°C · 70% · Dry',
    description: 'Baseline campus ambient reading within safe thresholds.',
    inputs: { temp: 20, humidity: 70, rain: false },
    expectedSummary: 'NORMAL (01) · No Alerts',
    fromReport: true
  },
  {
    id: 'report-hot-45',
    name: 'Scenario 2: Extreme Heat & Storm',
    shortLabel: '45°C · 90% · Rain',
    description: 'High temperature, high humidity, and active rainfall simultaneously.',
    inputs: { temp: 45, humidity: 90, rain: true },
    expectedSummary: 'HOT (10) · HUM + RAIN Alerts',
    fromReport: true
  },
  {
    id: 'report-normal-35',
    name: 'Scenario 3: Warm Normal',
    shortLabel: '35°C · 50% · Dry',
    description: 'Warm afternoon still below the 40°C heat threshold.',
    inputs: { temp: 35, humidity: 50, rain: false },
    expectedSummary: 'NORMAL (01) · No Alerts',
    fromReport: true
  },
  {
    id: 'report-cold-5',
    name: 'Scenario 4: Cold & Foggy',
    shortLabel: '5°C · 85% · Dry',
    description: 'Low temperature below 10°C paired with high humidity condensation.',
    inputs: { temp: 5, humidity: 85, rain: false },
    expectedSummary: 'COLD (00) · HUM Alert',
    fromReport: true
  },
  {
    id: 'timing-frame-41',
    name: 'Timing Frame (41°C / 82%)',
    shortLabel: '41°C · 82% · Dry',
    description: 'Testbench frame used in the timing waveform & DHT11 checksum example.',
    inputs: { temp: 41, humidity: 82, rain: false },
    expectedSummary: 'HOT (10) · HUM Alert',
    fromReport: false
  }
];

/**
 * Pure 2-to-1 MUX hardware primitive: Y = (!S & I0) | (S & I1)
 */
export function mux2to1(sel: boolean, i0: boolean, i1: boolean): boolean {
  return (!sel && i0) || (sel && i1);
}

/**
 * Combinational weather condition decoder matching Verilog RTL exactly:
 *   HOT       = (temp >= 40)
 *   COLD      = (temp <= 10)
 *   HUM_HIGH  = (humidity >= 80)
 *   status[1] = HOT
 *   status[0] = ~HOT & ~COLD
 */
export function evaluateCombinational(inputs: WeatherInputs): ComparatorSignals {
  const clampedTemp = Math.max(0, Math.min(60, Math.round(inputs.temp)));
  const clampedHum = Math.max(0, Math.min(100, Math.round(inputs.humidity)));

  const hot = clampedTemp >= TEMP_HOT_THRESHOLD;
  const cold = clampedTemp <= TEMP_COLD_THRESHOLD;
  const humHigh = clampedHum >= HUMIDITY_HIGH_THRESHOLD;

  const statusBit1 = hot;
  const statusBit0 = !hot && !cold;

  const tempStatus: TempStatusBits = `${statusBit1 ? '1' : '0'}${statusBit0 ? '1' : '0'}` as TempStatusBits;
  const tempLabel: TempStatusLabel =
    tempStatus === '10' ? 'HOT' : tempStatus === '00' ? 'COLD' : 'NORMAL';

  return {
    hot,
    cold,
    humHigh,
    statusBit1,
    statusBit0,
    tempStatus,
    tempLabel,
    humidityAlert: humHigh,
    rainAlert: Boolean(inputs.rain)
  };
}

/**
 * Asynchronous reset state matching Verilog:
 *   always @(posedge clk or posedge reset)
 *     if (reset) begin
 *       temp_status    <= 2'b01; // NORMAL
 *       humidity_alert <= 1'b0;
 *       rain_alert     <= 1'b0;
 *     end
 */
export function createResetRegisteredState(clockCount = 0): RegisteredWeatherState {
  return {
    tempStatus: '01',
    tempLabel: 'NORMAL',
    humidityAlert: false,
    rainAlert: false,
    latchedTemp: 20,
    latchedHumidity: 70,
    latchedRain: false,
    clockCount,
    isResetState: true
  };
}

/**
 * Rising-edge D Flip-Flop update with optional clock-enable MUX (evalEn).
 * When evalEn = false, the enable MUX feeds Q back into D (register holds).
 */
export function stepRegisteredState(
  prev: RegisteredWeatherState,
  inputs: WeatherInputs,
  evalEn = true
): RegisteredWeatherState {
  const comb = evaluateCombinational(inputs);
  const nextBit1 = mux2to1(evalEn, prev.tempStatus[0] === '1', comb.statusBit1);
  const nextBit0 = mux2to1(evalEn, prev.tempStatus[1] === '1', comb.statusBit0);
  const nextStatus = `${nextBit1 ? '1' : '0'}${nextBit0 ? '1' : '0'}` as TempStatusBits;
  const nextLabel: TempStatusLabel =
    nextStatus === '10' ? 'HOT' : nextStatus === '00' ? 'COLD' : 'NORMAL';

  return {
    tempStatus: nextStatus,
    tempLabel: nextLabel,
    humidityAlert: mux2to1(evalEn, prev.humidityAlert, comb.humidityAlert),
    rainAlert: mux2to1(evalEn, prev.rainAlert, comb.rainAlert),
    latchedTemp: evalEn ? Math.round(inputs.temp) : prev.latchedTemp,
    latchedHumidity: evalEn ? Math.round(inputs.humidity) : prev.latchedHumidity,
    latchedRain: evalEn ? Boolean(inputs.rain) : prev.latchedRain,
    clockCount: prev.clockCount + 1,
    isResetState: false
  };
}

/**
 * Detects whether combinational inputs differ from currently registered outputs
 * (indicating a pending rising clock edge).
 */
export function hasPendingClockUpdate(
  inputs: WeatherInputs,
  reg: RegisteredWeatherState
): boolean {
  const comb = evaluateCombinational(inputs);
  return (
    reg.isResetState ||
    comb.tempStatus !== reg.tempStatus ||
    comb.humidityAlert !== reg.humidityAlert ||
    comb.rainAlert !== reg.rainAlert ||
    Math.round(inputs.temp) !== reg.latchedTemp ||
    Math.round(inputs.humidity) !== reg.latchedHumidity
  );
}

/**
 * Formats strict 16x2 HD44780 LCD lines from registered FPGA outputs.
 */
export function formatLcdLines(reg: RegisteredWeatherState): [string, string] {
  if (reg.isResetState) {
    return ['T:--C H:--% RST ', 'NORMAL  SYS INIT'];
  }

  const tStr = String(reg.latchedTemp).padStart(2, '0');
  const hStr = String(reg.latchedHumidity).padStart(2, '0');
  const line1 = `T:${tStr}C H:${hStr}%`.padEnd(16, ' ').slice(0, 16);

  let line2 = '';
  if (reg.tempLabel === 'HOT') {
    if (reg.humidityAlert && reg.rainAlert) {
      line2 = 'HOT  HUM! RAIN!';
    } else if (reg.humidityAlert) {
      line2 = 'HOT  HUM ALERT!';
    } else if (reg.rainAlert) {
      line2 = 'HOT  RAIN ALRT!';
    } else {
      line2 = 'HOT  HEAT ALRT!';
    }
  } else if (reg.tempLabel === 'COLD') {
    if (reg.humidityAlert && reg.rainAlert) {
      line2 = 'COLD HUM! RAIN!';
    } else if (reg.humidityAlert) {
      line2 = 'COLD HUM ALERT!';
    } else if (reg.rainAlert) {
      line2 = 'COLD RAIN ALRT!';
    } else {
      line2 = 'COLD LOW TEMP!';
    }
  } else {
    if (reg.humidityAlert && reg.rainAlert) {
      line2 = 'NORM HUM! RAIN!';
    } else if (reg.humidityAlert) {
      line2 = 'NORM HUM ALERT!';
    } else if (reg.rainAlert) {
      line2 = 'NORM RAIN ALRT!';
    } else {
      line2 = 'NORMAL  ALL OK';
    }
  }

  return [line1, line2.padEnd(16, ' ').slice(0, 16)];
}
