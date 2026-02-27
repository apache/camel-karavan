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
