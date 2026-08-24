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
import {useMemo} from 'react';
import './TopologyBeans.css';
import {Button, Card, CardBody, CardTitle, Radio,} from "@patternfly/react-core";
import {TopologyUtils} from "@core/api/TopologyUtils";
import {useFilesStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {IntegrationFile} from "@core/model/IntegrationDefinition";
import {getIntegrations} from "./TopologyApi";
import {JavaIcon} from "@patternfly/react-icons";
import {useTopologyHook} from "./useTopologyHook";
import {useSearchStore} from "@stores/SearchStore";
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {camelIcon, CamelUi} from "@designer/utils/CamelUi";
import {TopologyBeanNode} from "@core/model/TopologyDefinition";

export function TopologyBeans() {

    const {selectFile} = useTopologyHook();
    const selectedBean = useArchitectureStore((s) => s.selectedBean)
    const setSelectedBean = useArchitectureStore((s) => s.setSelectedBean)
    const setSelectedVariable = useArchitectureStore((s) => s.setSelectedVariable)

    const {project} = useProjectStore();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const search = useSearchStore((s) => s.search);
    const searchResults = useSearchStore((s) => s.searchResults)
    const filedFound = searchResults?.filter(s => s.projectId === project.projectId)?.at(0)?.files || [];
    const javaFiles = files?.filter(f => f.name.endsWith('.java'));
    const beanFiles = files
        ?.filter(f => search === '' || filedFound.includes(f.name))
        .map(f => new IntegrationFile(f.name, f.code));
    const iFiles = beanFiles?.filter(f => f?.name).map(f => new IntegrationFile(f.name, f.code))
    const integrations = getIntegrations(iFiles);
    const beans = TopologyUtils.findTopologyBeanNodes(integrations);

    const beanUsed = useMemo(() => {
        const beans: TopologyBeanNode[] = [];
        const camelBeans = TopologyUtils.findTopologyBeanNodes(integrations);
        const javaClasses = TopologyUtils.findTopologyJavaClassNodes(files.map(f => f.name));
        beans.push(...camelBeans);
        beans.push(...javaClasses);
        return TopologyUtils.findTopologyBeanUseRouteIds(integrations, beans);
    }, [project?.projectId, files]);

    const showBeans = beans.length > 0 || javaFiles.length > 0;

    const card = (
        <Card isCompact className="topology-beans-card">
            <CardTitle>Beans</CardTitle>
            <CardBody className='card-body'>
                {beans.map((bean, index) => {
                    return (
                        <div key={index} className="topology-bean-item">
                            <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 6}}>
                                {CamelUi.getIconFromSource(camelIcon)}
                                <Button variant='link'
                                        className='bean-button'
                                        onClick={() => {
                                            selectFile(bean.fileName)
                                        }}
                                >
                                    {bean.name}
                                </Button>
                            </div>
                            <Radio id={bean.name}
                                   aria-label={bean.name}
                                   name={bean.name}
                                   isChecked={selectedBean?.name === bean.name}
                                   onClick={_ => {
                                       setSelectedVariable(null);
                                       if (selectedBean?.name !== bean.name) {
                                           setSelectedBean(beanUsed.find(b => b.name === bean.name));
                                       } else {
                                           setSelectedBean(null);
                                       }
                                   }}
                            />
                        </div>
                    )
                })}
                {javaFiles.map((file, index) => {
                    const beanName = file.name?.split('.')?.[0]
                    return (
                        <div key={index} className="topology-bean-item">
                            <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 6}}>
                                <JavaIcon className='orange'/>
                                <Button variant='link'
                                        className='bean-button'
                                        onClick={() => {
                                            selectFile(file.name)
                                        }}
                                >
                                    {beanName}
                                </Button>
                            </div>
                            <Radio id={'java-' + beanName}
                                   aria-label={'java-' + beanName}
                                   name={'java-' + beanName}
                                   isChecked={selectedBean?.name === beanName}
                                   onClick={_ => {
                                       setSelectedVariable(null)
                                       if (selectedBean?.name !== beanName) {
                                           setSelectedBean(beanUsed.find(b => b.name === beanName));
                                       } else {
                                           setSelectedBean(null);
                                       }
                                   }}
                            />
                        </div>
                    )
                })}
            </CardBody>
        </Card>
    )

    return showBeans && card;
}