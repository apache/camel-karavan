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
    Button, EmptyState, EmptyStateBody, EmptyStateIcon, TreeView,
    PageSection, Title, TreeViewDataItem, Card, CardHeader, CardTitle, CardBody, CardFooter, FormGroup, Form, TextInput, Accordion, AccordionItem, AccordionToggle, AccordionContent
} from '@patternfly/react-core';
import '../karavan.css';
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {DslProperties} from "../route/DslProperties";
import {RouteToCreate} from "../utils/CamelUi";
import {PostVerbDefinition, RestDefinition} from "../../../../karavan-core/lib/model/CamelDefinition";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {BeanIcon, RestIcon} from "../utils/KaravanIcons";
import {RestMethodCard} from "./RestMethodCard";
import {RestCard} from "./RestCard";

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    key: string
    expanded: Map<string, boolean>
}

export class RestDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        key: "",
        expanded: new Map<string, boolean>()
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, key: Math.random().toString()});
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element})
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string, newRoute?: RouteToCreate) => {
        // if (newRoute) {
        //     let i = CamelDefinitionApiExt.updateIntegration(this.state.integration, element, updatedUuid);
        //     const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName + ":" + newRoute.name})
        //     const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
        //     i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
        //     const clone = CamelUtil.cloneIntegration(i);
        //     this.setState({
        //         integration: clone,
        //         key: Math.random().toString(),
        //         showSelector: false,
        //         selectedStep: element,
        //         selectedUuid: element.uuid
        //     });
        // } else {
        //     const clone = CamelUtil.cloneIntegration(this.state.integration);
        //     const i = CamelDefinitionApiExt.updateIntegration(clone, element, updatedUuid);
        //     this.setState({integration: i, key: Math.random().toString()});
        // }
    }

    render() {
        const data = this.props.integration.spec.flows?.filter(f => f.dslName === 'RestDefinition');
        return (
            <PageSection className="rest-page" isFilled padding={{default: 'noPadding'}}>
                <div className="rest-page-columns">
                        {data?.map(rest => <RestCard rest={rest} integration={this.props.integration}/>)}
                </div>
            </PageSection>
        );
    }
}
