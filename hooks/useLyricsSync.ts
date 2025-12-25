import { useEffect, useMemo, useRef, useState } from 'react';
import { KaraokeLine, KaraokeWord, LrcLine, RichSyncWord } from '@/constants/types';

export const useLyricsSync = (richSyncWords: RichSyncWord[], rawLrc: LrcLine[], currentTime: number, syncOffset: number = 0) => {
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const activeLineIndexRef = useRef(activeLineIndex);

    const processRichSync = (wordsData: RichSyncWord[], lrcData: LrcLine[]): KaraokeLine[] => {
        const lines: KaraokeLine[] = [];
        let currentLineWords: KaraokeWord[] = [];
        let lineIndex = 0;

        wordsData.forEach((wordData) => {
            const word = {
                text: wordData.punctuatedWord,
                start: wordData.start,
                end: wordData.end,
                duration: wordData.end - wordData.start
            };

            currentLineWords.push(word);

            if (wordData.isEndOfLine) {
                if (currentLineWords.length > 0) {
                    const startTime = currentLineWords[0].start;
                    const endTime = currentLineWords[currentLineWords.length - 1].end;
                    const originalLrcLine = lrcData[lineIndex];

                    lines.push({
                        line: originalLrcLine ? originalLrcLine.line : currentLineWords.map(w => w.text).join('').trim(),
                        milliseconds: startTime,
                        duration: endTime - startTime,
                        words: currentLineWords,
                        translations: originalLrcLine?.translations
                    });

                    currentLineWords = [];
                    lineIndex++;
                }
            }
        });

        if (currentLineWords.length > 0) {
            const startTime = currentLineWords[0].start;
            const endTime = currentLineWords[currentLineWords.length - 1].end;
            const originalLrcLine = lrcData[lineIndex];

            lines.push({
                line: originalLrcLine ? originalLrcLine.line : currentLineWords.map(w => w.text).join('').trim(),
                milliseconds: startTime,
                duration: endTime - startTime,
                words: currentLineWords,
                translations: originalLrcLine?.translations
            });
        }

        return lines;
    };

    const lyrics = useMemo(() => processRichSync(richSyncWords, rawLrc), [richSyncWords, rawLrc]);

    useEffect(() => {
        activeLineIndexRef.current = activeLineIndex;
    }, [activeLineIndex]);

    useEffect(() => {
        const effectiveTime = currentTime + syncOffset;
        const index = lyrics.findIndex((line) => {
            const startTime = line.milliseconds;
            const endTime = line.milliseconds + line.duration

            return effectiveTime >= startTime && effectiveTime < (endTime + 500);
        });

        if (index !== -1 && index !== activeLineIndex) {
            setActiveLineIndex(index);
        }
    }, [currentTime, activeLineIndex, lyrics]);

    return {
        lyrics,
        activeLineIndex,
        activeLineIndexRef
    };
}
