import React from 'react';
import {Card, CardHeader, Content} from '@patternfly/react-core';

interface Props {
    title: string,
    description: string,
    icon: React.ReactNode,
    action: () => void;
}

export function DashboardDevelopmentCardAction(props: Props): React.ReactElement {

    const {title, description, icon, action} = props;
    return (
        <Card isClickable className={"action-card"}>
            <CardHeader
                selectableActions={{
                    // eslint-disable-next-line no-console
                    onClickAction: () => action(),
                    selectableActionAriaLabelledby: 'clickable-card-example-title-1'
                }}
            >
                <div className="action-card-header">
                    <div className="header-icon">
                        {icon}
                    </div>
                    <Content component={'p'} className={"title"}>{title}</Content>
                    <Content component={'p'} className={"description"}>{description}</Content>
                    {/*<HelperText>*/}
                    {/*    <HelperTextItem>{description}</HelperTextItem>*/}
                    {/*</HelperText>*/}
                </div>
            </CardHeader>
        </Card>
    )
}