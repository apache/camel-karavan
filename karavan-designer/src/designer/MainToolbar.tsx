import React from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';

interface Props {
    title: React.ReactNode;
    toolsStart?: React.ReactNode;
    tools: React.ReactNode;
}

export function MainToolbar(props: Props) {

    return (
        <PageSection className="tools-section" variant={PageSectionVariants.light}>
            <Flex className="tools" justifyContent={{default: 'justifyContentFlexStart'}}
                  alignItems={{default: 'alignItemsCenter'}}>
                <FlexItem flex={{default: "flexNone"}}>
                    {props.title}
                </FlexItem>
                <FlexItem align={{default: 'alignLeft'}}>
                    {props.toolsStart}
                </FlexItem>
                <FlexItem align={{default: 'alignRight'}}>
                    {props.tools}
                </FlexItem>
            </Flex>
        </PageSection>
    )
}
