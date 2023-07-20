/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import {
    Gallery,
    PageSection, PageSectionVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {ComponentCard} from "./ComponentCard";
import {ComponentModal} from "./ComponentModal";
import {Component} from "karavan-core/lib/model/ComponentModels";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";

interface Props {
    dark: boolean,
    filter: string,
    onRefresh?: () => Promise<void>
}

interface State {
    component?: Component;
    isModalOpen: boolean;
    repository: string,
    path: string,
    components: Component[],
}

export class ComponentsTab extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        components: [],
    };

    componentDidMount() {
        this.setState({components: ComponentApi.getComponents()})
    }

    select = (c: Component)=> {
        this.setState({component: c, isModalOpen: true})
    }

    render() {
        const component = this.state.component;
        const {filter} = this.props;
        const components = ComponentApi.getComponents().filter(c => c.component.name.toLowerCase().includes(filter.toLowerCase()));
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} padding={{ default: 'noPadding' }} className="kamelet-section">
                <ComponentModal key={component?.component.name + this.state.isModalOpen.toString()}
                                isOpen={this.state.isModalOpen} component={component}/>
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