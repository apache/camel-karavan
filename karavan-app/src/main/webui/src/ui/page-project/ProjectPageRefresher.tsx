import * as React from 'react';
import {useProjectStore, useSelectedContainerStore} from "@stores/ProjectStore";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {ProjectFunctionHook} from "./ProjectFunctionHook";
import {shallow} from "zustand/shallow";

export function ProjectPageRefresher() {

    const [project, tabIndex, refreshTrace] = useProjectStore((s) => [s.project, s.tabIndex, s.refreshTrace], shallow);
    const selectedContainerName = useSelectedContainerStore((s) => s.selectedContainerName);
    const {refreshData} = ProjectFunctionHook();

    useDataPolling('ProjectPage', refreshData, 3000, [tabIndex, refreshTrace, project, selectedContainerName]);

    return (
        <>{}</>
    );
}