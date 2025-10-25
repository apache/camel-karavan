import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { SunIcon, MoonIcon } from '@patternfly/react-icons';
import { useTheme } from './ThemeContext';

const DarkModeToggle = () => {
    const { isDark, toggleDarkMode } = useTheme();

    return (
        <ToggleGroup aria-label="DarkModeToggle" isCompact>
            <ToggleGroupItem
                icon={<SunIcon />}
                aria-label="light"
                buttonId="toggle-group-icons-1"
                isSelected={!isDark}
                onChange={(event, selected) => toggleDarkMode(!selected)}
            />
            <ToggleGroupItem
                icon={<MoonIcon />}
                aria-label="dark"
                buttonId="toggle-group-icons-2"
                isSelected={isDark}
                onChange={(event, selected) => toggleDarkMode(selected)}
            />
        </ToggleGroup>
    );
};

export default DarkModeToggle;
