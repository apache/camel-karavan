import React from 'react';
import {
    Badge,
    Button,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Title,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {getProjectFileType, ProjectFile} from "./ProjectModels";
import {TableComposable, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';


interface Props {
    files: ProjectFile[],
    onOpenDeleteConfirmation: (file: ProjectFile) => void,
    onSelect: (file: ProjectFile) => void,
}

interface State {

}

export class ProjectFilesTable extends React.Component<Props, State> {

    public state: State = {};

    getDate(lastUpdate: number):string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toDateString() + ' ' + date.toLocaleTimeString();
        } else {
            return "N/A"
        }
    }

    render() {
        const {files, onOpenDeleteConfirmation, onSelect} = this.props;
        return (
            <TableComposable aria-label="Files" variant={"compact"} className={"table"}>
                <Thead>
                    <Tr>
                        <Th key='type' width={20}>Type</Th>
                        <Th key='filename' width={40}>Filename</Th>
                        <Th key='lastUpdate' width={30}>Updated</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {files.map(file => {
                        const type = getProjectFileType(file)
                        return <Tr key={file.name}>
                            <Td>
                                <Badge>{type}</Badge>
                            </Td>
                            <Td>
                                <Button style={{padding: '6px'}} variant={"link"}
                                        onClick={e => onSelect.call(this, file)}>
                                    {file.name}
                                </Button>
                            </Td>
                            <Td>
                                {this.getDate(file.lastUpdate)}
                            </Td>
                            <Td modifier={"fitContent"}>
                                {file.projectId !== 'templates' &&
                                    <Button style={{padding: '0'}} variant={"plain"}
                                            isDisabled={file.name === 'application.properties'}
                                            onClick={e => onOpenDeleteConfirmation.call(this, file)}>
                                        <DeleteIcon/>
                                    </Button>
                                }
                            </Td>
                        </Tr>
                    })}
                    {files.length === 0 &&
                        <Tr>
                            <Td colSpan={8}>
                                <Bullseye>
                                    <EmptyState variant={EmptyStateVariant.small}>
                                        <EmptyStateIcon icon={SearchIcon}/>
                                        <Title headingLevel="h2" size="lg">
                                            No results found
                                        </Title>
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </TableComposable>
        )
    }
}
