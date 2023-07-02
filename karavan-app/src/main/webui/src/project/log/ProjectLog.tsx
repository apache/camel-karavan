import React, {useState} from 'react';
import '../../designer/karavan.css';
import {LogViewer} from '@patternfly/react-log-viewer';
import {useLogStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow"

interface Props {
    autoScroll: boolean
    isTextWrapped: boolean
    header?: React.ReactNode
}

export const ProjectLog = (props: Props) => {

    const [data, currentLine] = useLogStore((state) => [state.data, state.currentLine], shallow );
    const [logViewerRef] = useState(React.createRef());

    return (
            <LogViewer
                isTextWrapped={props.isTextWrapped}
                innerRef={logViewerRef}
                hasLineNumbers={false}
                loadingContent={"Loading..."}
                header={props.header}
                height={"100vh"}
                data={data.length > 0 ? data : "........."}
                scrollToRow={props.autoScroll ? currentLine : undefined}
                theme={'dark'}/>
    );
}
