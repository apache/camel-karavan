/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http:www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import {ComplexityProject} from "@models/ComplexityModels";
import {CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon} from "@patternfly/react-icons";
import {Label, Tooltip} from "@patternfly/react-core";

interface Props {
    complexity: ComplexityProject
    full?: boolean
}

export function ProjectLabelSize(props: Props) {

    const {complexity, full} = props;
    const totalChars = Math.round((complexity?.files?.reduce((sum, f) => sum + f.chars, 0) ?? 0)/1000);

    let status: "success" | "danger" | "warning" | "info" | "custom" = "success"
    let color = "var(--pf-t--global--icon--color--status--success--default)"
    let icon = <CheckCircleIcon color={color}/>
    if (totalChars > 200) {
        status = "danger";
        color = "var(--pf-t--global--icon--color--status--danger--default)"
        icon = <ExclamationCircleIcon color={color}/>
    } else if (totalChars > 100) {
        status = "warning";
        color = "var(--pf-t--global--icon--color--status--warning--default)"
        icon = <ExclamationTriangleIcon color={color}/>
    }
    const compact = status === "success"
        ? icon
        : <Tooltip content={`${totalChars}K characters`}>
            {icon}
        </Tooltip>

    return full === true
        ? <Tooltip content={`Project code: ${totalChars}K characters`} position="left">
            <Label status={status} isCompact variant={'outline'}>{totalChars}K</Label>
        </Tooltip>
        : compact
}
