import React from 'react';
import {ProjectTitle} from "@features/project/ProjectTitle";
import {DesignerToggle} from "@features/project/DesignerToggle";

interface DeveloperToolbarProps {
    showDesignerToggle?: boolean
    showRunButton?: "sql" | "groovy"
}

function DeveloperToolbar({showDesignerToggle, showRunButton}: DeveloperToolbarProps) {

    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            {showDesignerToggle && <DesignerToggle/>}
        </div>
    )
}

export default DeveloperToolbar
