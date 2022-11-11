import React from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import './designer/karavan.css';

interface Props {
    title: React.ReactNode;
    tools: React.ReactNode;
}

export class MainToolbar extends React.PureComponent<Props> {
    render() {
        const { title, tools } = this.props;

        return (
            <PageSection className="tools-section" variant={PageSectionVariants.light}>
                <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}} alignItems={{default:'alignItemsCenter'}}>
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
}
