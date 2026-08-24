import React, {ReactElement, useEffect, useRef} from 'react';
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {LogWatchApi} from "@api/LogWatchApi";
import {LogViewer} from '@patternfly/react-log-viewer';
import {Button} from "@patternfly/react-core";
import {useLogStore} from "@stores/LogStore";
import {ProjectContainerContextToolbar} from "../ProjectContainerContextToolbar";
import {useContainerLogStore} from "../logs/useContainerLogStore";
import {ContainerLogToolbar} from "../logs/ContainerLogToolbar";

interface Props {
    additionalTools?: ReactElement;
    hideContainersToggle?: boolean;
}

export function ContainerLogTab(props: Props): ReactElement {

    const {additionalTools, hideContainersToggle} = props;
    const selectedContainerName = useSelectedContainerStore((s) => s.selectedContainerName);
    const data = useLogStore((s) => s.data);
    const setData = useLogStore((s) => s.setData);
    const isTextWrapped = useContainerLogStore((s) => s.isTextWrapped);
    const autoScroll = useContainerLogStore((s) => s.autoScroll);
    const [controller, setController] = React.useState(new AbortController());
    const showLogger = selectedContainerName !== undefined && selectedContainerName !== null;
    const logViewerRef = useRef(null);

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

    const FooterButton = () => {
        const handleClick = () => {
            logViewerRef.current.scrollToBottom();
        };
        return (
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
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
            width={"99%"}
            data={showLogger && data.length > 0 ? data : []}
            scrollToRow={autoScroll ? currentLine : undefined}
            theme={'dark'}
            toolbar={<ProjectContainerContextToolbar hideContainersToggle={hideContainersToggle} additionalTools={additionalTools || <ContainerLogToolbar/>}/>}
            footer={<FooterButton/>}
        />
    );
}
