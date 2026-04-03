import React from 'react';
import {Button, Content, Divider, DrawerHead, DrawerPanelBody, DrawerPanelContent,} from '@patternfly/react-core';
import TimesIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {useDashboardStore} from "@stores/DashboardStore";
import {DashboardDevelopmentProjectPanel} from "@features/dashboard/development/DashboardDevelopmentProjectPanel";

export function DashboardDevelopmentDrawerPanel() {

    const {setShowSideBar, showSideBar, title} = useDashboardStore();

    return (
        <DrawerPanelContent className='async-drawer-panel' maxSize={'1000px'} defaultSize={'500px'} minSize={'500px'} isResizable>
            <DrawerHead>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 16px 16px'}}
                     onClick={e => e.stopPropagation()}>
                    <Content style={{flex: 1}} component={'h6'}>{title}</Content>
                    <Button variant="link" icon={<TimesIcon/>} onClick={() => {
                        setShowSideBar(null);
                    }}></Button>
                </div>
            </DrawerHead>
            <DrawerPanelBody>
                    <Divider style={{marginTop: 0}}/>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '16px 16px 16px 16px'}}
                         onClick={e => e.stopPropagation()}>
                        {showSideBar === 'integration' && <DashboardDevelopmentProjectPanel/>}
                        {showSideBar === 'openAPI' && <DashboardDevelopmentProjectPanel/>}
                    </div>
            </DrawerPanelBody>
        </DrawerPanelContent>
    )
}