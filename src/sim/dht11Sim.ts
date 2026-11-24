export type Dht11Phase =
  | 'S_IDLE'
  | 'S_START_LOW'
  | 'S_RELEASE_HIGH'
  | 'S_RESP_LOW'
  | 'S_RESP_HIGH'
  | 'S_DATA_BITS'
  | 'S_CHECKSUM'
  | 'S_DONE'
  | 'S_ERROR_RETURN_IDLE';

export interface Dht11BitPulse {
  index: number; // 0..39 (MSB first: index 0 is bit 39)
  bitValue: 0 | 1;
  lowUs: number; // 50 us
  highUs: number; // ~27 us for '0', ~70 us for '1'
  byteGroup: 'HUM_INT' | 'HUM_DEC' | 'TEMP_INT' | 'TEMP_DEC' | 'CHECKSUM';
}

export interface Dht11Frame {
  humInt: number;
  humDec: number;
  tempInt: number;
  tempDec: number;
  expectedChecksum: number;
  transmittedChecksum: number;
  corrupted: boolean;
  checksumValid: boolean;
  bits: Dht11BitPulse[];
  raw40Bits: string;
}

export interface Dht11Snapshot {
  phase: Dht11Phase;
  bitCounter: number; // 0..40 (6-bit counter: 0..39 while shifting, 40 complete)
  bitCounterBinary: string; // 6-bit binary
  shiftRegister: (0 | 1 | null)[]; // length 40, MSB at index 0
  currentBit: Dht11BitPulse | null;
  dataReady: boolean;
  checksumChecked: boolean;
  checksumValid: boolean;
  statusMessage: string;
}

export const DHT11_TIMINGS = {
  HOST_START_LOW_MS: 18,
  HOST_RELEASE_HIGH_US: 30,
  SENSOR_RESP_LOW_US: 80,
  SENSOR_RESP_HIGH_US: 80,
  BIT_START_LOW_US: 50,
  BIT_ZERO_HIGH_US: 27, // 26-28 us
  BIT_ONE_HIGH_US: 70, // ~70 us
  DECISION_THRESHOLD_US: 54 // 54 us comparator threshold
} as const;

function byteToBits(value: number): (0 | 1)[] {
  const b = value & 0xff;
  const out: (0 | 1)[] = [];
  for (let i = 7; i >= 0; i--) {
    out.push(((b >> i) & 1) as 0 | 1);
  }
  return out;
}

/**
 * Builds a complete 40-bit DHT11 serial frame (MSB first):
 *   [Humidity Int (8)] [Humidity Dec (8)] [Temp Int (8)] [Temp Dec (8)] [Checksum (8)]
 * Checksum rule: checksum == (humInt + humDec + tempInt + tempDec) & 0xFF.
 * When corrupted = true, flips bit 0 of the transmitted checksum so verification fails.
 */
export function buildDht11Frame(
  humidity: number,
  temperature: number,
  corrupted = false
): Dht11Frame {
  const humInt = Math.max(0, Math.min(100, Math.round(humidity))) & 0xff;
  const humDec = 0;
  const tempInt = Math.max(0, Math.min(60, Math.round(temperature))) & 0xff;
  const tempDec = 0;

  const expectedChecksum = (humInt + humDec + tempInt + tempDec) & 0xff;
  const transmittedChecksum = corrupted ? expectedChecksum ^ 0x05 : expectedChecksum;
  const checksumValid = transmittedChecksum === expectedChecksum;

  const byteDefs: { value: number; group: Dht11BitPulse['byteGroup'] }[] = [
    { value: humInt, group: 'HUM_INT' },
    { value: humDec, group: 'HUM_DEC' },
    { value: tempInt, group: 'TEMP_INT' },
    { value: tempDec, group: 'TEMP_DEC' },
    { value: transmittedChecksum, group: 'CHECKSUM' }
  ];

  const bits: Dht11BitPulse[] = [];
  let idx = 0;
  for (const def of byteDefs) {
    const bArr = byteToBits(def.value);
    for (const bitValue of bArr) {
      bits.push({
        index: idx,
        bitValue,
        lowUs: DHT11_TIMINGS.BIT_START_LOW_US,
        highUs: bitValue === 1 ? DHT11_TIMINGS.BIT_ONE_HIGH_US : DHT11_TIMINGS.BIT_ZERO_HIGH_US,
        byteGroup: def.group
      });
      idx++;
    }
  }

  return {
    humInt,
    humDec,
    tempInt,
    tempDec,
    expectedChecksum,
    transmittedChecksum,
    corrupted,
    checksumValid,
    bits,
    raw40Bits: bits.map((b) => b.bitValue).join('')
  };
}

/**
 * Classifies a DHT11 high-pulse duration against the 54 µs RTL threshold.
 */
export function decodePulseDurationUs(highUs: number): 0 | 1 {
  return highUs > DHT11_TIMINGS.DECISION_THRESHOLD_US ? 1 : 0;
}

/**
 * Total timeline steps for discrete stepping / smooth scrubbing:
 *   Step 0: S_IDLE
 *   Step 1: S_START_LOW (18 ms low)
 *   Step 2: S_RELEASE_HIGH (30 us high)
 *   Step 3: S_RESP_LOW (80 us low)
 *   Step 4: S_RESP_HIGH (80 us high)
 *   Steps 5..44: 40 data bits shifted MSB first (bit index = step - 5, i.e., 0..39)
 *   Step 45: S_CHECKSUM verification
 *   Step 46: S_DONE (data_ready = 1) OR S_ERROR_RETURN_IDLE (data_ready = 0, returns to S_IDLE)
 */
export const DHT11_TOTAL_STEPS = 46;

export function getDht11Snapshot(frame: Dht11Frame, step: number): Dht11Snapshot {
  const s = Math.max(0, Math.min(DHT11_TOTAL_STEPS, Math.floor(step)));

  const shiftRegister: (0 | 1 | null)[] = new Array(40).fill(null);
  const shiftedCount = s >= 5 ? Math.min(40, s - 4) : 0;
  for (let i = 0; i < shiftedCount; i++) {
    shiftRegister[i] = decodePulseDurationUs(frame.bits[i].highUs);
  }

  const counterValue = s >= 5 ? Math.min(39, s - 5) : 0;
  const bitCounterBinary = (s >= 45 ? 39 : counterValue).toString(2).padStart(6, '0');

  if (s === 0) {
    return {
      phase: 'S_IDLE',
      bitCounter: 0,
      bitCounterBinary: '000000',
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: 'Bus pulled HIGH (idle). Waiting for start pulse from Control FSM.'
    };
  }
  if (s === 1) {
    return {
      phase: 'S_START_LOW',
      bitCounter: 0,
      bitCounterBinary: '000000',
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: 'FPGA drives data line LOW for 18 ms to wake DHT11 sensor.'
    };
  }
  if (s === 2) {
    return {
      phase: 'S_RELEASE_HIGH',
      bitCounter: 0,
      bitCounterBinary: '000000',
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: 'FPGA releases bus to Hi-Z; pull-up brings line HIGH for 30 µs.'
    };
  }
  if (s === 3) {
    return {
      phase: 'S_RESP_LOW',
      bitCounter: 0,
      bitCounterBinary: '000000',
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: 'DHT11 acknowledges by pulling line LOW for 80 µs.'
    };
  }
  if (s === 4) {
    return {
      phase: 'S_RESP_HIGH',
      bitCounter: 0,
      bitCounterBinary: '000000',
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: 'DHT11 drives line HIGH for 80 µs before transmitting bit 39 (MSB).'
    };
  }
  if (s >= 5 && s <= 44) {
    const bitIdx = s - 5;
    const bit = frame.bits[bitIdx];
    const decoded = decodePulseDurationUs(bit.highUs);
    return {
      phase: 'S_DATA_BITS',
      bitCounter: bitIdx,
      bitCounterBinary: bitIdx.toString(2).padStart(6, '0'),
      shiftRegister,
      currentBit: bit,
      dataReady: false,
      checksumChecked: false,
      checksumValid: frame.checksumValid,
      statusMessage: `Bit ${bitIdx}/39 [${bit.byteGroup}]: 50 µs LOW + ${bit.highUs} µs HIGH (${
        bit.highUs > DHT11_TIMINGS.DECISION_THRESHOLD_US ? '> 54 µs → 1' : '< 54 µs → 0'
      }), shifted '${decoded}' into shift_reg.`
    };
  }
  if (s === 45) {
    return {
      phase: 'S_CHECKSUM',
      bitCounter: 39,
      bitCounterBinary,
      shiftRegister,
      currentBit: null,
      dataReady: false,
      checksumChecked: true,
      checksumValid: frame.checksumValid,
      statusMessage: frame.checksumValid
        ? `Checksum PASS: (${frame.humInt} + ${frame.humDec} + ${frame.tempInt} + ${frame.tempDec}) & 0xFF = 0x${frame.expectedChecksum
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')} == 0x${frame.transmittedChecksum.toString(16).toUpperCase().padStart(2, '0')}.`
        : `Checksum FAIL: expected 0x${frame.expectedChecksum
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')}, received 0x${frame.transmittedChecksum
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')}! Discarding frame.`
    };
  }

  // Step 46: Final handoff or rejection
  if (frame.checksumValid) {
    return {
      phase: 'S_DONE',
      bitCounter: 39,
      bitCounterBinary,
      shiftRegister,
      currentBit: null,
      dataReady: true,
      checksumChecked: true,
      checksumValid: true,
      statusMessage: `Valid frame latched! data_ready = 1 pulsed to Control FSM (H=${frame.humInt}%, T=${frame.tempInt}°C).`
    };
  }

  return {
    phase: 'S_ERROR_RETURN_IDLE',
    bitCounter: 0,
    bitCounterBinary: '000000',
    shiftRegister,
    currentBit: null,
    dataReady: false,
    checksumChecked: true,
    checksumValid: false,
    statusMessage:
      'CHECKSUM MISMATCH: Interface FSM aborts straight to S_IDLE. data_ready NEVER fires!'
  };
}
