import React, {ReactElement} from 'react';
import './RightPanel.css'
import {MainToolbar} from '@shared/ui/MainToolbar';
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";

interface Props {
    title: React.ReactNode;
    toolsStart?: React.ReactNode;
    tools?: React.ReactNode;
    mainPanel: React.ReactNode;
}

export function RightPanel(props: Props): ReactElement {

    const {title, toolsStart, tools, mainPanel} = props;

    return (
        <div className="right-panel">
            <div className="right-panel-top">
                <MainToolbar title={title} toolsStart={toolsStart} tools={tools}/>
            </div>
            <div className="right-panel-wrapper">
                <ErrorBoundaryWrapper onError={error => console.error(error)}>
                    {mainPanel}
                </ErrorBoundaryWrapper>
            </div>
        </div>
    )
}