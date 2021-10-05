import React from 'react';
import {
    PageSectionVariants, Flex, PageSection, FlexItem
} from '@patternfly/react-core';
import './karavan.css';

interface Props {
    title: any
    tools: any
}

interface State {
    title: any
    tools: React.Component
}

export class MainToolbar extends React.Component<Props, State> {

    public state: State = {
        title: this.props.title,
        tools: this.props.tools
    };

    // componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
    //     if (prevState.tools !== this.props.tools) {
    //         this.setState({tools: this.props.tools});
    //     }
    //     if (prevState.title !== this.props.title) {
    //         this.setState({title: this.props.title});
    //     }
    // }

    render() {
        return (
            <PageSection className="tools-section" variant={PageSectionVariants.light}>
                <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                    <FlexItem>
                        {this.state.title}
                    </FlexItem>
                    <FlexItem>
                        {this.state.tools}
                    </FlexItem>
                </Flex>
            </PageSection>
        );
    }
};