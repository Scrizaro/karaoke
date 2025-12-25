export interface RichSyncWord {
    punctuatedWord: string;
    word: string;
    start: number;
    end: number;
    isEndOfLine?: boolean;
}

export interface Translation {
    text: string;
}

export interface LrcLine {
    line: string;
    translations?: Record<string, Translation>;
}

export interface KaraokeWord {
    text: string;
    start: number;
    end: number;
    duration: number;
}

export interface KaraokeLine {
    line: string;
    milliseconds: number;
    duration: number;
    words: KaraokeWord[];
    translations?: Record<string, Translation>;
}
