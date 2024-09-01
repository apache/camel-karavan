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

import {DefaultNode, observer} from '@patternfly/react-topology';
import {getDesignerIcon} from "../designer/icons/KaravanIcons";
import {CamelUi} from "../designer/utils/CamelUi";
import './topology.css';
import {RouteDefinition} from "core/model/CamelDefinition";
import {AutoStartupIcon, ErrorHandlerIcon} from "../designer/icons/OtherIcons";

function getIcon(data: any) {
    if (['route', 'rest', 'routeConfiguration'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14)`}>
                {getDesignerIcon(data.icon)}
            </g>
        )
    } else if (data.icon === 'element') {
        return (
            <g transform={`translate(14, 14)`}>
                {CamelUi.getConnectionIcon(data.step)}
            </g>
        )
    }
    return <RegionsIcon/>;
}

function getAttachments(data: any) {
    if (data && data?.step?.dslName === 'RouteDefinition') {
        const route: RouteDefinition = data?.step;
        const autoStartup =  route?.autoStartup !== false;
        const errorHandler =  route?.errorHandler !== undefined;
        return (
            <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                {errorHandler &&
                    <g className="" transform="translate(13, -4)">
                        {ErrorHandlerIcon()}
                    </g>
                }
                {autoStartup &&
                    <g className="" transform="translate(-4, -4)">
                        {AutoStartupIcon()}
                    </g>
                }
            </g>
        )
    } else <></>
}

const CustomNode: React.FC<any> = observer(({element, ...rest}) => {

    const data = element.getData();
    const badge: string = data.badge === 'REST' ? data.badge : data.badge?.substring(0, 1).toUpperCase();
    if (element.getLabel()?.length > 30) {
        element.setLabel(element.getLabel()?.substring(0, 30) + '...');
    }

    return (
        <DefaultNode
            badge={badge}
            showStatusDecorator
            className="common-node"
            scaleLabel={false}
            element={element}
            attachments={getAttachments(data)}
            {...rest}
        >
            {getIcon(data)}
        </DefaultNode>
    )
})
export default CustomNode;