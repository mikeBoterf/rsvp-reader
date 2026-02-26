import { useState, useEffect, useCallback } from 'react';

export interface Settings {
    fontSize: number; // 1-5 scale
    pauseOnPunctuation: boolean;
    phraseSize: number; // 1 = single word, 2 = 2-word phrases, 3 = 3-word phrases
}

const STORAGE_KEY = 'rsvp-settings';

const DEFAULT_SETTINGS: Settings = {
    fontSize: 3, // Medium (4rem)
    pauseOnPunctuation: true,
    phraseSize: 1, // Single word by default
};

function loadSettings(): Settings {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

export function useSettings() {
    const [settings, setSettingsState] = useState<Settings>(loadSettings);

    // Save to localStorage whenever settings change
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const setFontSize = useCallback((size: number) => {
        const clampedSize = Math.max(1, Math.min(7, size));
        setSettingsState(prev => ({ ...prev, fontSize: clampedSize }));
    }, []);

    const togglePausePunctuation = useCallback(() => {
        setSettingsState(prev => ({ ...prev, pauseOnPunctuation: !prev.pauseOnPunctuation }));
    }, []);

    const setPausePunctuation = useCallback((enabled: boolean) => {
        setSettingsState(prev => ({ ...prev, pauseOnPunctuation: enabled }));
    }, []);

    const setPhraseSize = useCallback((size: number) => {
        const clamped = Math.max(1, Math.min(3, size));
        setSettingsState(prev => ({ ...prev, phraseSize: clamped }));
    }, []);

    const cyclePhraseSize = useCallback(() => {
        setSettingsState(prev => ({
            ...prev,
            phraseSize: prev.phraseSize >= 3 ? 1 : prev.phraseSize + 1,
        }));
    }, []);

    // Font size mapping to CSS rem values (7 levels)
    const fontSizeRem = {
        1: '2.5rem',
        2: '3rem',
        3: '4rem',
        4: '5rem',
        5: '6rem',
        6: '7rem',
        7: '8rem',
    }[settings.fontSize] || '4rem';

    return {
        fontSize: settings.fontSize,
        fontSizeRem,
        pauseOnPunctuation: settings.pauseOnPunctuation,
        phraseSize: settings.phraseSize,
        setFontSize,
        togglePausePunctuation,
        setPausePunctuation,
        setPhraseSize,
        cyclePhraseSize,
    };
}
