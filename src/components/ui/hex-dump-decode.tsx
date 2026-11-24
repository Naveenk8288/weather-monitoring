import React, { useEffect, useMemo, useState } from 'react';
import { Binary, Check, Code2, Copy, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface HexDumpDecodeProps {
  code: string;
  highlightedLines: string[]; // Pre-highlighted HTML per line (e.g. from PrismJS)
  filename?: string;
  maxHeightClass?: string;
  showDownload?: boolean;
  className?: string;
}

const HEX_CHARS = '0123456789ABCDEF';

function toHexByte(code: number): string {
  return (code & 0xff).toString(16).toUpperCase().padStart(2, '0');
}

function encodeLineToHexPreview(line: string, seed: number): string {
  const clean = line.trim();
  if (!clean) return '00 00 00 00 00 00 00 00';
  const len = Math.min(clean.length, 20);
  const parts: string[] = [];
  for (let i = 0; i < len; i++) {
    const ch = (clean.charCodeAt(i) + seed + i * 7) & 0xff;
    parts.push(HEX_CHARS[(ch >> 4) & 0xf] + HEX_CHARS[ch & 0xf]);
  }
  return parts.join(' ');
}

function computeSimpleCrc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) & 0xff;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 1) !== 0 ? (crc >> 1) ^ 0xa001 : crc >> 1;
    }
  }
  return '0x' + (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

interface HexDumpRow {
  offset: string;
  bytes: { hex: string; ascii: string; index: number }[];
}

function buildHexDumpRows(text: string, maxBytes = 1024): HexDumpRow[] {
  const slice = text.slice(0, maxBytes);
  const rows: HexDumpRow[] = [];
  for (let off = 0; off < slice.length; off += 16) {
    const chunk = slice.slice(off, off + 16);
    const bytes: HexDumpRow['bytes'] = [];
    for (let i = 0; i < chunk.length; i++) {
      const code = chunk.charCodeAt(i);
      const printable = code >= 32 && code <= 126 ? chunk[i] : '.';
      bytes.push({
        hex: toHexByte(code),
        ascii: printable,
        index: off + i
      });
    }
    rows.push({
      offset: off.toString(16).toUpperCase().padStart(8, '0'),
      bytes
    });
  }
  return rows;
}

/**
 * Interactive Hex-Dump-to-Code Decoder Terminal UI (inspired by 21st.dev `hex-dump-decode`).
 * Sweeps a luminous decode scanline across raw hexadecimal byte streams to reveal
 * syntax-highlighted Verilog HDL, with an interactive side-by-side HEX + ASCII dump view.
 */
export const HexDumpDecode: React.FC<HexDumpDecodeProps> = ({
  code,
  highlightedLines,
  filename = 'module.v',
  maxHeightClass = 'max-h-[520px]',
  showDownload = false,
  className
}) => {
  const reducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<'decode' | 'hexdump'>('decode');
  const [decodeRunId, setDecodeRunId] = useState(0);
  const [decodedLineCount, setDecodedLineCount] = useState<number>(
    reducedMotion ? highlightedLines.length : 0
  );
  const [scrambleTick, setScrambleTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hoveredByteIdx, setHoveredByteIdx] = useState<number | null>(null);
  const [activeHexRow, setActiveHexRow] = useState(0);

  const rawLines = useMemo(() => code.split('\n'), [code]);
  const totalLines = rawLines.length;
  const totalBytes = useMemo(() => new TextEncoder().encode(code).length, [code]);
  const crc16 = useMemo(() => computeSimpleCrc16(code), [code]);
  const hexDumpRows = useMemo(() => buildHexDumpRows(code, 1280), [code]);

  // First 12 real non-whitespace header bytes for the live hex stream strip
  const headerPreviewBytes = useMemo(() => {
    const trimmed = code.replace(/^\/\/.*\n/gm, '').trim().slice(0, 12);
    return Array.from(trimmed).map((ch) => ({
      hex: toHexByte(ch.charCodeAt(0)),
      char: ch === '\n' ? '↵' : ch
    }));
  }, [code]);

  // Animate hex-scramble -> decoded Verilog line sweep whenever file changes or Re-Decode is clicked
  useEffect(() => {
    if (reducedMotion) {
      setDecodedLineCount(totalLines);
      return;
    }

    setDecodedLineCount(0);
    let current = 0;
    const stepPerFrame = Math.max(1, Math.ceil(totalLines / 28));

    const timer = window.setInterval(() => {
      current = Math.min(totalLines, current + stepPerFrame);
      setDecodedLineCount(current);
      setScrambleTick((t) => (t + 1) % 64);
      if (current >= totalLines) {
        window.clearInterval(timer);
      }
    }, 34);

    return () => window.clearInterval(timer);
  }, [code, totalLines, decodeRunId, reducedMotion]);

  // Gentle scanning highlight sweep in HEX + ASCII mode
  useEffect(() => {
    if (viewMode !== 'hexdump' || reducedMotion || hexDumpRows.length === 0) return;
    const id = window.setInterval(() => {
      setActiveHexRow((r) => (r + 1) % Math.min(hexDumpRows.length, 32));
    }, 180);
    return () => window.clearInterval(id);
  }, [viewMode, reducedMotion, hexDumpRows.length]);

  const isDecoding = decodedLineCount < totalLines;
  const decodePct = totalLines > 0 ? Math.round((decodedLineCount / totalLines) * 100) : 100;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#04080e] text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(52,211,153,0.16)]',
        className
      )}
    >
      {/* Subtle CRT scanline texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(16,185,129,0.5) 0px, rgba(16,185,129,0.5) 1px, transparent 1px, transparent 3px)'
        }}
      />

      {/* Top Hex-Decode Terminal Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/20 bg-[#07111a]/95 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span className="font-bold tracking-wide text-emerald-300">{filename}</span>
          <span className="rounded border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-200">
            {totalBytes} B
          </span>
          <span className="hidden rounded border border-sky-400/25 bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-200 sm:inline">
            CRC16 {crc16}
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-bold',
              isDecoding
                ? 'animate-pulse bg-amber-500/25 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            )}
          >
            {isDecoding ? `DECODING ${decodePct}%` : 'HEX → RTL DECODED'}
          </span>
        </div>

        {/* Mode Switcher + Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-full border border-emerald-400/25 bg-black/70 p-0.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('decode')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition',
                viewMode === 'decode'
                  ? 'bg-emerald-400 font-bold text-slate-950'
                  : 'text-emerald-200/75 hover:text-white'
              )}
            >
              <Code2 className="h-3 w-3" />
              RTL Decode
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hexdump')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition',
                viewMode === 'hexdump'
                  ? 'bg-emerald-400 font-bold text-slate-950'
                  : 'text-emerald-200/75 hover:text-white'
              )}
            >
              <Binary className="h-3 w-3" />
              Hex Dump
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewMode('decode');
              setDecodeRunId((n) => n + 1);
            }}
            title="Replay hex-to-Verilog decode animation"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
          >
            <RefreshCw className={cn('h-3 w-3', isDecoding && 'animate-spin')} />
            <span className="hidden sm:inline">Decode</span>
          </button>

          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              aria-label={`Download ${filename}`}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">.v</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${filename}`}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-black/60 px-2.5 py-1 font-mono text-[11px] text-emerald-200 transition hover:border-emerald-300 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Hex-Bytes-to-ASCII Decoding Ticker Strip */}
      <div className="relative z-10 flex items-center justify-between gap-3 overflow-x-auto border-b border-emerald-400/15 bg-[#050c14] px-3.5 py-1.5 font-mono text-[10px]">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-emerald-400/70">HEX STREAM</span>
          <span className="text-slate-600">│</span>
          {headerPreviewBytes.map((b, i) => (
            <span
              key={i}
              className="rounded bg-emerald-400/10 px-1 py-0.5 text-emerald-300/90"
            >
              {b.hex}
            </span>
          ))}
          <span className="px-1 text-sky-400">→</span>
          <span className="font-semibold tracking-wider text-sky-100">
            {headerPreviewBytes.map((b) => b.char).join('')}
          </span>
        </div>
        <span className="hidden shrink-0 text-slate-500 md:inline">
          ADDR 0x0000–0x{(totalLines * 16).toString(16).toUpperCase().padStart(4, '0')}
        </span>
      </div>

      {/* Main Viewport: Decoded Verilog with Hex Address Gutter OR Side-by-Side Hex Dump */}
      <div className={cn('relative z-10 overflow-auto p-3.5 font-mono text-xs', maxHeightClass)}>
        {viewMode === 'decode' ? (
          <div className="min-w-max">
            {rawLines.map((line, idx) => {
              const isLineDecoded = idx < decodedLineCount;
              const isScanHead = isDecoding && idx === decodedLineCount;
              const addrHex = (idx * 16).toString(16).toUpperCase().padStart(4, '0');

              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-baseline rounded px-1.5 leading-[1.65] transition-colors',
                    isScanHead
                      ? 'bg-emerald-400/20 shadow-[0_0_16px_rgba(52,211,153,0.3)]'
                      : 'hover:bg-sky-400/8'
                  )}
                >
                  {/* Hex Offset Gutter */}
                  <span
                    className={cn(
                      'mr-3 w-12 shrink-0 select-none text-right text-[10px]',
                      isScanHead ? 'font-bold text-emerald-300' : 'text-emerald-500/45'
                    )}
                  >
                    0x{addrHex}
                  </span>

                  {/* Line Content: Decoded Prism HTML vs Live Scrambling Hex Bytes */}
                  {isLineDecoded ? (
                    <span
                      className="language-verilog whitespace-pre text-sky-50/90"
                      dangerouslySetInnerHTML={{
                        __html: highlightedLines[idx] || '&nbsp;'
                      }}
                    />
                  ) : (
                    <span
                      className={cn(
                        'whitespace-pre tracking-widest',
                        isScanHead ? 'font-bold text-emerald-300' : 'text-emerald-500/50'
                      )}
                    >
                      {encodeLineToHexPreview(line, scrambleTick + idx)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Classic 16-Byte Hex Dump + Synchronized ASCII Decode Table */
          <div className="min-w-[600px] space-y-0.5 text-[11px]">
            <div className="mb-2 flex items-center border-b border-emerald-400/20 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/75">
              <span className="w-24 shrink-0">OFFSET</span>
              <span className="flex-1">HEX BYTES (00 – 0F)</span>
              <span className="w-44 shrink-0 pl-4">ASCII DECODE</span>
            </div>

            {hexDumpRows.map((row, rIdx) => {
              const isScannedRow = rIdx === activeHexRow;
              return (
                <div
                  key={row.offset}
                  className={cn(
                    'flex items-center rounded px-1 py-0.5 transition-colors',
                    isScannedRow ? 'bg-emerald-400/12' : 'hover:bg-white/5'
                  )}
                >
                  <span className="w-24 shrink-0 select-none text-emerald-400/70">
                    {row.offset}:
                  </span>

                  {/* 16 Hex Bytes (split into two 8-byte words) */}
                  <div className="flex flex-1 flex-wrap items-center gap-x-1.5">
                    {row.bytes.map((b, bIdx) => {
                      const active = hoveredByteIdx === b.index;
                      return (
                        <React.Fragment key={b.index}>
                          {bIdx === 8 && <span className="w-2" />}
                          <span
                            onMouseEnter={() => setHoveredByteIdx(b.index)}
                            onMouseLeave={() => setHoveredByteIdx(null)}
                            className={cn(
                              'cursor-crosshair rounded px-0.5 transition-colors',
                              active
                                ? 'bg-emerald-400 font-bold text-slate-950'
                                : isScannedRow
                                  ? 'text-emerald-200'
                                  : 'text-sky-200/80'
                            )}
                          >
                            {b.hex}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Synchronized Decoded ASCII Column */}
                  <div className="w-44 shrink-0 border-l border-emerald-400/15 pl-4 tracking-wider">
                    {row.bytes.map((b) => {
                      const active = hoveredByteIdx === b.index;
                      return (
                        <span
                          key={b.index}
                          onMouseEnter={() => setHoveredByteIdx(b.index)}
                          onMouseLeave={() => setHoveredByteIdx(null)}
                          className={cn(
                            'inline-block cursor-crosshair transition-colors',
                            active
                              ? 'rounded bg-emerald-400 font-bold text-slate-950'
                              : b.ascii === '.'
                                ? 'text-slate-600'
                                : 'text-emerald-300'
                          )}
                        >
                          {b.ascii}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {code.length > 1280 && (
              <div className="pt-2 text-[10px] text-emerald-400/60">
                ... showing first 1,280 bytes of {totalBytes} total bytes (switch to RTL Decode for full source)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Decode Progress Hairline */}
      <div className="relative z-10 h-[2px] w-full bg-emerald-950">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-sky-300 to-emerald-200 transition-[width] duration-75"
          style={{ width: `${decodePct}%` }}
        />
      </div>
    </div>
  );
};
