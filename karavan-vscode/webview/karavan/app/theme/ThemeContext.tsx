/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // VS Code sets vscode-light | vscode-dark | vscode-high-contrast | vscode-high-contrast-light
        // on <body> and swaps it live when the user changes the color theme.
        const applyTheme = () => {
            const body = document.body.classList;
            const dark = body.contains('vscode-dark') || body.contains('vscode-high-contrast');
            const highContrast = body.contains('vscode-high-contrast') || body.contains('vscode-high-contrast-light');
            document.documentElement.classList.toggle('pf-v6-theme-dark', dark);
            document.documentElement.classList.toggle('pf-v6-theme-high-contrast', highContrast);
            setIsDark(dark);
        };
        applyTheme();
        const observer = new MutationObserver(applyTheme);
        observer.observe(document.body, {attributes: true, attributeFilter: ['class']});
        return () => observer.disconnect();
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark }}>
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