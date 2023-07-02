import React, {useState} from 'react';
import '../../designer/karavan.css';
import {LogViewer} from '@patternfly/react-log-viewer';
import {useLogStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow"
import {Bullseye, Page, PageSection, PageSectionVariants, Skeleton, Spinner} from "@patternfly/react-core";

interface Props {
    autoScroll: boolean
    isTextWrapped: boolean
    header?: React.ReactNode
}

export const ProjectLog = (props: Props) => {

    const [data, currentLine] = useLogStore((state) => [state.data, state.currentLine], shallow );
    const [logViewerRef] = useState(React.createRef());

    return (
        data.length > 0
        ?
            <LogViewer
                isTextWrapped={props.isTextWrapped}
                innerRef={logViewerRef}
                hasLineNumbers={false}
                loadingContent={"Loading..."}
                header={props.header}
                height={"100vh"}
                data={data}
                scrollToRow={props.autoScroll ? currentLine : undefined}
                theme={'dark'}/>
        :
            <PageSection variant={PageSectionVariants.darker}>
                <Bullseye>
                    <Spinner isSVG diameter="80px" aria-label="Loading..."/>
                </Bullseye>
            </PageSection>
    );
}
