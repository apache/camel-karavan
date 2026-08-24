import React, {ReactElement, useEffect} from 'react';
import './RightPanel.css'
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {useCompassStore} from "@compass/useCompassStore";
import {shallow} from "zustand/shallow";
import {PlatformNameForToolbar} from "@shared/ui/PlatformLogos";

interface Props {
    title: React.ReactNode;
    toolsStart?: React.ReactNode;
    tools?: React.ReactNode;
    drawerPanel?: React.ReactNode;
    mainPanel: React.ReactNode;
}

export function RightPanel(props: Props): ReactElement {

    const {title, toolsStart, tools, mainPanel, drawerPanel} = props;
    const setPageContext = useCompassStore(state => state.setPageContext, shallow);

    // Sync header elements to the top-level Compass layout
    useEffect(() => {
        const rightTop = tools || <PlatformNameForToolbar/>;
        setPageContext(title, toolsStart, rightTop, drawerPanel);
        return () => setPageContext(null, null, null, null);
    }, [title, toolsStart, tools, drawerPanel, setPageContext]);

    return (
        <div className="right-panel">
            <div className="right-panel-wrapper">
                <ErrorBoundaryWrapper onError={error => console.error(error)}>
                    {mainPanel}
                </ErrorBoundaryWrapper>
            </div>
        </div>
    )
}