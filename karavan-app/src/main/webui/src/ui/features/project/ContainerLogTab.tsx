import React, {useEffect, useRef, useState} from 'react';
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {LogWatchApi} from "@api/LogWatchApi";
import {LogViewer, LogViewerSearch} from '@patternfly/react-log-viewer';
import {Button, Checkbox, Tooltip, TooltipPosition} from "@patternfly/react-core";
import {ProjectEventBus} from "@bus/ProjectEventBus";
import {TrashAltIcon} from "@patternfly/react-icons";
import {ProjectContainerContextToolbar} from "@features/project/ProjectContainerContextToolbar";
import {useLogStore} from "@stores/LogStore";

export function ContainerLogTab() {

    const [selectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName]);
    const logViewerRef = useRef(null);
    const [data, setData] = useLogStore((state) => [state.data, state.setData], shallow);

    const [isTextWrapped, setIsTextWrapped] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const showLogger = selectedContainerName !== undefined && selectedContainerName !== null;
    const [controller, setController] = React.useState(new AbortController());

    useEffect(() => {
        setData([]);
        controller.abort()
        const c = new AbortController();
        setController(c);
        if (selectedContainerName) {
            const f = LogWatchApi.fetchData('container', selectedContainerName, c).then(_ => {
            });
        }
        return () => {
            c.abort();
        };
    }, [selectedContainerName]);

    function getToolbar() {
        return (
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingRight: '16px'}}>
                <LogViewerSearch placeholder={'search'} minSearchChars={4} style={{width: "400px"}}/>
                <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                    <Button variant="plain" onClick={() => ProjectEventBus.sendLog('set', '')} icon={<TrashAltIcon/>}/>
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


    const FooterButton = () => {
        const handleClick = () => {
            logViewerRef.current.scrollToBottom();
        };
        return (
            <div style={{display: 'flex', flexDirection: 'row', justifyContent:'center', alignItems: 'center', gap: '8px'}}>
                <Button variant={'link'} onClick={handleClick}>Jump to the bottom</Button>
            </div>
        );
    };

    const currentLine = data.length > 0 ? data.length - 1 : 0;
    return (
            <LogViewer
                    ref={logViewerRef}
                    isTextWrapped={isTextWrapped}
                    hasLineNumbers={false}
                    loadingContent={"Loading..."}
                    height={"100vh"}
                    data={showLogger && data.length > 0 ? data : []}
                    scrollToRow={autoScroll ? currentLine : undefined}
                    theme={'dark'}
                    toolbar={<ProjectContainerContextToolbar additionalTools={getToolbar()}/>}
                    footer={<FooterButton />}
                />
    );
}
