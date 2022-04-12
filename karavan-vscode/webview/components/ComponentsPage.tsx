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
import {ComponentCard} from "./ComponentCard";
import {ComponentModal} from "./ComponentModal";
import {Component} from "karavan-core/lib/model/ComponentModels";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";

interface Props {
    dark: boolean
}

interface State {
    component?: Component;
    isModalOpen: boolean;
    repository: string,
    path: string,
    components: Component[],
    filter: string
}

export class ComponentsPage extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        components: [],
        filter: ''
    };

    componentDidMount() {
        this.setState({components: ComponentApi.getComponents()})
    }

    select = (c: Component)=> {
        this.setState({component: c, isModalOpen: true})
    }

    search(filter: string){
        this.setState({
            filter: filter,
            isModalOpen: false,
            components:  ComponentApi.getComponents().filter(c => c.component.name.toLowerCase().includes(filter.toLowerCase()))
        })
    }

    render() {
        const component = this.state.component;
        const components = this.state.components;
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} padding={{ default: 'noPadding' }} className="kamelet-section">
                <ComponentModal key={component?.component.name + this.state.isModalOpen.toString()}
                                isOpen={this.state.isModalOpen} component={component}/>
                <PageSection  className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                        <FlexItem>
                            <TextContent className="header">
                                <Text component="h2">Component Catalog</Text>
                                <Badge isRead className="labels">{components.length}</Badge>
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
                        {components.map(c => (
                            <ComponentCard key={c.component.name} component={c} onClickCard={this.select}/>
                        ))}
                    </Gallery>
                </PageSection>
            </PageSection>
        );
    }
};