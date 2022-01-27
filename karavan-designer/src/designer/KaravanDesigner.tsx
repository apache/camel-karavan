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
import './karavan.css';
import {DslSelector} from "./DslSelector";
import {DslMetaModel} from "karavan-core/lib/model/DslMetaModel";
import {DslProperties} from "./DslProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelElement, FromDefinition, Integration} from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslConnections} from "./DslConnections";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DslElement} from "./DslElement";
import {EventBus} from "./EventBus";

interface Props {
    onSave?: (filename: string, yaml: string) => void
    filename: string
    yaml: string
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    showSelector: boolean
    parentId: string
    parentDsl?: string
    showSteps: boolean
    selectedUuid: string
    key: string
    width: number
    height: number
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.yaml
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        showSelector: false,
        parentId: '',
        showSteps: true,
        selectedUuid: '',
        key: "",
        width: 1000,
        height: 1000,
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
        if (prevState.key !== this.state.key) {
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
        const clone = CamelUtil.cloneIntegration(integration);
        return CamelDefinitionYaml.integrationToYaml(clone);
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.updateIntegration(clone, element, updatedUuid);
        this.setState({integration: i, key: Math.random().toString()});
    }

    deleteElement = (id: string) => {
        const i = CamelDefinitionApiExt.deleteStepFromIntegration(this.state.integration, id);
        this.setState({
            integration: i,
            showSelector: false,
            key: Math.random().toString(),
            selectedStep: undefined,
            selectedUuid: ''
        });
        const el = new CamelElement("");
        el.uuid = id;
        EventBus.sendPosition("delete", el,undefined, new DOMRect(), new DOMRect(), 0);
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element, selectedUuid: element.uuid, showSelector: false})
    }

    openSelector = (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean = true) => {
        this.setState({showSelector: true, parentId: parentId || '', parentDsl: parentDsl, showSteps: showSteps})
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string) => {
        switch (dsl.dsl) {
            case 'FromDefinition' :
                const from = CamelDefinitionApi.createRouteDefinition({from: new FromDefinition({uri: dsl.uri})});
                this.addStep(from, parentId)
                break;
            case 'ToDefinition' :
                const to = CamelDefinitionApi.createStep(dsl.dsl,  {uri: dsl.uri});
                this.addStep(to, parentId)
                break;
            case 'ToDynamicDefinition' :
                const toD = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                this.addStep(toD, parentId)
                break;
            case 'KameletDefinition' :
                const kamelet = CamelDefinitionApi.createStep(dsl.dsl,{name: dsl.name});
                this.addStep(kamelet, parentId)
                break;
            default:
                const step = CamelDefinitionApi.createStep(dsl.dsl, undefined);
                this.addStep(step, parentId)
                break;
        }
    }

    addStep = (step: CamelElement, parentId: string) => {
        const i = CamelDefinitionApiExt.addStepToIntegration(this.state.integration, step, parentId);
        const clone = CamelUtil.cloneIntegration(i);
        this.setState({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: step,
            selectedUuid: step.uuid
        });
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showSelector: false, key: Math.random().toString()});
    }

    moveElement = (source: string, target: string) => {
        const i = CamelDefinitionApiExt.moveElement(this.state.integration, source, target);
        const clone = CamelUtil.cloneIntegration(i);
        const selectedStep = CamelDefinitionApiExt.findElement(clone, source);
        this.setState({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: selectedStep,
            selectedUuid: source
        });
    }

    onResizePage(el: HTMLDivElement | null){
        const rect = el?.getBoundingClientRect();
        if (el && rect && (rect?.width !== this.state.width || rect.height !== this.state.height)){
            this.setState({width: rect.width, height: rect.height});
        }
    }

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns">
                    <div key={this.state.key} className="graph" onScroll={event => console.log(event)}>
                        <DslConnections height={this.state.height} width={this.state.width} integration={this.state.integration}/>
                        <div className="flows"  data-click="FLOWS" onClick={event => this.unselectElement(event)}
                             ref={el => this.onResizePage(el)}>
                            {this.state.integration.spec.flows?.map((from:any, index: number) => (
                                <DslElement key={from.uuid + this.state.key}
                                            openSelector={this.openSelector}
                                            deleteElement={this.deleteElement}
                                            selectElement={this.selectElement}
                                            moveElement={this.moveElement}
                                            selectedUuid={this.state.selectedUuid}
                                            borderColor={this.props.borderColor}
                                            borderColorSelected={this.props.borderColorSelected}
                                            inSteps={false}
                                            position={index}
                                            step={from}
                                            parent={undefined}/>
                            ))}
                            <div className="add-flow">
                                <Button
                                    variant={this.state.integration.spec.flows?.length === 0 ? "primary" : "secondary"}
                                    data-click="ADD_ROUTE"
                                    icon={<PlusIcon/>}
                                    onClick={e => this.openSelector(undefined, undefined)}>Add new route
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DslProperties
                        integration={this.state.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                    />
                </div>
                <DslSelector
                    dark={this.props.dark}
                    parentId={this.state.parentId}
                    parentDsl={this.state.parentDsl}
                    showSteps={this.state.showSteps}
                    show={this.state.showSelector}
                    onDslSelect={this.onDslSelect}
                    onClose={this.closeDslSelector}/>
            </PageSection>
        );
    }
}
