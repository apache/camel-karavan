import React, {createContext, useContext, useEffect, useState} from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleDarkMode: (checked: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('pf-theme');

        let shouldUseDark = false;

        if (storedTheme === 'dark') {
            shouldUseDark = true;
        } else if (storedTheme === 'light') {
            shouldUseDark = false;
        } else {
            // No stored preference → use browser preference
            shouldUseDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        setIsDark(shouldUseDark);
        document.documentElement.classList.toggle('pf-v6-theme-dark', shouldUseDark);
    }, []);

    const toggleDarkMode = (checked: boolean) => {
        setIsDark(checked);
        document.documentElement.classList.toggle('pf-v6-theme-dark', checked);
        localStorage.setItem('pf-theme', checked ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
