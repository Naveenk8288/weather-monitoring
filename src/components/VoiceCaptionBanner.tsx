import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Square, Volume2 } from 'lucide-react';
import { useVoiceNarrator } from '@/context/VoiceNarratorContext';

/**
 * Floating bottom-left live subtitle + male voice selector bar styled in Smoked-Forest & Gold Glass.
 */
export const VoiceCaptionBanner: React.FC = () => {
  const {
    isSpeaking,
    activeTitle,
    currentSentence,
    selectedVoiceName,
    availableMaleVoices,
    selectVoiceByName,
    stop
  } = useVoiceNarrator();

  return (
    <AnimatePresence>
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 z-40 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e3c68a]/30 bg-[#0b160c]/94 p-4 text-[#f5efe0] shadow-[0_18px_48px_rgba(4,10,5,0.78),inset_0_1px_0_rgba(245,222,170,0.2)] backdrop-blur-2xl"
          role="status"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#e3c68a]/15 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5c78a] text-[#0c160d]">
                <Volume2 className="h-3.5 w-3.5" />
              </span>
              <div className="truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-[#f4e4c1]">
                {activeTitle}
              </div>
            </div>

            <button
              type="button"
              onClick={stop}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e3c68a]/25 bg-[#e3c68a]/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#f4e4c1] transition hover:border-[#e3c68a] hover:bg-[#e3c68a]/20"
              aria-label="Stop male voice narration"
            >
              <Square className="h-2.5 w-2.5 fill-current" />
              Stop
            </button>
          </div>

          <p className="text-xs leading-relaxed text-[#f5efe0]/90">{currentSentence}</p>

          {availableMaleVoices.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e3c68a]/15 pt-2">
              <span className="font-mono text-[10px] uppercase text-[#e3c68a]/65">
                Male Voice
              </span>
              <select
                value={selectedVoiceName}
                onChange={(e) => selectVoiceByName(e.target.value)}
                aria-label="Select male narrator voice"
                className="max-w-[220px] truncate rounded-full border border-[#e3c68a]/25 bg-[#122214] px-2.5 py-0.5 font-mono text-[10px] text-[#f5efe0]"
              >
                {availableMaleVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
