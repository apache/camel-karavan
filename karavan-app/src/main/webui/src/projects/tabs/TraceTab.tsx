import React, {useEffect, useState} from 'react';
import {
    Card,
    CardBody, PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {PodStatus} from "../ProjectModels";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectEventBus} from "../ProjectEventBus";
import {RunnerInfoTrace} from "./RunnerInfoTrace";
import {useProjectStore} from "../ProjectStore";

export function isRunning(status: PodStatus): boolean {
    return status.phase === 'Running' && !status.terminating;
}

interface Props {
    config: any,
}

export const TraceTab = (props: Props) => {

    const {project, setProject} = useProjectStore();
    const [trace, setTrace] = useState({});
    const [refreshTrace, setRefreshTrace] = useState(true);

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

    const {config} = props;
    return (
        <PageSection className="project-bottom" padding={{default: "padding"}}>
            <RunnerInfoTrace trace={trace} refreshTrace={refreshTrace}/>
        </PageSection>
    )
}
