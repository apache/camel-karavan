import React, {useEffect} from 'react';
import {shallow} from "zustand/shallow";
import {useFileStore, useProjectStore} from "@stores/ProjectStore";
import {ProjectTitle} from "@features/integration/ProjectTitle";
import {DesignerToggle} from "@features/integration/DesignerToggle";

export function DeveloperToolbar() {

    const [project] = useProjectStore((s) => [s.project], shallow)
    const [file] = useFileStore((s) => [s.file], shallow)

    useEffect(() => {
    }, [project, file]);


    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            <DesignerToggle/>
        </div>
    )
}
