import React from 'react';
import {
    Toolbar,
    ToolbarContent,
    Gallery,
    ToolbarItem,
    TextInput,
    PageSection, TextContent, Text, PageSectionVariants, Flex, FlexItem, Badge
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {EipCard} from "./EipCard";
import {EipModal} from "./EipModal";
import {CamelModelMetadata, ElementMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    dark: boolean
}

interface State {
    element?: ElementMeta;
    isModalOpen: boolean;
    repository: string,
    path: string,
    elements: ElementMeta[],
    filter: string
}

export class EipPage extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        elements: CamelModelMetadata.sort((a: ElementMeta,b: ElementMeta) => a.name > b.name ? 1 : -1),
        filter: ''
    };

    select = (e: ElementMeta)=> {
        this.setState({element: e, isModalOpen: true})
    }

    search(filter: string){
        this.setState({
            filter: filter,
            isModalOpen: false,
            elements:  CamelModelMetadata.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
        })
    }

    render() {
        const element = this.state.element;
        const elements = this.state.elements;
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} padding={{ default: 'noPadding' }} className="kamelet-section">
                <EipModal key={element?.name + this.state.isModalOpen.toString()}
                          isOpen={this.state.isModalOpen} element={element}/>
                <PageSection  className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                        <FlexItem>
                            <TextContent className="header">
                                <Text component="h2">Enterprise Integration Patterns</Text>
                                <Badge isRead className="labels">{elements.length}</Badge>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <Toolbar id="toolbar-group-types">
                                <ToolbarContent>
                                    <ToolbarItem>
                                        <TextInput className="text-field" type="search" id="search" name="search"
                                                   value={this.state.filter}
                                                   onChange={value => this.search(value)}
                                                   autoComplete="off"
                                                   placeholder="Search by name"/>
                                    </ToolbarItem>
                                </ToolbarContent>
                            </Toolbar>
                        </FlexItem>
                    </Flex>
                </PageSection>
                <PageSection isFilled className="kamelets-page" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Gallery hasGutter>
                        {elements.map(c => (
                            <EipCard key={c.name} element={c} onClickCard={this.select}/>
                        ))}
                    </Gallery>
                </PageSection>
            </PageSection>
        );
    }
};