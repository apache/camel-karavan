import React, {useEffect} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from '@patternfly/react-icons';
import {useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useCommitsStore} from "@stores/CommitsStore";
import CommitsTabRow from "@features/project/commits/CommitsTabRow";
import {KaravanApi} from "@api/KaravanApi";

export function CommitsTab() {

    const {projectCommits, fetchProjectCommits, clearProjectCommits} = useCommitsStore();
    const [project] = useProjectStore((s) => [s.project], shallow);

    useEffect(() => {
        KaravanApi.loadProjectCommits(project.projectId, res => {
            fetchProjectCommits(project.projectId);
        });
        return () => clearProjectCommits();
    }, [project]);

    function getTableBody() {
        return projectCommits.map((commit, rowIndex) => {
            return (
                <CommitsTabRow key={rowIndex} commit={commit} rowIndex={rowIndex} project={project} />
            )
        });
    }

    function getTableEmpty() {
        return (
            <Tbody>
                <Tr>
                    <Td colSpan={8}>
                        <Bullseye>
                            <EmptyState variant={EmptyStateVariant.sm} titleText="No results found" icon={SearchIcon} headingLevel="h2"/>
                        </Bullseye>
                    </Td>
                </Tr>
            </Tbody>
        )
    }

    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="Files" variant={"compact"} className={"files-table"} isStickyHeader isExpandable>
                    <Thead>
                        <Tr>
                            <Th screenReaderText="Row expansion"/>
                            <Th key='id' modifier='fitContent' textCenter>Id</Th>
                            <Th key='time' modifier='fitContent' textCenter>Time</Th>
                            <Th key='name'>Author Name</Th>
                            <Th key='email'>Author Email</Th>
                            <Th key='message'>Message</Th>
                            <Th key='diffs' modifier='fitContent'>Diffs</Th>
                        </Tr>
                    </Thead>
                    {projectCommits.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}