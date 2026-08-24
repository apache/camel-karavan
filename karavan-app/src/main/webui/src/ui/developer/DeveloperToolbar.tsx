import React from 'react';
import {useFileStore} from "@stores/ProjectStore";
import {ProjectTitle} from "@page-project/ProjectTitle";
import {DeveloperToggle} from "@developer/toggle/DeveloperToggle";
import {Button} from "@patternfly/react-core";
import {UndoIcon} from "@patternfly/react-icons";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";
import "./DeveloperToolbar.css"

function DeveloperToolbar() {

    const file = useFileStore((s) => s.file)
    const fileCommited = useFileStore((s) => s.fileCommited)
    const undoFile = useFileStore((s) => s.undoFile)
    const developerView = useDeveloperToggleStore((s) => s.developerView)

    const showUndoButton = developerView === 'diff' && (fileCommited?.code !== file?.code)

    function getUndoButton() {
        return <Button key="undo" variant="tertiary" isDanger icon={<UndoIcon/>} onClick={_ => undoFile()}>Undo</Button>;
    }

    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            {showUndoButton && getUndoButton()}
            <DeveloperToggle/>
        </div>
    )
}

export default DeveloperToolbar
