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
import '../karavan.css';
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {
    DataFormatDefinition, ExpressionDefinition, ToDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {RouteToCreate} from "../utils/CamelUi";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";

export function usePropertiesHook (isRouteDesigner: boolean = true) {

    const [integration, setIntegration] = useIntegrationStore((state) => [state.integration, state.setIntegration], shallow)
    const [ selectedStep, setSelectedStep, setSelectedUuids] = useDesignerStore((s) =>
        [s.selectedStep, s.setSelectedStep, s.setSelectedUuids], shallow)

    function onPropertyUpdate (element: CamelElement, newRoute?: RouteToCreate) {
        if (isRouteDesigner) {
            onRoutePropertyUpdate(element, newRoute);
        } else {
            onRestPropertyUpdate(element, newRoute);
        }
    }

    function onRoutePropertyUpdate (element: CamelElement, newRoute?: RouteToCreate) {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRouteElement(integration, element);
            const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName, parameters: {name: newRoute.name}});
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            setIntegration(clone, false);
            setSelectedStep(element);
            setSelectedUuids([element.uuid]);
        } else {
            const clone = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.updateIntegrationRouteElement(clone, element);
            setIntegration(i, true);
        }
    }

    function onRestPropertyUpdate (element: CamelElement, newRoute?: RouteToCreate) {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRestElement(integration, element);
            const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName, parameters: {name: newRoute.name}});
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            setIntegration(clone, false);
            setSelectedStep(element);
        } else {
            const clone = CamelUtil.cloneIntegration(integration);
            const i = CamelDefinitionApiExt.updateIntegrationRestElement(clone, element);
            setIntegration(i, true);
            // setSelectedStep(element);
        }
    }

    function onPropertyChange (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate){
        value = value === '' ? undefined : value;
        if (selectedStep) {
            const clone = CamelUtil.cloneStep(selectedStep);
            (clone as any)[fieldId] = value;
            setSelectedStep(clone)
            onPropertyUpdate(clone, newRoute);
        }
    }

    function onDataFormatChange (value: DataFormatDefinition)   {
        value.uuid = selectedStep?.uuid ? selectedStep?.uuid : value.uuid;
        setSelectedStep(value);
        onPropertyUpdate(value);
    }

    function onExpressionChange (propertyName: string, exp: ExpressionDefinition)   {
        if (selectedStep) {
            const clone = (CamelUtil.cloneStep(selectedStep));
            (clone as any)[propertyName] = exp;
            setSelectedStep(clone);
            onPropertyUpdate(clone);
        }
    }

    function onParametersChange (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate)   {
        value = value === '' ? undefined : value;
        if (selectedStep) {
            const clone = (CamelUtil.cloneStep(selectedStep));
            const parameters: any = {...(clone as any).parameters};
            parameters[parameter] = value;
            (clone as any).parameters = parameters;
            setSelectedStep(clone);
            onPropertyUpdate(clone, newRoute);
        }
    }

    function getInternalComponentName(propertyName: string, element?: CamelElement): string {
        if (element && element.dslName === 'ToDefinition' && propertyName === 'name') {
            const uri: string = (element as ToDefinition).uri || '';
            if (uri.startsWith("direct")) return "direct";
            if (uri.startsWith("seda")) return "seda";
            return '';
        } else {
            return '';
        }
    }

    function cloneElement ()   {
        // TODO:
    }

    const convertStep = (step: CamelElement, targetDslName: string ) => {
        // const clone = CamelUtil.cloneIntegration(integration);
        // const i = CamelDefinitionApiExt.addStepToIntegration(clone, step, parentId, position);
        // const selectedStep = step.dslName === 'RouteDefinition' ? (step as RouteDefinition).from  : step;
        // setIntegration(i, false);
        // setSelectedStep(selectedStep);
        // setSelectedUuids([selectedStep.uuid]);
    }

    return {convertStep, cloneElement, onPropertyChange, onParametersChange, onDataFormatChange, onExpressionChange, getInternalComponentName}
}