import React from 'react';
import {useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectTitle} from "@features/project/ProjectTitle";
import {DesignerToggle} from "@features/project/DesignerToggle";
import {Button, Content, Popover} from "@patternfly/react-core";
import {DashboardDevelopmentHook} from "@features/dashboard/development/DashboardDevelopmentHook";
import {CheckIcon} from "@patternfly/react-icons";
import {useValidationStore} from "@stores/ValidationStore";
import {KARAVAN_DOT_EXTENSION} from "@core/contants";
import {DOCKER_COMPOSE} from "@models/ProjectModels";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

interface DeveloperToolbarProps {
    showDesignerToggle?: boolean
    showRunButton?: "sql" | "groovy"
}

function DeveloperToolbar({showDesignerToggle, showRunButton}: DeveloperToolbarProps) {

    const [project] = useProjectStore((s) => [s.project], shallow)
    const [file] = useFileStore((s) => [s.file], shallow)
    const {getValidationInfoForFile} = DashboardDevelopmentHook();
    const validation = file ? getValidationInfoForFile(project.projectId, file?.name) : undefined;
    const {validateProjectFile, validations} = useValidationStore();
    const showValidateButton = file?.name?.endsWith(KARAVAN_DOT_EXTENSION.CAMEL_YAML)
        || file?.name?.endsWith(KARAVAN_DOT_EXTENSION.KAMELET_YAML)
        || file?.name?.endsWith(DOCKER_COMPOSE)

    const errors = validation?.errors;
    const hasErrors = errors?.length > 0;

    const popoverBody = (
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", gap: "8px"}}>
            {errors?.map((error, index) => {
                const line = error?.details?.line;
                const type = error?.property ? error?.property : error?.type;
                const title = `Error at line ${line}: ${type}`
                return (
                    <div key={index} style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "3px"}}>
                        <Content isVisitedLink style={{fontWeight: 'bold', margin: 0}} component="p">{title}</Content>
                        <Content style={{margin: 0}} component="p">{error?.message}</Content>
                    </div>
                )
            })}
        </div>
    )

    const popover = (
        <Popover
            aria-label="Alert popover"
            alertSeverityVariant={'danger'}
            headerComponent="h1"
            bodyContent={popoverBody}
            appendTo={() => document.body}
        >
            <Button icon={<ExclamationCircleIcon/>}
                    isDanger={hasErrors}
                    variant={'secondary'}
                    onClick={_ => {
                        validateProjectFile(file.projectId, file.name);
                    }}
            >
                Show Errors
            </Button>
        </Popover>
    )

    function getValidationButton() {
        return (
            <div style={{paddingRight: 16, display: "flex", flexDirection: "row", gap: "16px", alignItems: "center"}}>
                <Button icon={<CheckIcon/>}
                        isDanger={hasErrors}
                        variant={'secondary'}
                        onClick={_ => {
                            validateProjectFile(file.projectId, file.name);
                        }}
                >
                    Validate
                </Button>
                {hasErrors && popover}
            </div>
        )
    }

    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            {showValidateButton && getValidationButton()}
            {showDesignerToggle && <DesignerToggle/>}
        </div>
    )
}

export default DeveloperToolbar
