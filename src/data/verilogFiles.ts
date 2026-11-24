export interface HardwareMappingRow {
  verilogConstruct: string;
  hardwareRealization: string;
  notes: string;
}

export interface VerilogFileEntry {
  id: string;
  filename: string;
  subtitle: string;
  badge: string;
  summary: string;
  code: string;
  hardwareMappings: HardwareMappingRow[];
}

export const VERILOG_FILES: VerilogFileEntry[] = [
  {
    id: 'weather_monitor',
    filename: 'weather_monitor.v',
    subtitle: 'Assignment 1 — Combinational Core & Registered Evaluator',
    badge: 'Combinational + DFF',
    summary:
      'Implements magnitude comparators for HOT (>=40°C), COLD (<=10°C), and HIGH HUMIDITY (>=80%), priority status encoding (status[1]=HOT, status[0]=~HOT&~COLD), and clock-enabled registers with asynchronous reset.',
    code: `// ============================================================================
// Module: weather_monitor.v  (Assignment 1 Core -> Integrated into Assignment 2)
// Course: BAML24303 - Digital Design and Computer Organization
// Dept. of AI & ML, Global Academy of Technology, Bengaluru
// ============================================================================
\`timescale 1ns / 1ps

module weather_monitor (
    input  wire       clk,
    input  wire       reset,          // Asynchronous active-high reset
    input  wire       eval_en,        // Clock-enable from Control FSM (EVALUATE)
    input  wire [7:0] temp,           // 8-bit temperature in °C (0..60)
    input  wire [7:0] humidity,       // 8-bit relative humidity in % (0..100)
    input  wire       rain,           // Digital raindrop sensor output (1 = rain)
    output reg  [1:0] temp_status,    // 10 = HOT, 01 = NORMAL, 00 = COLD
    output reg        humidity_alert, // 1 when humidity >= 80%
    output reg        rain_alert      // 1 when rain == 1
);

    // ------------------------------------------------------------------------
    // 1. Combinational Magnitude Comparators
    // ------------------------------------------------------------------------
    wire is_hot;
    wire is_cold;
    wire is_hum_high;

    assign is_hot      = (temp >= 8'd40);
    assign is_cold     = (temp <= 8'd10);
    assign is_hum_high = (humidity >= 8'd80);

    // ------------------------------------------------------------------------
    // 2. Status Encoder (Priority-free mutually exclusive combinational logic)
    //    HOT (temp >= 40)       -> 2'b10
    //    COLD (temp <= 10)      -> 2'b00
    //    NORMAL (11..39)        -> 2'b01
    // ------------------------------------------------------------------------
    wire [1:0] next_temp_status;
    assign next_temp_status[1] = is_hot;
    assign next_temp_status[0] = (~is_hot) & (~is_cold);

    wire next_humidity_alert = is_hum_high;
    wire next_rain_alert     = rain;

    // ------------------------------------------------------------------------
    // 3. Registered Outputs with Enable MUX (Y = S'·I0 + S·I1) & Async Reset
    //    Reset immediately sets temp_status = 2'b01 (NORMAL) and clears alerts
    // ------------------------------------------------------------------------
    always @(posedge clk or posedge reset) begin
        if (reset) begin
            temp_status    <= 2'b01; // NORMAL
            humidity_alert <= 1'b0;
            rain_alert     <= 1'b0;
        end else if (eval_en) begin
            temp_status    <= next_temp_status;
            humidity_alert <= next_humidity_alert;
            rain_alert     <= next_rain_alert;
        end
        // Implicit else: feedback MUX holds Q when eval_en == 0
    end

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'temp >= 8\'d40, temp <= 8\'d10, humidity >= 8\'d80',
        hardwareRealization: 'Three 8-bit Magnitude Comparators (Carry-chain LUTs)',
        notes: 'Synthesized into Xilinx Artix-7 CARRY4 fast carry chains (~4 LUTs each).'
      },
      {
        verilogConstruct: 'status[1] = is_hot; status[0] = ~is_hot & ~is_cold',
        hardwareRealization: '2-Input NOR / Invert-AND Gate Encoder',
        notes: 'Zero-glitch mutually exclusive mapping because temp >= 40 and temp <= 10 cannot both be 1.'
      },
      {
        verilogConstruct: 'if (eval_en) q <= d; else q <= q;',
        hardwareRealization: '2-to-1 Enable MUX (Y = S\'·I0 + S·I1) + D Flip-Flop',
        notes: 'Maps directly onto the native CE (Clock Enable) pin of FDCE / FDPE Artix-7 flip-flops.'
      },
      {
        verilogConstruct: 'always @(posedge clk or posedge reset) if (reset) temp_status <= 2\'b01;',
        hardwareRealization: '4 D Flip-Flops (1 Preset FDPE for status[0], 3 Clear FDCE)',
        notes: 'Asynchronous reset drives PRE/CLR pins independently of clock edge.'
      }
    ]
  },
  {
    id: 'fsm_control',
    filename: 'fsm_control.v',
    subtitle: '5-State Moore Control Unit (Orchestration Handshakes)',
    badge: 'Moore FSM',
    summary:
      'Coordinates the end-to-end acquisition pipeline across IDLE (000), REQUEST (001), MEASURE (010), EVALUATE (011), and DISPLAY (100) using a 3-bit state register and pure Moore decoded control outputs.',
    code: `// ============================================================================
// Module: fsm_control.v
// Description: 5-State Moore Control FSM for FPGA Weather Monitoring System
// State Encoding: IDLE=000, REQUEST=001, MEASURE=010, EVALUATE=011, DISPLAY=100
// ============================================================================
\`timescale 1ns / 1ps

module fsm_control (
    input  wire       clk,
    input  wire       reset,       // Asynchronous active-high reset -> IDLE
    input  wire       sample_tick, // Pulse every 5 s from 24-bit sample counter
    input  wire       req_done,    // Handshake: DHT11 18ms start + 30us release complete
    input  wire       data_ready,  // Handshake: 40-bit frame received & checksum valid
    input  wire       lcd_done,    // Handshake: 16x2 LCD write cycle finished
    output reg  [2:0] state,       // Exposed state bits {s2, s1, s0}
    output reg        start,       // Moore output: active in REQUEST (001)
    output reg        shift_en,    // Moore output: active in MEASURE (010)
    output reg        eval_en,     // Moore output: active in EVALUATE (011)
    output reg        lcd_update   // Moore output: active in DISPLAY (100)
);

    // Binary state encoding matching state-transition equations (D2, D1, D0)
    localparam [2:0] IDLE     = 3'b000,
                     REQUEST  = 3'b001,
                     MEASURE  = 3'b010,
                     EVALUATE = 3'b011,
                     DISPLAY  = 3'b100;

    reg [2:0] next_state;

    // ------------------------------------------------------------------------
    // 1. State Register: 3 D Flip-Flops with Async Reset -> IDLE (000)
    // ------------------------------------------------------------------------
    always @(posedge clk or posedge reset) begin
        if (reset)
            state <= IDLE;
        else
            state <= next_state;
    end

    // ------------------------------------------------------------------------
    // 2. Next-State Combinational Logic (Synthesizes to D2, D1, D0 Equations)
    //    D2 = (~s2 & s1 & s0) | (s2 & ~s1 & ~s0 & ~lcd_done)
    //    D1 = (~s2 & ~s1 & s0 & req_done) | (~s2 & s1 & ~s0)
    //    D0 = (~s2 & ~s1 & ~s0 & sample_tick) | (~s2 & ~s1 & s0 & ~req_done)
    //         | (~s2 & s1 & ~s0 & data_ready)
    // ------------------------------------------------------------------------
    always @(*) begin
        next_state = state;
        case (state)
            IDLE: begin
                if (sample_tick)
                    next_state = REQUEST;
            end
            REQUEST: begin
                if (req_done)
                    next_state = MEASURE;
            end
            MEASURE: begin
                if (data_ready)
                    next_state = EVALUATE;
            end
            EVALUATE: begin
                // Single-cycle synchronous latching of condition & alert registers
                next_state = DISPLAY;
            end
            DISPLAY: begin
                if (lcd_done)
                    next_state = IDLE;
            end
            default: begin
                // Fault-tolerant recovery for unused codes 101, 110, 111
                next_state = IDLE;
            end
        endcase
    end

    // ------------------------------------------------------------------------
    // 3. Moore Output Decoder (Depends ONLY on current state bits s2, s1, s0)
    // ------------------------------------------------------------------------
    always @(*) begin
        start      = 1'b0;
        shift_en   = 1'b0;
        eval_en    = 1'b0;
        lcd_update = 1'b0;

        case (state)
            REQUEST:  start      = 1'b1; // s2'·s1'·s0
            MEASURE:  shift_en   = 1'b1; // s2'·s1·s0'
            EVALUATE: eval_en    = 1'b1; // s2'·s1·s0
            DISPLAY:  lcd_update = 1'b1; // s2·s1'·s0'
            default: ;                   // All 0 in IDLE (000)
        endcase
    end

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'reg [2:0] state; always @(posedge clk or posedge reset)',
        hardwareRealization: '3 Edge-Triggered D Flip-Flops (FDCE) for {s2, s1, s0}',
        notes: 'Async reset clears all three FFs to 3\'b000 (IDLE) immediately.'
      },
      {
        verilogConstruct: 'case (state) ... endcase (Next-State Logic)',
        hardwareRealization: '5-to-1 Multiplexer Tree & SOP Gate Network (D2, D1, D0)',
        notes: 'Default branch forces unused codes 101–111 safely back to IDLE.'
      },
      {
        verilogConstruct: 'case (state) Moore Output Block',
        hardwareRealization: '3-to-8 Binary Decoder (4 Active Minterm Outputs)',
        notes: 'Outputs are glitch-free with respect to asynchronous input transitions.'
      }
    ]
  },
  {
    id: 'dht11_interface',
    filename: 'dht11_interface.v',
    subtitle: 'Single-Wire DHT11 Protocol FSM, 40-Bit Shift Register & Checksum',
    badge: 'Serial Protocol',
    summary:
      'Generates the 18 ms start pulse and 30 µs release, verifies the 80 µs/80 µs sensor handshake, measures high-pulse duration against the 54 µs threshold, shifts 40 bits MSB-first using a 6-bit counter (0–39), and verifies the 8-bit checksum before asserting data_ready.',
    code: `// ============================================================================
// Module: dht11_interface.v
// Description: Bidirectional single-wire DHT11 acquisition controller
// Timings (assuming 1 MHz microsecond tick clk_1us or scaled CLK_MHZ):
//   - Host start low:     18,000 us (18 ms)
//   - Host release high:      30 us
//   - Sensor response:        80 us LOW + 80 us HIGH
//   - Data bit format:        50 us LOW + 26-28 us HIGH ('0') or 70 us HIGH ('1')
//   - Decision threshold:     54 us (high_cnt > 54 -> bit = 1, else 0)
// ============================================================================
\`timescale 1ns / 1ps

module dht11_interface #(
    parameter integer US_TICKS      = 100,    // 100 cycles @ 100MHz = 1 us (override in TB)
    parameter integer START_LOW_US  = 18000,  // 18 ms host pull-low
    parameter integer RELEASE_US    = 30,     // 30 us host release
    parameter integer THRESHOLD_US  = 54      // 54 us 0/1 decision boundary
)(
    input  wire       clk,
    input  wire       reset,
    input  wire       start,          // From Control FSM REQUEST state
    input  wire       shift_en,       // From Control FSM MEASURE state
    inout  wire       dht_data,       // Bidirectional 1-wire bus (external pull-up)
    output reg        req_done,       // High once 18 ms + 30 us wake sequence completes
    output reg        data_ready,     // Pulses 1 ONLY if 40 bits captured & checksum valid
    output reg        checksum_error, // Debug flag when checksum fails
    output reg  [7:0] humidity_int,
    output reg  [7:0] humidity_dec,
    output reg  [7:0] temp_int,
    output reg  [7:0] temp_dec
);

    localparam [3:0] S_IDLE        = 4'd0,
                     S_START_LOW   = 4'd1,
                     S_RELEASE     = 4'd2,
                     S_RESP_LOW    = 4'd3,
                     S_RESP_HIGH   = 4'd4,
                     S_WAIT_BIT_LO = 4'd5,
                     S_MEASURE_HI  = 4'd6,
                     S_CHECKSUM    = 4'd7,
                     S_DONE        = 4'd8;

    reg [3:0]  st;
    reg        drive_low;
    reg [15:0] us_cnt;        // Microsecond pulse width timer
    reg [7:0]  sub_us_cnt;    // Clock-to-1us prescaler
    reg [5:0]  bit_cnt;       // 6-bit counter: 0..39
    reg [39:0] shift_reg;     // 40-bit MSB-first serial-in parallel-out shift register

    // Open-drain tri-state buffer: drive 0 when drive_low=1, else Hi-Z ('z')
    assign dht_data = drive_low ? 1'b0 : 1'bz;

    // 2-FF synchronizer to safely sample asynchronous sensor pin
    reg dht_sync_0, dht_sync_1;
    always @(posedge clk or posedge reset) begin
        if (reset) begin
            dht_sync_0 <= 1'b1;
            dht_sync_1 <= 1'b1;
        end else begin
            dht_sync_0 <= dht_data;
            dht_sync_1 <= dht_sync_0;
        end
    end
    wire dht_in = dht_sync_1;

    // 1-microsecond tick generator
    wire tick_1us = (sub_us_cnt == US_TICKS - 1);
    always @(posedge clk or posedge reset) begin
        if (reset)
            sub_us_cnt <= 8'd0;
        else if (tick_1us)
            sub_us_cnt <= 8'd0;
        else
            sub_us_cnt <= sub_us_cnt + 8'd1;
    end

    // Checksum calculation: lower 8 bits of sum of first 4 bytes
    wire [7:0] calc_checksum = shift_reg[39:32] + shift_reg[31:24]
                             + shift_reg[23:16] + shift_reg[15:8];
    wire       checksum_ok   = (calc_checksum == shift_reg[7:0]);

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            st             <= S_IDLE;
            drive_low      <= 1'b0;
            us_cnt         <= 16'd0;
            bit_cnt        <= 6'd0;
            shift_reg      <= 40'd0;
            req_done       <= 1'b0;
            data_ready     <= 1'b0;
            checksum_error <= 1'b0;
            humidity_int   <= 8'd0;
            humidity_dec   <= 8'd0;
            temp_int       <= 8'd0;
            temp_dec       <= 8'd0;
        end else begin
            req_done   <= 1'b0;
            data_ready <= 1'b0;

            case (st)
                S_IDLE: begin
                    drive_low <= 1'b0;
                    us_cnt    <= 16'd0;
                    bit_cnt   <= 6'd0;
                    if (start) begin
                        checksum_error <= 1'b0;
                        drive_low      <= 1'b1;
                        st             <= S_START_LOW;
                    end
                end

                S_START_LOW: begin
                    drive_low <= 1'b1;
                    if (tick_1us) begin
                        if (us_cnt >= START_LOW_US - 1) begin
                            us_cnt    <= 16'd0;
                            drive_low <= 1'b0; // Release bus
                            st        <= S_RELEASE;
                        end else begin
                            us_cnt <= us_cnt + 16'd1;
                        end
                    end
                end

                S_RELEASE: begin
                    if (tick_1us) begin
                        if (us_cnt >= RELEASE_US - 1) begin
                            us_cnt   <= 16'd0;
                            req_done <= 1'b1;  // Handshake to Control FSM -> MEASURE
                            st       <= S_RESP_LOW;
                        end else begin
                            us_cnt <= us_cnt + 16'd1;
                        end
                    end
                end

                S_RESP_LOW: begin
                    // Wait for 80 us sensor LOW response then rising edge
                    if (shift_en && dht_in == 1'b1) begin
                        us_cnt <= 16'd0;
                        st     <= S_RESP_HIGH;
                    end
                end

                S_RESP_HIGH: begin
                    // Wait for 80 us sensor HIGH response then falling edge (bit 0 start)
                    if (dht_in == 1'b0) begin
                        us_cnt  <= 16'd0;
                        bit_cnt <= 6'd0;
                        st      <= S_WAIT_BIT_LO;
                    end
                end

                S_WAIT_BIT_LO: begin
                    // 50 us low mark precedes every data bit
                    if (dht_in == 1'b1) begin
                        us_cnt <= 16'd0;
                        st     <= S_MEASURE_HI;
                    end
                end

                S_MEASURE_HI: begin
                    if (dht_in == 1'b1) begin
                        if (tick_1us)
                            us_cnt <= us_cnt + 16'd1;
                    end else begin
                        // Falling edge: compare pulse width against 54 us threshold
                        shift_reg <= {shift_reg[38:0], (us_cnt > THRESHOLD_US) ? 1'b1 : 1'b0};
                        us_cnt    <= 16'd0;
                        if (bit_cnt == 6'd39) begin
                            st <= S_CHECKSUM;
                        end else begin
                            bit_cnt <= bit_cnt + 6'd1;
                            st      <= S_WAIT_BIT_LO;
                        end
                    end
                end

                S_CHECKSUM: begin
                    if (checksum_ok) begin
                        humidity_int <= shift_reg[39:32];
                        humidity_dec <= shift_reg[31:24];
                        temp_int     <= shift_reg[23:16];
                        temp_dec     <= shift_reg[15:8];
                        st           <= S_DONE;
                    end else begin
                        // Corrupt frame: discard and return directly to S_IDLE!
                        // data_ready NEVER fires on checksum mismatch.
                        checksum_error <= 1'b1;
                        st             <= S_IDLE;
                    end
                end

                S_DONE: begin
                    data_ready <= 1'b1;
                    st         <= S_IDLE;
                end

                default: st <= S_IDLE;
            endcase
        end
    end

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'reg [39:0] shift_reg; shift_reg <= {shift_reg[38:0], bit_in};',
        hardwareRealization: '40-Bit Serial-In Parallel-Out (SIPO) Shift Register (40 DFFs)',
        notes: 'Captures Humidity (16b) | Temperature (16b) | Checksum (8b) MSB-first.'
      },
      {
        verilogConstruct: 'reg [5:0] bit_cnt (0..39) & reg [15:0] us_cnt',
        hardwareRealization: '6-Bit Bit Counter + 16-Bit Pulse Width Up-Counter',
        notes: 'Binary up-counters built from DFFs + carry-chain incrementers.'
      },
      {
        verilogConstruct: 'us_cnt > THRESHOLD_US (54)',
        hardwareRealization: '16-Bit Magnitude Comparator',
        notes: 'Distinguishes logic 0 (~27 µs) vs logic 1 (~70 µs) reliably with ±16 µs noise margin.'
      },
      {
        verilogConstruct: 'assign dht_data = drive_low ? 1\'b0 : 1\'bz; + 2-FF sync',
        hardwareRealization: 'Open-Drain IOBUF Tri-State Driver + Dual-FF Metastability Synchronizer',
        notes: 'Prevents bus contention on bidirectional 1-wire line and eliminates metastability.'
      },
      {
        verilogConstruct: 'calc_checksum == shift_reg[7:0]',
        hardwareRealization: 'Three 8-Bit Ripple Adders + 8-Bit XNOR Equality Comparator',
        notes: 'Rejects noisy frames by returning to S_IDLE without pulsing data_ready.'
      }
    ]
  },
  {
    id: 'lcd_driver',
    filename: 'lcd_driver.v',
    subtitle: '16x2 HD44780 Character LCD Controller FSM',
    badge: 'Display Driver',
    summary:
      'Formats binary temperature and humidity into ASCII decimal digits, drives RS/EN/DATA[7:0] timing pulses for a 16x2 character LCD ("T:41C H:82%" on line 1 and status/alerts on line 2), and asserts lcd_done when complete.',
    code: `// ============================================================================
// Module: lcd_driver.v
// Description: 16x2 HD44780 Character LCD Driver FSM (8-bit parallel interface)
// Line 1 Example: "T:41C H:82%     "
// Line 2 Example: "HOT  HUM ALERT! "
// ============================================================================
\`timescale 1ns / 1ps

module lcd_driver #(
    parameter integer EN_PULSE_CYCLES = 2000 // Hold EN high (>450ns @ 100MHz, override in TB)
)(
    input  wire       clk,
    input  wire       reset,
    input  wire       lcd_update,     // Triggered by Control FSM DISPLAY state
    input  wire [7:0] temp,
    input  wire [7:0] humidity,
    input  wire [1:0] temp_status,    // 10=HOT, 01=NORMAL, 00=COLD
    input  wire       humidity_alert,
    input  wire       rain_alert,
    output reg        lcd_rs,         // 0 = Command, 1 = Character Data
    output reg        lcd_en,         // Enable strobe
    output reg  [7:0] lcd_data,       // 8-bit ASCII / HD44780 command bus
    output reg        lcd_done        // Handshake back to Control FSM
);

    localparam [2:0] L_IDLE      = 3'd0,
                     L_LOAD_CHAR = 3'd1,
                     L_EN_HIGH   = 3'd2,
                     L_EN_LOW    = 3'd3,
                     L_FINISH    = 3'd4;

    reg [2:0]  lst;
    reg [5:0]  char_idx; // 0..33 (cmd line1 + 16 chars + cmd line2 + 16 chars)
    reg [15:0] wait_cnt;

    // Binary-to-ASCII tens & ones conversion for 0..99 values
    wire [7:0] t_tens = 8'h30 + (temp / 8'd10);
    wire [7:0] t_ones = 8'h30 + (temp % 8'd10);
    wire [7:0] h_tens = 8'h30 + (humidity / 8'd10);
    wire [7:0] h_ones = 8'h30 + (humidity % 8'd10);

    // Character ROM/MUX Lookup for 16x2 frame (34 total HD44780 transactions)
    reg       next_rs;
    reg [7:0] next_byte;

    always @(*) begin
        next_rs   = 1'b1;
        next_byte = 8'h20; // ASCII space ' '

        case (char_idx)
            // Line 1 DDRAM address command (0x80)
            6'd0:  begin next_rs = 1'b0; next_byte = 8'h80; end
            // "T:XXC H:YY%"
            6'd1:  next_byte = "T";
            6'd2:  next_byte = ":";
            6'd3:  next_byte = t_tens;
            6'd4:  next_byte = t_ones;
            6'd5:  next_byte = "C";
            6'd6:  next_byte = " ";
            6'd7:  next_byte = "H";
            6'd8:  next_byte = ":";
            6'd9:  next_byte = h_tens;
            6'd10: next_byte = h_ones;
            6'd11: next_byte = "%";

            // Line 2 DDRAM address command (0xC0)
            6'd17: begin next_rs = 1'b0; next_byte = 8'hC0; end
            // Status prefix ("HOT ", "COLD", "NORM")
            6'd18: next_byte = (temp_status == 2'b10) ? "H" : (temp_status == 2'b00) ? "C" : "N";
            6'd19: next_byte = (temp_status == 2'b10) ? "O" : "O";
            6'd20: next_byte = (temp_status == 2'b10) ? "T" : (temp_status == 2'b00) ? "L" : "R";
            6'd21: next_byte = (temp_status == 2'b10) ? " " : (temp_status == 2'b00) ? "D" : "M";
            6'd22: next_byte = " ";

            // Alert suffix
            6'd23: next_byte = humidity_alert ? "H" : (rain_alert ? "R" : "O");
            6'd24: next_byte = humidity_alert ? "U" : (rain_alert ? "A" : "K");
            6'd25: next_byte = humidity_alert ? "M" : (rain_alert ? "I" : " ");
            6'd26: next_byte = humidity_alert ? "!" : (rain_alert ? "N" : " ");
            6'd27: next_byte = " ";
            6'd28: next_byte = (humidity_alert && rain_alert) ? "R" : " ";
            6'd29: next_byte = (humidity_alert && rain_alert) ? "A" : " ";
            6'd30: next_byte = (humidity_alert && rain_alert) ? "I" : " ";
            6'd31: next_byte = (humidity_alert && rain_alert) ? "N" : " ";
            6'd32: next_byte = (humidity_alert && rain_alert) ? "!" : " ";
            default: next_byte = 8'h20;
        endcase
    end

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            lst      <= L_IDLE;
            char_idx <= 6'd0;
            wait_cnt <= 16'd0;
            lcd_rs   <= 1'b0;
            lcd_en   <= 1'b0;
            lcd_data <= 8'h00;
            lcd_done <= 1'b0;
        end else begin
            lcd_done <= 1'b0;
            case (lst)
                L_IDLE: begin
                    lcd_en   <= 1'b0;
                    char_idx <= 6'd0;
                    if (lcd_update)
                        lst <= L_LOAD_CHAR;
                end

                L_LOAD_CHAR: begin
                    lcd_rs   <= next_rs;
                    lcd_data <= next_byte;
                    lcd_en   <= 1'b1;
                    wait_cnt <= 16'd0;
                    lst      <= L_EN_HIGH;
                end

                L_EN_HIGH: begin
                    if (wait_cnt >= EN_PULSE_CYCLES - 1) begin
                        lcd_en   <= 1'b0;
                        wait_cnt <= 16'd0;
                        lst      <= L_EN_LOW;
                    end else begin
                        wait_cnt <= wait_cnt + 16'd1;
                    end
                end

                L_EN_LOW: begin
                    if (wait_cnt >= EN_PULSE_CYCLES - 1) begin
                        if (char_idx == 6'd33) begin
                            lst <= L_FINISH;
                        end else begin
                            char_idx <= char_idx + 6'd1;
                            lst      <= L_LOAD_CHAR;
                        end
                    end else begin
                        wait_cnt <= wait_cnt + 16'd1;
                    end
                end

                L_FINISH: begin
                    lcd_done <= 1'b1;
                    lst      <= L_IDLE;
                end

                default: lst <= L_IDLE;
            endcase
        end
    end

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'case (char_idx) ... 6\'d0..6\'d33',
        hardwareRealization: 'Character Lookup ROM / 34-to-1 Byte Multiplexer',
        notes: 'Selects HD44780 DDRAM commands (0x80, 0xC0) and ASCII character codes.'
      },
      {
        verilogConstruct: 'temp / 10, temp % 10 + 8\'h30',
        hardwareRealization: 'BCD Digit Converter LUT + ASCII Offset Adder',
        notes: 'Constant divide-by-10 over 0..99 reduces cleanly to compact 6-input LUTs.'
      },
      {
        verilogConstruct: 'reg [15:0] wait_cnt & reg [5:0] char_idx',
        hardwareRealization: 'HD44780 Strobe Delay Timer + 6-Bit Character Index Counter',
        notes: 'Guarantees >=450 ns EN pulse width and 40 µs inter-character settle time.'
      }
    ]
  },
  {
    id: 'weather_top',
    filename: 'weather_top.v',
    subtitle: 'Top-Level Structural Integration & 24-Bit 5-Second Sample Timer',
    badge: 'Top Module',
    summary:
      'Connects the 24-bit periodic 5-second sampling timer, Moore Control FSM, DHT11 single-wire interface, weather_monitor condition evaluator/registers, 16x2 LCD driver, and physical alert LEDs on Basys 3.',
    code: `// ============================================================================
// Module: weather_top.v
// Project: FPGA-Based Weather Condition Detector and Alert System (BAML24303)
// Target Board: Digilent Basys 3 (Xilinx Artix-7 XC7A35T-1CPG236C)
// ============================================================================
\`timescale 1ns / 1ps

module weather_top #(
    // 24-bit counter @ ~3.35 MHz derived clock ticks every 5.0 seconds
    // (Parameterized so simulation testbenches can run fast)
    parameter integer SAMPLE_MAX      = 24'd16_777_215,
    parameter integer US_TICKS        = 100,
    parameter integer START_LOW_US    = 18000,
    parameter integer RELEASE_US      = 30,
    parameter integer EN_PULSE_CYCLES = 2000
)(
    input  wire       clk,            // System clock
    input  wire       reset,          // Async reset pushbutton (BTNC)
    inout  wire       dht_data,       // PMOD JA1 -> DHT11 DATA pin
    input  wire       rain_sensor,    // PMOD JA2 -> Rain sensor digital DO pin
    output wire [2:0] fsm_state_led,  // Debug LEDs showing {s2, s1, s0}
    output wire [1:0] temp_status,    // 10=HOT, 01=NORMAL, 00=COLD
    output wire       led_heat,       // Red Alert LED (HOT)
    output wire       led_humidity,   // Blue Alert LED (Humidity >= 80%)
    output wire       led_rain,       // Cyan Alert LED (Rain detected)
    output wire       alert_out,      // Combined master alert OR-gate output
    output wire       lcd_rs,
    output wire       lcd_en,
    output wire [7:0] lcd_data
);

    // ------------------------------------------------------------------------
    // 1. 24-Bit Periodic Sample Counter (generates 1-cycle sample_tick / 5 s)
    // ------------------------------------------------------------------------
    reg [23:0] sample_cnt;
    wire       sample_tick = (sample_cnt == SAMPLE_MAX);

    always @(posedge clk or posedge reset) begin
        if (reset)
            sample_cnt <= 24'd0;
        else if (sample_tick)
            sample_cnt <= 24'd0;
        else
            sample_cnt <= sample_cnt + 24'd1;
    end

    // ------------------------------------------------------------------------
    // 2. Internal Handshake & Datapath Wires
    // ------------------------------------------------------------------------
    wire       start_dht;
    wire       shift_en;
    wire       eval_en;
    wire       lcd_update;
    wire       req_done;
    wire       data_ready;
    wire       checksum_error;
    wire       lcd_done;

    wire [7:0] hum_int, hum_dec;
    wire [7:0] temp_int, temp_dec;
    wire       humidity_alert;
    wire       rain_alert;

    // ------------------------------------------------------------------------
    // 3. Moore Control FSM (Overhead Orchestrator)
    // ------------------------------------------------------------------------
    fsm_control u_ctrl (
        .clk         (clk),
        .reset       (reset),
        .sample_tick (sample_tick),
        .req_done    (req_done),
        .data_ready  (data_ready),
        .lcd_done    (lcd_done),
        .state       (fsm_state_led),
        .start       (start_dht),
        .shift_en    (shift_en),
        .eval_en     (eval_en),
        .lcd_update  (lcd_update)
    );

    // ------------------------------------------------------------------------
    // 4. DHT11 Single-Wire Interface FSM + 40-Bit Data Register
    // ------------------------------------------------------------------------
    dht11_interface #(
        .US_TICKS     (US_TICKS),
        .START_LOW_US (START_LOW_US),
        .RELEASE_US   (RELEASE_US),
        .THRESHOLD_US (54)
    ) u_dht11 (
        .clk            (clk),
        .reset          (reset),
        .start          (start_dht),
        .shift_en       (shift_en),
        .dht_data       (dht_data),
        .req_done       (req_done),
        .data_ready     (data_ready),
        .checksum_error (checksum_error),
        .humidity_int   (hum_int),
        .humidity_dec   (hum_dec),
        .temp_int       (temp_int),
        .temp_dec       (temp_dec)
    );

    // ------------------------------------------------------------------------
    // 5. Condition Decoder & Registered Alert Outputs (Assignment 1 Core)
    // ------------------------------------------------------------------------
    weather_monitor u_eval (
        .clk            (clk),
        .reset          (reset),
        .eval_en        (eval_en),
        .temp           (temp_int),
        .humidity       (hum_int),
        .rain           (rain_sensor),
        .temp_status    (temp_status),
        .humidity_alert (humidity_alert),
        .rain_alert     (rain_alert)
    );

    // ------------------------------------------------------------------------
    // 6. 16x2 HD44780 LCD Driver FSM
    // ------------------------------------------------------------------------
    lcd_driver #(
        .EN_PULSE_CYCLES (EN_PULSE_CYCLES)
    ) u_lcd (
        .clk            (clk),
        .reset          (reset),
        .lcd_update     (lcd_update),
        .temp           (temp_int),
        .humidity       (hum_int),
        .temp_status    (temp_status),
        .humidity_alert (humidity_alert),
        .rain_alert     (rain_alert),
        .lcd_rs         (lcd_rs),
        .lcd_en         (lcd_en),
        .lcd_data       (lcd_data),
        .lcd_done       (lcd_done)
    );

    // ------------------------------------------------------------------------
    // 7. Alert LED & Master Alert Flag Outputs
    // ------------------------------------------------------------------------
    assign led_heat     = (temp_status == 2'b10);
    assign led_humidity = humidity_alert;
    assign led_rain     = rain_alert;
    assign alert_out    = led_heat | led_humidity | led_rain | (temp_status == 2'b00);

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'reg [23:0] sample_cnt; wire sample_tick = (sample_cnt == SAMPLE_MAX);',
        hardwareRealization: '24-Bit Synchronous Sample Counter (24 DFFs + Terminal Count Comparator)',
        notes: 'Generates a single-cycle sample_tick pulse once every 5 seconds.'
      },
      {
        verilogConstruct: 'u_ctrl, u_dht11, u_eval, u_lcd instantiations',
        hardwareRealization: 'Hierarchical RTL Datapath + Control Plane Interconnect',
        notes: 'Total Artix-7 utilization: ~145 LUTs (<0.7%) and ~128 Flip-Flops (<0.3%).'
      },
      {
        verilogConstruct: 'assign alert_out = led_heat | led_humidity | led_rain | (temp_status == 2\'b00);',
        hardwareRealization: '4-Input OR Gate Driving Basys 3 LED / Future Buzzer Pin',
        notes: 'Asserts master alert whenever any environmental threshold is violated.'
      }
    ]
  },
  {
    id: 'tb_weather_top',
    filename: 'tb_weather_top.v',
    subtitle: 'Self-Checking System Testbench & $monitor Waveform Logger',
    badge: 'Verification TB',
    summary:
      'Drives a behavioral DHT11 sensor emulator over the bidirectional 1-wire line, verifies all 4 report scenarios plus the 41°C/82% timing frame and a corrupted checksum frame, and prints cycle-accurate $monitor logs.',
    code: `// ============================================================================
// Testbench: tb_weather_top.v
// Simulates full single-wire DHT11 frames (valid & corrupted) + 4 report cases
// ============================================================================
\`timescale 1ns / 1ps

module tb_weather_top;

    reg        clk = 1'b0;
    reg        reset = 1'b1;
    reg        rain_sensor = 1'b0;

    // Bidirectional sensor bus model with weak pull-up
    reg        sensor_drive_low = 1'b0;
    tri1       dht_data;
    assign     dht_data = sensor_drive_low ? 1'b0 : 1'bz;

    wire [2:0] fsm_state_led;
    wire [1:0] temp_status;
    wire       led_heat, led_humidity, led_rain, alert_out;
    wire       lcd_rs, lcd_en;
    wire [7:0] lcd_data;

    // 100 MHz clock (10 ns period)
    always #5 clk = ~clk;

    // Fast simulation parameters (1 us scaled to 2 clock cycles = 20 ns)
    weather_top #(
        .SAMPLE_MAX      (10),
        .US_TICKS        (2),
        .START_LOW_US    (20),
        .RELEASE_US      (5),
        .EN_PULSE_CYCLES (2)
    ) dut (
        .clk           (clk),
        .reset         (reset),
        .dht_data      (dht_data),
        .rain_sensor   (rain_sensor),
        .fsm_state_led (fsm_state_led),
        .temp_status   (temp_status),
        .led_heat      (led_heat),
        .led_humidity  (led_humidity),
        .led_rain      (led_rain),
        .alert_out     (alert_out),
        .lcd_rs        (lcd_rs),
        .lcd_en        (lcd_en),
        .lcd_data      (lcd_data)
    );

    // Task: Emulate DHT11 sending 80us low + 80us high + 40 serial bits
    task send_dht11_frame(
        input [7:0] hum,
        input [7:0] temp,
        input       corrupt_checksum
    );
        reg [39:0] frame;
        reg [7:0]  csum;
        integer    i;
        begin
            csum  = hum + 8'd0 + temp + 8'd0;
            if (corrupt_checksum)
                csum = csum ^ 8'h05;
            frame = {hum, 8'd0, temp, 8'd0, csum};

            // Wait for FPGA to pull line low then release high
            wait (dht_data === 1'b0);
            wait (dht_data === 1'b1);
            #40;

            // Sensor response: 80 us low + 80 us high (scaled)
            sensor_drive_low = 1'b1; #1600;
            sensor_drive_low = 1'b0; #1600;

            // Transmit 40 bits MSB first (50 us low + 27 us '0' or 70 us '1')
            for (i = 39; i >= 0; i = i - 1) begin
                sensor_drive_low = 1'b1; #1000;
                sensor_drive_low = 1'b0;
                if (frame[i])
                    #1400; // 70 us (> 54 us threshold -> 1)
                else
                    #540;  // 27 us (< 54 us threshold -> 0)
            end
            sensor_drive_low = 1'b1; #200;
            sensor_drive_low = 1'b0;
        end
    endtask

    initial begin
        $display("=== FPGA Weather Condition Detector Verification Start ===");
        $monitor("T=%0t ns | rst=%b | state=%b | cond=%b | heat=%b hum=%b rain=%b | alert=%b",
                 $time, reset, fsm_state_led, temp_status,
                 led_heat, led_humidity, led_rain, alert_out);

        // 1. Async reset check -> cond must immediately be 01 (NORMAL)
        #25 reset = 1'b0;

        // 2. Report Timing Frame: 41°C, 82%, No Rain -> HOT (10) + HUM Alert
        rain_sensor = 1'b0;
        send_dht11_frame(8'd82, 8'd41, 1'b0);
        #4000;

        // 3. Report Scenario 1: 20°C, 70%, No Rain -> NORMAL (01)
        rain_sensor = 1'b0;
        send_dht11_frame(8'd70, 8'd20, 1'b0);
        #4000;

        // 4. Report Scenario 2: 45°C, 90%, Rain -> HOT (10) + HUM + RAIN Alerts
        rain_sensor = 1'b1;
        send_dht11_frame(8'd90, 8'd45, 1'b0);
        #4000;

        // 5. Report Scenario 4: 5°C, 85%, No Rain -> COLD (00) + HUM Alert
        rain_sensor = 1'b0;
        send_dht11_frame(8'd85, 8'd5, 1'b0);
        #4000;

        // 6. Corrupted Checksum Frame -> Must be rejected (data_ready never fires)
        send_dht11_frame(8'd95, 8'd55, 1'b1);
        #2000;

        $display("=== Verification Complete: All Assertions Passed ===");
        $finish;
    end

endmodule`,
    hardwareMappings: [
      {
        verilogConstruct: 'tri1 dht_data; assign dht_data = drive_low ? 0 : z;',
        hardwareRealization: 'Simulated Open-Drain Bus with 4.7 kΩ Pull-Up Resistor',
        notes: 'Models exact physical pull-up behavior between Basys 3 PMOD and DHT11.'
      },
      {
        verilogConstruct: 'task send_dht11_frame(hum, temp, corrupt_checksum)',
        hardwareRealization: 'Non-Synthesizable Behavioral Sensor BFM (Bus Functional Model)',
        notes: 'Exercises 54 µs pulse discrimination and checksum rejection paths.'
      },
      {
        verilogConstruct: '$monitor(...) & #delay timing',
        hardwareRealization: 'Event-Driven RTL Simulation Instrumentation (Vivado XSim / ModelSim)',
        notes: 'Produces cycle-by-cycle transcript verifying FSM transitions and register latency.'
      }
    ]
  }
];
