import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Font = 'times' | 'playfair' | 'baskerville';

interface ThemeContextType {
    theme: Theme;
    font: Font;
    toggleTheme: () => void;
    setFont: (font: Font) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_THEME = 'rsvp-theme';
const STORAGE_KEY_FONT = 'rsvp-font';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_THEME);
        return (saved as Theme) || 'dark';
    });

    const [font, setFontState] = useState<Font>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_FONT);
        return (saved as Font) || 'times';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY_THEME, theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-font', font);
        localStorage.setItem(STORAGE_KEY_FONT, font);
    }, [font]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setFont = (newFont: Font) => {
        setFontState(newFont);
    };

    return (
        <ThemeContext.Provider value={{ theme, font, toggleTheme, setFont }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
