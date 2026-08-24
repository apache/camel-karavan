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
import React from 'react';
import {Icons} from './icons';
import {useTheme} from "@compass/theme/ThemeContext";

type IconName = keyof typeof Icons;

type SvgIconProps = Omit<React.SVGProps<SVGSVGElement>, 'name'> & {
    icon: IconName;
};

export function SvgIcon({
                                 icon,
                                 width = 16,
                                 height = 16,
                                 ...props
                             }: SvgIconProps) {
    const { isDark } = useTheme();
    let chosenIcon: IconName = icon;
    if (!isDark) {
        const lightName = `light-${icon}` as IconName;
        if (lightName in Icons) {
            chosenIcon = lightName;
        }
    }
    const Component = Icons[chosenIcon];
    if (!Component) return null;
    return <Component width={width} height={height} {...props} />;
}