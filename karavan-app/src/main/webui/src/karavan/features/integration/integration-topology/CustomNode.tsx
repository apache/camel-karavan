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

import * as React from 'react';
import {RegionsIcon} from '@patternfly/react-icons';
import {DefaultNode, observer, WithContextMenuProps} from '@patternfly/react-topology';
import {BeanIcon, getDesignerIcon, OpenApiIcon} from "@features/integration/designer/icons/KaravanIcons";
import {CamelUi} from "@features/integration/designer/utils/CamelUi";
import './topology.css';
import {RouteDefinition} from "@karavan-core/model/CamelDefinition";
import {AutoStartupFalseIcon, ErrorHandlerIcon} from "@features/integration/designer/icons/OtherIcons";
import {useTopologyHook} from "./useTopologyHook";
import {runInAction} from "mobx";
import {SvgIcon} from "@shared/icons/SvgIcon";

export const COLOR_ORANGE = '#ef9234';
export const COLOR_BLUE = '#2b9af3';
export const COLOR_GREEN = '#6ec664';

function getIcon(data: any) {
    if (['route', 'rest', 'routeConfiguration'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14)`}>
                {getDesignerIcon(data.icon)}
            </g>
        )
    } else if (data.icon === 'bean') {
        return (
            <g transform={`translate(8, 8) scale(0.75)`}>
                <BeanIcon/>
            </g>
        )
    } else if (data.icon === 'element') {
        return (
            <g transform={`translate(8, 8) scale(0.75)`}>
                {CamelUi.getConnectionIcon(data.step)}
            </g>
        )
    } else if (data.icon === 'openapi') {
        return (
            <g transform={`translate(14, 14)`}>
                {OpenApiIcon('', 32, 32)}
            </g>
        )
    } else if (data.icon === 'asyncapi') {
        return (
            <g transform={`translate(14, 14)`}>
                {SvgIcon({icon: 'asyncapi', width: 32, height: 32})}
            </g>
        )
    }
    return <RegionsIcon/>;
}

function isDisable(data: any) {
    if ((data && data?.step?.dslName === 'RouteDefinition')) {
        const route: RouteDefinition = data?.step;
        const autoStartup =  route?.autoStartup === false;
        return autoStartup;
    } else if (data?.type === 'step' && data?.outgoing && data?.disabled) {
        return true;
    }
    return false;
}

function getAttachments(data: any) {
    if (data && data?.step?.dslName === 'RouteDefinition') {
        const route: RouteDefinition = data?.step;
        const routeId = route?.id;
        const errorHandler =  route?.errorHandler !== undefined;
        return (
            <g>
                <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                    {errorHandler && <g className="" transform="translate(13, -4)">{ErrorHandlerIcon()}</g>}
                    {isDisable(data) && <g className="" transform="translate(-4, -4)">{AutoStartupFalseIcon()}</g>}
                </g>
            </g>
        )
    } else if (isDisable(data)) {
        return (
            <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                <g className="" transform="translate(-4, -4)">{AutoStartupFalseIcon()}</g>
            </g>
        )
    } else {
        return (<></>)
    }
}

const CustomNode: React.FC<any & WithContextMenuProps>  = observer(({element, onContextMenu, contextMenuOpen, ...rest}) => {
    const {selectFile, project} = useTopologyHook(undefined);

    const data = element.getData();
    const badge: string = ['API', 'RT'].includes(data.badge) ? data.badge : data.badge?.substring(0, 1).toUpperCase();
    let colorClass = 'route';
    if (badge === 'C') {
        colorClass = 'component'
    } else if (badge === 'K') {
        colorClass = 'kamelet';
    }
    const label: string = badge === 'K' ? element.getLabel().replace('kamelet:', '') : element.getLabel();
    if (label?.length > 30) {
        runInAction(() => {
            element.setLabel(label?.substring(0, 30) + '...');
        });
    }
    const disableClass = isDisable(data) ? 'disable-node' : '';

    return (
        <g onDoubleClick={event => {
            event.stopPropagation();
            selectFile(data.fileName)
        }}>
        <DefaultNode
            showStatusDecorator
            className={"common-node common-node-" + badge + " topology-color-" + colorClass + " " + disableClass}
            scaleLabel={true}
            element={element}
            onContextMenu={onContextMenu}
            contextMenuOpen={contextMenuOpen}
            attachments={getAttachments(data)}
            hideContextMenuKebab={false}
            {...rest}
            on
        >
            {getIcon(data)}
        </DefaultNode>
        </g>
    )
})
export default CustomNode;