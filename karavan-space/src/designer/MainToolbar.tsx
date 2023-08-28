import React from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';

interface Props {
    title: React.ReactNode;
    tools: React.ReactNode;
}

export function MainToolbar(props: Props) {

    return (
        <PageSection className="tools-section" variant={PageSectionVariants.light}>
            <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}
                  alignItems={{default: 'alignItemsCenter'}}>
                <FlexItem>
                    {props.title}
                </FlexItem>
                <FlexItem>
                    {props.tools}
                </FlexItem>
            </Flex>
        </PageSection>
    );
}
