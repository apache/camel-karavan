import React from 'react';
import {LogViewerSearch} from '@patternfly/react-log-viewer';
import {Button, Checkbox, Tooltip, TooltipPosition} from "@patternfly/react-core";
import {LogsEventBus} from "@bus/LogsEventBus";
import {TrashAltIcon} from "@patternfly/react-icons";
import {useContainerLogStore} from "../logs/useContainerLogStore";

export function ContainerLogToolbar() {

    const isTextWrapped = useContainerLogStore((s) => s.isTextWrapped);
    const setIsTextWrapped = useContainerLogStore((s) => s.setIsTextWrapped);
    const autoScroll = useContainerLogStore((s) => s.autoScroll);
    const setAutoScroll = useContainerLogStore((s) => s.setAutoScroll);

    return (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingRight: '16px'}}>
            <LogViewerSearch placeholder={'search'} minSearchChars={4} style={{width: "400px"}}/>
            <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => LogsEventBus.sendLog('set', '')} icon={<TrashAltIcon/>}/>
            </Tooltip>
            <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped}
                      id="wrap-text-checkbox"
                      onChange={(_, checked) => setIsTextWrapped(checked)}/>
            <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll}
                      id="autoscroll-checkbox"
                      onChange={(_, checked) => setAutoScroll(checked)}/>
        </div>
    );
}
