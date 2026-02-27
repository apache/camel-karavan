import React from 'react';
import {Divider, DrawerHead, DrawerPanelBody, DrawerPanelContent,} from '@patternfly/react-core';

export function SourcesDrawerPanel() {

    return (
        <DrawerPanelContent className='async-drawer-panel' maxSize={'1000px'} defaultSize={'500px'} minSize={'500px'} isResizable>
            <DrawerHead>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 16px 16px'}}>

                </div>
            </DrawerHead>
            <DrawerPanelBody>
                    <Divider style={{marginTop: 0}}/>

            </DrawerPanelBody>
        </DrawerPanelContent>
    )
}