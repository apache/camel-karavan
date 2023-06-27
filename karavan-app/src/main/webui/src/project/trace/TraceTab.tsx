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
import React, {useEffect, useState} from 'react';
import { PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {PodStatus} from "../../api/ProjectModels";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectEventBus} from "../../api/ProjectEventBus";
import {RunnerInfoTrace} from "./RunnerInfoTrace";
import {useAppConfigStore, useProjectStore} from "../../api/ProjectStore";

export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}

export const TraceTab = () => {

    const {project, setProject} = useProjectStore();
    const [trace, setTrace] = useState({});
    const [refreshTrace, setRefreshTrace] = useState(true);
    const {config} = useAppConfigStore();

    useEffect(() => {
        const sub2 = ProjectEventBus.onRefreshTrace()?.subscribe((result: boolean) => {
            setRefreshTrace(result);
        });
        const interval = setInterval(() => {
            onRefreshStatus();
        }, 1000);
        return () => {
            sub2.unsubscribe();
            clearInterval(interval)
        };

    }, []);

    function onRefreshStatus() {
        const projectId = project.projectId;
        const name = projectId + "-runner";
        if (refreshTrace) {
            KaravanApi.getRunnerConsoleStatus(projectId, "trace", res => {
                if (res.status === 200) {
                    setTrace(res.data);
                } else {
                    setTrace({});
                }
            })
        }
    }

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <RunnerInfoTrace trace={trace} refreshTrace={refreshTrace}/>
        </PageSection>
    )
}
