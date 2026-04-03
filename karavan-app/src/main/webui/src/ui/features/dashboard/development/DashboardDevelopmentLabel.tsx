import React from 'react';
import {Label, Tooltip} from '@patternfly/react-core';

interface Props {
    tooltip?: string,
    label?: any,
    icon?: React.ReactNode,
    status?: 'success' | 'warning' | 'danger' | 'info' | 'custom',
    className?: string
}

export function DashboardDevelopmentLabel(props: Props) {

    const {tooltip, label, status, icon, className} = props;
    return (
        tooltip
            ? <Tooltip content={tooltip}>
                <Label icon={icon} status={status} variant='outline' className={className || ''}>
                    {label}
                </Label>
            </Tooltip>
            : <Label icon={icon} status={status} variant='outline' className={className || ''}>
                {label}
            </Label>
    )
}