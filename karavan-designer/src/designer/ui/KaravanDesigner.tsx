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
    Button,
    PageSection,
} from '@patternfly/react-core';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import '../karavan.css';
import {DslElement} from "./DslElement";
import {DslSelector} from "./DslSelector";
import {DslMetaModel} from "../model/DslMetaModel";
import {DslProperties} from "./DslProperties";
import {CamelElement, Integration} from "../model/CamelModel";
import {CamelYaml} from "../api/CamelYaml";
import {CamelApiExt} from "../api/CamelApiExt";
import {CamelApi} from "../api/CamelApi";
import {DslConnections} from "./DslConnections";
import {CamelUi} from "../api/CamelUi";
import {EventBus} from "../api/EventBus";

interface Props {
    onSave?: (name: string, yaml: string) => void
    name: string
    yaml: string
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    showSelector: boolean
    parentId: string
    parentType: string
    selectedUuid: string
    key: string
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.yaml
            ? CamelYaml.yamlToIntegration(this.props.yaml)
            : Integration.createNew(CamelUi.nameFomTitle(this.props.name)),
        showSelector: false,
        parentId: '',
        parentType: '',
        selectedUuid: '',
        key: "",
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = ()=>{
        this.setState({key: Math.random().toString()});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (!Object.is(prevState.integration, this.state.integration)) {
            this.props.onSave?.call(this, this.state.integration.metadata.name, this.getCode(this.state.integration));
        }
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            this.setState({selectedStep: undefined, selectedUuid: '', showSelector: false})
        }
    };

    getCode = (integration: Integration): string => {
        const clone = CamelYaml.cloneIntegration(integration);
        return CamelYaml.integrationToYaml(clone);
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string) => {
        const clone = CamelYaml.cloneIntegration(this.state.integration);
        const i = CamelApiExt.updateIntegration(clone, element, updatedUuid);
        this.setState({integration: i, key: Math.random().toString()})
    }

    deleteElement = (id: string) => {
        const i = CamelApiExt.deleteStepFromIntegration(this.state.integration, id);
        this.setState({integration: i, showSelector: false})
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element, selectedUuid: element.uuid, showSelector: false})
    }

    openSelector = (parentId: string | undefined, parentType: string | undefined) => {
        this.setState({showSelector: true, parentId: parentId || '', parentType: parentType || ''})
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string) => {
        switch (dsl.name) {
            case 'from' :
                const from = CamelApi.createStep(dsl.name, {from: {uri: dsl.uri}});
                this.addStep(from, parentId)
                break;
            case 'to' :
                const to = CamelApi.createStep(dsl.name, {to: {uri: dsl.uri}});
                this.addStep(to, parentId)
                break;
            default:
                const step = CamelApi.createStep(dsl.name, {});
                this.addStep(step, parentId)
                break;
        }
    }

    addStep = (step: CamelElement, parentId: string) => {
        const i = CamelApiExt.addStepToIntegration(this.state.integration, step, parentId);
        const clone = CamelYaml.cloneIntegration(i);
        this.setState({integration: clone, key: Math.random().toString(), showSelector: false})
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showSelector: false});
    };

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns">
                    <div className="flows"
                         data-click="FLOWS"
                         onClick={event => this.unselectElement(event)}
                         ref={el => {
                             if (el) EventBus.sendFlowPosition(el.getBoundingClientRect());
                         }}>
                        <DslConnections key={this.state.key + "-connections"}
                                        integration={this.state.integration}
                        />
                        {this.state.integration.spec.flows.map((flow, index) => (
                            <DslElement key={flow.uuid + this.state.key}
                                        openSelector={this.openSelector}
                                        deleteElement={this.deleteElement}
                                        selectElement={this.selectElement}
                                        selectedUuid={this.state.selectedUuid}
                                        step={flow}/>
                        ))}
                        <div className="add-flow">
                            <Button
                                variant={this.state.integration.spec.flows.length === 0 ? "primary" : "secondary"}
                                data-click="ADD_FLOW"
                                icon={<PlusIcon/>}
                                onClick={e => this.openSelector(undefined, undefined)}>Add flow
                            </Button>
                        </div>
                    </div>
                    <DslProperties
                        integration={this.state.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                        onChangeView={{}}
                    />
                </div>
                <DslSelector
                    parentId={this.state.parentId}
                    parentType={this.state.parentType}
                    show={this.state.showSelector}
                    onDslSelect={this.onDslSelect}
                    onClose={this.closeDslSelector}/>
            </PageSection>
        );
    }
};
