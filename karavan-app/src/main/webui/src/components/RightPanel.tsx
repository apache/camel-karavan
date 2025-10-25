import React, {ReactElement} from 'react';
import './RightPanel.css'
import {MainToolbar} from '@/components/MainToolbar';
import {ErrorBoundaryWrapper} from "@/components/ErrorBoundaryWrapper";
import {RuntimePanel} from "@/runtime/RuntimePanel";

interface Props {
    title: React.ReactNode;
    toolsStart?: React.ReactNode;
    tools: React.ReactNode;
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
            <ErrorBoundaryWrapper onError={error => console.error(error)}>
                <RuntimePanel/>
            </ErrorBoundaryWrapper>
        </div>
    )
}