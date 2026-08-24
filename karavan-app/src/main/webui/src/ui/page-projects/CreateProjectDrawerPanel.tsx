import React from 'react';
import {Button, Content, Divider, DrawerHead, DrawerPanelContent,} from '@patternfly/react-core';
import {useDashboardStore} from "@stores/DashboardStore";
import {TimesIcon} from "@patternfly/react-icons";
import {DashboardDevelopmentProjectPanel} from "./DashboardDevelopmentProjectPanel";

function DashboardDevelopmentDrawerPanel() {

    const {setShowSideBar, showSideBar, title} = useDashboardStore();

    return (
        <DrawerPanelContent maxSize={'1000px'} defaultSize={'50%'} minSize={'500px'} isResizable>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {/* --- TOP: Fixed Header --- */}
                <DrawerHead>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0'}}
                         onClick={e => e.stopPropagation()}>
                        <Content style={{flex: 1}} component={'h6'}>{title}</Content>
                        <Button variant="link" icon={<TimesIcon/>} onClick={() => {
                            setShowSideBar(null);
                        }}></Button>
                    </div>
                </DrawerHead>
                <Divider style={{marginTop: 0}}/>
                {showSideBar === 'integration' && <DashboardDevelopmentProjectPanel/>}
            </div>
        </DrawerPanelContent>
    )
}

export default DashboardDevelopmentDrawerPanel