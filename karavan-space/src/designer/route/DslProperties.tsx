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
import React, {useState} from 'react';
import {
    Form,
    Text,
    Title,
    TextVariants, ExpandableSection, Button, Tooltip,
} from '@patternfly/react-core';
import '../karavan.css';
import './DslProperties.css';
import "@patternfly/patternfly/patternfly.css";
import {DataFormatField} from "./property/DataFormatField";
import {DslPropertyField} from "./property/DslPropertyField";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUi} from "../utils/CamelUi";
import {CamelMetadataApi, DataFormats, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {IntegrationHeader} from "../utils/IntegrationHeader";
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon";
import ConvertIcon from "@patternfly/react-icons/dist/esm/icons/optimize-icon";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {usePropertiesHook} from "./usePropertiesHook";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";

interface Props {
    isRouteDesigner: boolean
}

export function DslProperties(props: Props) {

    const [integration] = useIntegrationStore((state) => [state.integration], shallow)

    const {convertStep, cloneElement, onDataFormatChange, onPropertyChange, onParametersChange, onExpressionChange} =
        usePropertiesHook(props.isRouteDesigner);

    const [selectedStep, dark] = useDesignerStore((s) => [s.selectedStep, s.dark], shallow)

    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

    function getRouteHeader(): JSX.Element {
        const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep)
        const description = selectedStep && CamelUi.getDescription(selectedStep);
        const descriptionLines: string [] = description ? description?.split("\n") : [""];
        const targetDsl = CamelUi.getConvertTargetDsl(selectedStep?.dslName);
        const targetDslTitle = targetDsl?.replace("Definition", "");
        return (
            <div className="headers">
                <div className="top">
                    <Title headingLevel="h1" size="md">{title}</Title>
                    {targetDsl &&
                        <Button
                            variant={"link"}
                            icon={<ConvertIcon/>}
                            iconPosition={"right"}
                            onClick={event => {
                                if (selectedStep) {
                                    convertStep(selectedStep, targetDsl);
                                }
                            }}
                        >
                            Convert to {targetDslTitle}
                        </Button>
                    }
                </div>
                <Text component={TextVariants.p}>{descriptionLines.at(0)}</Text>
                {descriptionLines.length > 1 &&
                    <ExpandableSection toggleText={isDescriptionExpanded ? 'Show less' : 'Show more'}
                                       onToggle={(_event, isExpanded) => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                       isExpanded={isDescriptionExpanded}>
                        {descriptionLines.filter((value, index) => index > 0)
                            .map((desc, index, array) => <Text key={index} component={TextVariants.p}>{desc}</Text>)}
                    </ExpandableSection>}
            </div>
        )
    }

    function getClonableElementHeader(): JSX.Element {
        const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep);
        const description = selectedStep?.dslName ? CamelMetadataApi.getCamelModelMetadataByClassName(selectedStep?.dslName)?.description : title;
        const descriptionLines: string [] = description ? description?.split("\n") : [""];
        return (
            <div className="headers">
                <div className="top">
                    <Title headingLevel="h1" size="md">{title}</Title>
                    <Tooltip content="Clone element" position="bottom">
                        <Button variant="link" onClick={() => cloneElement()} icon={<CloneIcon/>}/>
                    </Tooltip>
                </div>
                {descriptionLines.map((desc, index, array) => <Text key={index}
                                                                    component={TextVariants.p}>{desc}</Text>)}
            </div>
        )
    }

    function getComponentHeader(): JSX.Element {
        if (props.isRouteDesigner) return getRouteHeader()
        else return getClonableElementHeader();
    }

    function getProperties(): PropertyMeta[] {
        const dslName = selectedStep?.dslName;
        return CamelDefinitionApiExt.getElementProperties(dslName)
            // .filter((p: PropertyMeta) => (showAdvanced && p.label.includes('advanced')) || (!showAdvanced && !p.label.includes('advanced')))
            .filter((p: PropertyMeta) => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (dslName === 'CatchDefinition' && p.name === 'onWhen'))
            .filter((p: PropertyMeta) => !(dslName === 'RestDefinition' && ['get', 'post', 'put', 'patch', 'delete', 'head'].includes(p.name)));
        // .filter((p: PropertyMeta) => dslName && !(['RestDefinition', 'GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(dslName) && ['param', 'responseMessage'].includes(p.name))) // TODO: configure this properties
    }

    function getPropertyFields(properties: PropertyMeta[]) {
        return (<>
            {properties.map((property: PropertyMeta) =>
                <DslPropertyField key={property.name}
                                  property={property}
                                  element={selectedStep}
                                  value={selectedStep ? (selectedStep as any)[property.name] : undefined}
                                  onExpressionChange={onExpressionChange}
                                  onParameterChange={onParametersChange}
                                  onDataFormatChange={onDataFormatChange}
                                  onPropertyChange={onPropertyChange}
                />
            )}
        </>)
    }

    const dataFormats = DataFormats.map(value => value[0]);
    const dataFormatElement = selectedStep !== undefined && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName);
    const properties = !dataFormatElement
        ? getProperties()
        : getProperties().filter(p => !dataFormats.includes(p.name));
    const propertiesMain = properties.filter(p => !p.label.includes("advanced"));
    const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
    return (
        <div key={selectedStep ? selectedStep.uuid : 'integration'}
             className='properties'>
            <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                {selectedStep === undefined && <IntegrationHeader/>}
                {selectedStep && getComponentHeader()}
                {getPropertyFields(propertiesMain)}
                {selectedStep && !['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName)
                    && propertiesAdvanced.length > 0 &&
                    <ExpandableSection
                        toggleText={'Advanced properties'}
                        onToggle={(_event, isExpanded) => setShowAdvanced(!showAdvanced)}
                        isExpanded={showAdvanced}>
                        <div className="parameters">
                            {getPropertyFields(propertiesAdvanced)}
                        </div>
                    </ExpandableSection>}
                {selectedStep && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName) &&
                    <DataFormatField
                        integration={integration}
                        dslName={selectedStep.dslName}
                        value={selectedStep}
                        onDataFormatChange={onDataFormatChange}
                        dark={dark}/>
                }
            </Form>
        </div>
    )
}
