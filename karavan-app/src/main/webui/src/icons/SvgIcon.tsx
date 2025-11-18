import React from 'react';
import {Icons} from './icons';
import {useTheme} from "@/main/ThemeContext";

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