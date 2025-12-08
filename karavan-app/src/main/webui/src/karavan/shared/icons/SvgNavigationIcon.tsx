import React from 'react';
import {Icons} from './icons';

type IconName = keyof typeof Icons;

type SvgIconProps = Omit<React.SVGProps<SVGSVGElement>, 'name'> & {
    icon: IconName;
};

export function SvgNavigationIcon({
                                 icon,
                                 width = 16,
                                 height = 16,
                                 ...props
                             }: SvgIconProps) {
    const Component = Icons[icon];
    if (!Component) return null;
    return <Component width={width} height={height} {...props} />;
}