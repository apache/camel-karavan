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
