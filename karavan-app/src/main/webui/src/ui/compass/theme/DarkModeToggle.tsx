import {ToggleGroup, ToggleGroupItem} from '@patternfly/react-core';
import {useTheme} from './ThemeContext';
import {Moon, Sun} from "@carbon/icons-react";

const DarkModeToggle = () => {
    const { isDark, toggleDarkMode } = useTheme();

    return (
        <ToggleGroup aria-label="DarkModeToggle" className={"dark-mode-toggle"} isCompact>
            <ToggleGroupItem
                icon={<Sun className={"carbon"}/>}
                aria-label="light"
                buttonId="toggle-group-icons-1"
                isSelected={!isDark}
                onChange={(_, selected) => toggleDarkMode(!selected)}
            />
            <ToggleGroupItem
                icon={<Moon className={"carbon"}/>}
                aria-label="dark"
                buttonId="toggle-group-icons-2"
                isSelected={isDark}
                onChange={(_, selected) => toggleDarkMode(selected)}
            />
        </ToggleGroup>
    );
};

export default DarkModeToggle;
