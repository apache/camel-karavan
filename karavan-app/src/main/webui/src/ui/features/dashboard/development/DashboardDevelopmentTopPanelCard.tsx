import React from 'react';
import {Card, CardBody, CardHeader, Content, HelperText, HelperTextItem, Label} from '@patternfly/react-core';

export interface DashboardDevelopmentTopPanelCardElement {
    tooltip: string,
    label: number,
    icon?: React.ReactNode,
    status?: 'success' | 'warning' | 'danger' | 'info' | 'custom',
    className?: string
}

export function DashboardDevelopmentTopPanelCard(title: string, icon: React.ReactNode, elements: DashboardDevelopmentTopPanelCardElement[], className?: string) {
    const form = new Intl.NumberFormat('en-US');
    return (
        <Card isCompact className={className}>
            <CardHeader className={"top-card-header"}>
                <Content component='h6'>{title}</Content>
                {icon}
            </CardHeader>
            <CardBody className="top-card-body">
                <div style={{display: "flex", flexDirection: "row", justifyContent: 'space-between'}}>
                    {elements.filter(e => e.label !== undefined).map((element, i) => {
                        const zero = element.label === 0;
                        const status = zero ? undefined : element.status;
                        const className =  zero ? 'top-label-disabled' : '';
                        return (
                            <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center"}} className={className}>
                                <Label icon={element.icon} isDisabled={zero} status={status} variant='outline' className={`top-label ${element.className}`}>
                                    {form.format(element.label)}
                                </Label>
                                <HelperText>
                                    <HelperTextItem>{element.tooltip}</HelperTextItem>
                                </HelperText>
                            </div>
                        )
                    })}
                </div>
            </CardBody>
        </Card>
    )
}