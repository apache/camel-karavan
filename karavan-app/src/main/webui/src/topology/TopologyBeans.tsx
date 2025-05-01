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
import './TopologyBeans.css';
import {
    Button,
    Card,
    CardBody,
    CardTitle,
    Label,
} from "@patternfly/react-core";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {useFilesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {getIntegrations} from "./TopologyApi";
import JavaIcon from "@patternfly/react-icons/dist/js/icons/java-icon";
import {useTopologyHook} from "./useTopologyHook";
import {camelIcon, CamelUi} from "../designer/utils/CamelUi";

export function TopologyBeans() {

    const {selectFile} = useTopologyHook();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const iFiles = files.map(f => new IntegrationFile(f.name, f.code))
    const integrations = getIntegrations(iFiles);
    const beans = TopologyUtils.findTopologyBeanNodes(integrations);

    return (
        beans.length > 0
            ? <Card isCompact isFlat isRounded className="topology-beans-card">
                <CardTitle>Beans</CardTitle>
                <CardBody className='card-body'>
                    {beans.map((bean, index) => {
                        return (
                            <Label>
                                <Button variant='link'
                                        className='bean-button'
                                        icon={CamelUi.getIconFromSource(camelIcon)}
                                        onClick={() => {
                                            selectFile(bean.fileName)
                                        }}
                                >
                                    {bean.name}
                                </Button>
                            </Label>
                        )
                    })}
                    {files.filter(f => f.name.endsWith('.java')).map((file, index) => {
                        return (
                            <Label>
                                <Button variant='link'
                                        className='bean-button'
                                        icon={<JavaIcon className='orange'/>}
                                        onClick={() => {
                                            selectFile(file.name)
                                        }}
                                >
                                    {file.name?.split('.')?.[0]}
                                </Button>
                            </Label>
                        )
                    })}
                </CardBody>
            </Card>
            : <></>
    )
}