import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleDarkMode: (checked: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('pf-theme');
        if (stored === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('pf-v6-theme-dark');
        }
    }, []);

    const toggleDarkMode = (checked: boolean) => {
        setIsDark(checked);
        if (checked) {
            document.documentElement.classList.add('pf-v6-theme-dark');
            localStorage.setItem('pf-theme', 'dark');
        } else {
            document.documentElement.classList.remove('pf-v6-theme-dark');
            localStorage.setItem('pf-theme', 'light');
        }
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
