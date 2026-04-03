import * as React from 'react';
import './TopologyDocumentation.css';
import {Button, Card, CardBody, Label,} from "@patternfly/react-core";
import {useFilesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTopologyHook} from "@features/project/project-topology/useTopologyHook";

export function TopologyDocumentation() {

    const {selectFile} = useTopologyHook();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const docFiles = files.filter(f => f.name.endsWith(".md"))

    return (
        docFiles?.length > 0
            ? <Card isCompact className="topology-documentation-card">
                <CardBody className='card-body'>
                    {docFiles.map((file, index) => {
                        return (
                            <Label key={index}>
                                <Button variant='link'
                                        className='requirement-button'
                                        // icon={<MarkdownIcon/>}
                                        onClick={() => {
                                            selectFile(file.name)
                                        }}
                                >
                                    {file.name?.split('.')?.[0]}
                                </Button>
                            </Label>
                        )
                    })}
                </CardBody>
            </Card>
            : <></>
    )
}