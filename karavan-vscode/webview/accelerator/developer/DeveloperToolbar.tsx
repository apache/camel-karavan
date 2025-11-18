import React, {useEffect} from 'react';
import {useFileStore, useProjectStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectTitle} from "@/integration/ProjectTitle";
import {DesignerToggle} from "@/integration/DesignerToggle";

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
