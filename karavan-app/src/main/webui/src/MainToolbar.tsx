import React, {useEffect, useState} from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import './designer/karavan.css';
import {ProjectEventBus} from "./projects/ProjectEventBus";
import {Project, ProjectFile} from "./projects/ProjectModels";

interface Props {
    title: React.ReactNode;
    tools: React.ReactNode;
    file?: ProjectFile;
}

export const MainToolbar = (props: Props) => {
    const {title, tools, file} = props;

    const [project, setProject] = useState<Project | undefined>(undefined);
    const [mode, setMode] = useState<"design" | "code">("design");

    useEffect(() => {
        const sub1 = ProjectEventBus.onSelectProject()?.subscribe((result) => setProject(result));
        const sub2 = ProjectEventBus.onSetMode()?.subscribe((result) => setMode(result));
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
        };
    });

    function isKameletsProject(): boolean {
        return project?.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project?.projectId === 'templates';
    }

    return (
        <PageSection className="tools-section" variant={PageSectionVariants.light}>
            <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}
                  alignItems={{default: 'alignItemsCenter'}}>
                <FlexItem>
                    {title}
                </FlexItem>
                <FlexItem>
                    {tools}
                </FlexItem>
            </Flex>
        </PageSection>
    );
}
