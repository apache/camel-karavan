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
import '../../karavan.css';
import './RouteTemplateElement.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {ChildElement, CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {useRouteDesignerHook} from "../useRouteDesignerHook";
import {DslElementHeader} from "./DslElementHeader";
import {DslElement} from "./DslElement";
import {RouteDefinition, RouteTemplateDefinition} from "karavan-core/lib/model/CamelDefinition";

interface Props {
    step: CamelElement,
    parent: CamelElement | undefined,
    nextStep: CamelElement | undefined,
    prevStep: CamelElement | undefined,
    inSteps: boolean
    position: number
    inStepsLength: number
}

export function RouteTemplateElement(props: Props) {

    const headerRef = React.useRef<HTMLDivElement>(null);
    const {
        selectElement,
        moveElement,
        onShowDeleteConfirmation,
        openSelector,
        isKamelet,
        isSourceKamelet,
        isActionKamelet
    } = useRouteDesignerHook();

    const [selectedUuids, selectedStep, showMoveConfirmation, setShowMoveConfirmation, setMoveElements] =
        useDesignerStore((s) =>
            [s.selectedUuids, s.selectedStep, s.showMoveConfirmation, s.setShowMoveConfirmation, s.setMoveElements], shallow)


    function onSelectElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        selectElement(props.step);
    }

    function isElementSelected(): boolean {
        return selectedUuids.includes(props.step.uuid);
    }

    function isInStepWithChildren() {
        const step: CamelElement = props.step;
        const children = CamelDefinitionApiExt.getElementChildrenDefinition(step.dslName);
        return children.filter((c: ChildElement) => c.name === 'steps' || c.multiple).length > 0 && props.inSteps;
    }

    const element: RouteTemplateDefinition = (props.step as RouteTemplateDefinition);
    const route: RouteDefinition | undefined = element.route;
    const className = "route-template-element";
    return (
        <div key={"root" + element.uuid}
             className={className}
             style={{
                 borderStyle: "dashed",
                 borderColor: isElementSelected() ? "var(--step-border-color-selected)" : "var(--step-border-color)",
                 marginTop: isInStepWithChildren() ? "16px" : "8px",
                 zIndex: 10,
             }}
             onMouseOver={event => event.stopPropagation()}
             onClick={event => onSelectElement(event)}
             draggable={false}
        >
            <DslElementHeader headerRef={headerRef}
                              step={element}
                              parent={props.parent}
                              nextStep={props.nextStep}
                              prevStep={props.prevStep}
                              inSteps={props.inSteps}
                              isDragging={false}
                              position={props.position}/>
            {route && <DslElement key={route.uuid}
                         inSteps={false}
                         position={0}
                         step={route}
                         nextStep={undefined}
                         prevStep={undefined}
                         inStepsLength={0}
                         parent={element}/>}
        </div>
    )
}
