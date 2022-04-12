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
import {KameletCard} from "./KameletCard";
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {KameletModal} from "./KameletModal";

interface Props {
    dark: boolean
}

interface State {
    kamelet?: KameletModel;
    isModalOpen: boolean;
    repository: string,
    path: string,
    kamelets: KameletModel[],
    filter: string
}

export class KameletsPage extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        kamelets: [],
        filter: ''
    };

    componentDidMount() {
        this.setState({kamelets: KameletApi.getKamelets()})
    }

    select = (k: KameletModel)=> {
        this.setState({kamelet: k, isModalOpen: true})
    }

    search(filter: string){
        this.setState({
            filter: filter,
            isModalOpen: false,
            kamelets: KameletApi.getKamelets().filter(kamelet => kamelet.spec.definition.title.toLowerCase().includes(filter.toLowerCase()))
        })
    }

    render() {
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} padding={{ default: 'noPadding' }} className="kamelet-section">
                <KameletModal key={this.state.kamelet?.metadata.name + this.state.isModalOpen.toString()}
                              isOpen={this.state.isModalOpen} kamelet={this.state.kamelet}/>
                <PageSection  className="tools-section" variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Flex className="tools" justifyContent={{default: 'justifyContentSpaceBetween'}}>
                        <FlexItem>
                            <TextContent className="header">
                                <Text component="h2">Kamelet Catalog</Text>
                                <Badge isRead className="labels">{this.state.kamelets.length}</Badge>
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
                        {this.state.kamelets.map(k => (
                            <KameletCard key={k.metadata.name} kamelet={k} onClickCard={this.select}/>
                        ))}
                    </Gallery>
                </PageSection>
            </PageSection>
        );
    }
};