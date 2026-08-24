import React from 'react';
import {Button, Content, Divider, DrawerHead, DrawerPanelContent,} from '@patternfly/react-core';
import {TimesIcon} from "@patternfly/react-icons";
import {useProjectPageStore} from "./ProjectPageStore";
import "./ProjectDrawerPanel.css"
import {TemplatedRoutePanel} from "./templated-route/TemplatedRoutePanel";

export function ProjectDrawerPanel() {

    const {setShowSideBar, showSideBar, title} = useProjectPageStore();

    const defaultSize = "50%"

    return (
        <DrawerPanelContent maxSize={'90%'} defaultSize={defaultSize} minSize={'500px'} isResizable>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {/* --- TOP: Fixed Header --- */}
                <DrawerHead>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 16px 16px'}}
                         onClick={e => e.stopPropagation()}>
                        <Content style={{flex: 1}} component={'h6'}>{title}</Content>
                        <Button variant="link" icon={<TimesIcon/>} onClick={() => {
                            setShowSideBar(null);
                        }}></Button>
                    </div>
                </DrawerHead>
                <Divider style={{marginTop: 0}}/>
                    {showSideBar === "templatedRoute" && <TemplatedRoutePanel/>}
                {/*</div>*/}
            </div>
        </DrawerPanelContent>
    )
}