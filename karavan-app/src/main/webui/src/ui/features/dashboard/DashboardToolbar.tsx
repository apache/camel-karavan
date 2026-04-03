import React from 'react';
import '@features/project/designer/karavan.css';
import {PlatformNameForToolbar} from "@shared/ui/PlatformLogos";

export function DashboardToolbar () {

    return (
        <div id="toolbar-group-types" style={{height: '65px'}}>
            {PlatformNameForToolbar()}
        </div>
    )

}