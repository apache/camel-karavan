import React from 'react';
import {Card, CardBody, CardHeader, CardTitle, Content, Divider} from '@patternfly/react-core';
import './DashboardDevelopment.css'

interface Props {
    title?: string,
    body: React.ReactNode,
    className?: string
}

export function DashboardDevelopmentCard(props: Props): React.ReactElement {

    const {title, body, className} = props;
    return (
        <Card className={`dashboard-development-card ${className}`}>
            {title &&
                <CardHeader>
                    <CardTitle id={title}>
                        <Content component='h6'>{title}</Content>
                    </CardTitle>
                </CardHeader>
            }
            <Divider/>
            <CardBody>{body}</CardBody>
        </Card>
    )
}