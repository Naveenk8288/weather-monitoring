import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

interface VoiceNarratorContextValue {
  supported: boolean;
  isSpeaking: boolean;
  activeSceneId: string | null;
  activeTitle: string | null;
  currentSentence: string;
  selectedVoiceName: string;
  availableMaleVoices: SpeechSynthesisVoice[];
  selectVoiceByName: (name: string) => void;
  speak: (sceneId: string, title: string, script: string) => void;
  stop: () => void;
  toggleSpeak: (sceneId: string, title: string, script: string) => void;
}

const VoiceNarratorContext = createContext<VoiceNarratorContextValue | null>(null);

// Preferred English male voice names ordered by natural clarity across macOS, Chrome, Windows, Edge, Android
const MALE_VOICE_KEYWORDS = [
  'daniel',
  'rishi',
  'alex',
  'aaron',
  'arthur',
  'oliver',
  'gordon',
  'lee',
  'google uk english male',
  'microsoft ryan',
  'microsoft guy',
  'microsoft david',
  'microsoft mark',
  'microsoft george',
  'microsoft ravi',
  'microsoft christopher',
  'microsoft eric',
  'microsoft roger',
  'en-gb-male',
  'en-us-male',
  'male',
  'fred',
  'ralph',
  'bruce',
  'junior'
];

const FEMALE_EXCLUDE_KEYWORDS = [
  'female',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'veena',
  'fiona',
  'zira',
  'hazel',
  'susan',
  'aria',
  'jenny',
  'sara',
  'sonia',
  'libby',
  'natasha',
  'clara',
  'ava',
  'allison',
  'nicky',
  'serena',
  'kate',
  'kathy',
  'google uk english female'
];

function scoreMaleVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (!lang.startsWith('en')) return -100;

  for (const fem of FEMALE_EXCLUDE_KEYWORDS) {
    if (name.includes(fem)) return -50;
  }

  for (let i = 0; i < MALE_VOICE_KEYWORDS.length; i++) {
    if (name.includes(MALE_VOICE_KEYWORDS[i])) {
      return 100 - i;
    }
  }

  // Neutral English fallback (pitched slightly lower if no named male voice exists)
  return 10;
}

function splitIntoChunks(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const rawSentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
  return rawSentences.map((s) => s.trim()).filter(Boolean);
}

export const VoiceNarratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const sessionIdRef = useRef<number>(0);

  // Load voices (handles Chrome/Safari async voiceschanged event)
  useEffect(() => {
    if (!supported) return;

    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      setVoices(list);
      setSelectedVoiceName((prev) => {
        if (prev && list.some((v) => v.name === prev)) return prev;
        const ranked = [...list]
          .filter((v) => v.lang.toLowerCase().startsWith('en'))
          .sort((a, b) => scoreMaleVoice(b) - scoreMaleVoice(a));
        return ranked[0]?.name ?? list[0]?.name ?? '';
      });
    };

    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
    };
  }, [supported]);

  const availableMaleVoices = useMemo(() => {
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    const sorted = [...en].sort((a, b) => scoreMaleVoice(b) - scoreMaleVoice(a));
    const maleOnly = sorted.filter((v) => scoreMaleVoice(v) > 0);
    return maleOnly.length > 0 ? maleOnly : sorted;
  }, [voices]);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    if (supported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSceneId(null);
    setActiveTitle(null);
    setCurrentSentence('');
  }, [supported]);

  // Cancel speech cleanly on page unload
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (sceneId: string, title: string, script: string) => {
      if (!supported) return;

      sessionIdRef.current += 1;
      const mySession = sessionIdRef.current;
      window.speechSynthesis.cancel();

      const chunks = splitIntoChunks(script);
      if (!chunks.length) return;

      const allVoices = window.speechSynthesis.getVoices();
      const chosenVoice =
        allVoices.find((v) => v.name === selectedVoiceName) ||
        [...allVoices]
          .filter((v) => v.lang.toLowerCase().startsWith('en'))
          .sort((a, b) => scoreMaleVoice(b) - scoreMaleVoice(a))[0] ||
        null;

      const isConfirmedMale = chosenVoice ? scoreMaleVoice(chosenVoice) >= 20 : false;

      setActiveSceneId(sceneId);
      setActiveTitle(title);
      setIsSpeaking(true);

      const speakChunk = (idx: number) => {
        if (sessionIdRef.current !== mySession) return;
        if (idx >= chunks.length) {
          setIsSpeaking(false);
          setActiveSceneId(null);
          setActiveTitle(null);
          setCurrentSentence('');
          return;
        }

        const sentence = chunks[idx];
        setCurrentSentence(sentence);

        const utt = new SpeechSynthesisUtterance(sentence);
        if (chosenVoice) {
          utt.voice = chosenVoice;
          utt.lang = chosenVoice.lang;
        } else {
          utt.lang = 'en-US';
        }
        // Rich, clear male narrator tone (slightly deeper pitch if using generic voice)
        utt.pitch = isConfirmedMale ? 0.92 : 0.78;
        utt.rate = 0.96;
        utt.volume = 1.0;

        utt.onend = () => {
          if (sessionIdRef.current === mySession) {
            speakChunk(idx + 1);
          }
        };
        utt.onerror = () => {
          if (sessionIdRef.current === mySession) {
            setIsSpeaking(false);
            setActiveSceneId(null);
            setActiveTitle(null);
            setCurrentSentence('');
          }
        };

        window.speechSynthesis.speak(utt);
      };

      // Slight tick avoids Chrome cancel()->speak() race condition
      window.setTimeout(() => {
        if (sessionIdRef.current === mySession) {
          speakChunk(0);
        }
      }, 45);
    },
    [supported, selectedVoiceName]
  );

  const toggleSpeak = useCallback(
    (sceneId: string, title: string, script: string) => {
      if (isSpeaking && activeSceneId === sceneId) {
        stop();
      } else {
        speak(sceneId, title, script);
      }
    },
    [isSpeaking, activeSceneId, stop, speak]
  );

  const value = useMemo<VoiceNarratorContextValue>(
    () => ({
      supported,
      isSpeaking,
      activeSceneId,
      activeTitle,
      currentSentence,
      selectedVoiceName,
      availableMaleVoices,
      selectVoiceByName: setSelectedVoiceName,
      speak,
      stop,
      toggleSpeak
    }),
    [
      supported,
      isSpeaking,
      activeSceneId,
      activeTitle,
      currentSentence,
      selectedVoiceName,
      availableMaleVoices,
      speak,
      stop,
      toggleSpeak
    ]
  );

  return <VoiceNarratorContext.Provider value={value}>{children}</VoiceNarratorContext.Provider>;
};

export function useVoiceNarrator(): VoiceNarratorContextValue {
  const ctx = useContext(VoiceNarratorContext);
  if (!ctx) throw new Error('useVoiceNarrator must be used within VoiceNarratorProvider');
  return ctx;
}
