import * as React from 'react';
import './TopologyDocumentation.css';
import {Button, Card, CardBody, CardHeader, Divider,} from "@patternfly/react-core";
import {useFilesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTopologyHook} from "../project-topology/useTopologyHook";

export function TopologyDocumentation() {

    const {selectFile} = useTopologyHook();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const docFiles = files?.filter(f => f.name.endsWith(".md") && !f.name.startsWith("task-"));

    return (
        docFiles?.length > 0
            ? <Card isCompact className="topology-documentation-card">
                <CardHeader>Documentation</CardHeader>
                <Divider/>
                <CardBody className='card-body'>
                    {docFiles.map((file, index) => {
                        return (
                            <div key={index}>
                                <Button key={index}
                                        variant='link'
                                        className='requirement-button'
                                        // icon={<MarkdownIcon/>}
                                        onClick={() => {
                                            selectFile(file.name)
                                        }}
                                >
                                    {file.name?.split('.')?.[0]}
                                </Button>
                            </div>
                        )
                    })}
                </CardBody>
            </Card>
            : <></>
    )
}