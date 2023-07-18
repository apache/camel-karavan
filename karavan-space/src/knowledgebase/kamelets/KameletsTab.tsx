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
    PageSection,
    PageSectionVariants
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KameletCard} from "./KameletCard";
import {KameletModel} from "karavan-core/lib/model/KameletModels";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {KameletModal} from "./KameletModal";

interface Props {
    dark: boolean,
    filter: string,
    customOnly: boolean,
}

interface State {
    kamelet?: KameletModel;
    isModalOpen: boolean;
    repository: string,
    path: string,
    kamelets: KameletModel[],
}

export class KameletsTab extends React.Component<Props, State> {

    public state: State = {
        isModalOpen: false,
        repository: '',
        path: '',
        kamelets: [],
    };

    componentDidMount() {
        this.setState({kamelets: KameletApi.getKamelets()})
    }

    select = (k: KameletModel) => {
        this.setState({kamelet: k, isModalOpen: true})
    }

    render() {
        const {dark} = this.props;
        const {kamelets, kamelet, isModalOpen} = this.state;
        const {filter, customOnly} = this.props;
        let kameletList = kamelets.filter(kamelet =>
            kamelet.spec.definition.title.toLowerCase().includes(filter.toLowerCase()));
        if (customOnly) kameletList = kameletList.filter(k => KameletApi.getCustomKameletNames().includes(k.metadata.name));
        return (
            <PageSection variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}
                         padding={{default: 'noPadding'}} className="kamelet-section">
                <KameletModal key={kamelet?.metadata.name + isModalOpen.toString()}
                              isOpen={isModalOpen} kamelet={kamelet}/>
                <PageSection isFilled className="kamelets-page"
                             variant={dark ? PageSectionVariants.darker : PageSectionVariants.light}>
                    <Gallery hasGutter>
                        {kameletList.map(k => (
                            <KameletCard key={k.metadata.name} kamelet={k} onClickCard={this.select}/>
                        ))}
                    </Gallery>
                </PageSection>
            </PageSection>
        );
    }
}