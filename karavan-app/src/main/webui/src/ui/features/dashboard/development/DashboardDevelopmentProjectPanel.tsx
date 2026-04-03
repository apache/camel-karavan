import React, {useEffect} from 'react';
import {Alert, FormAlert} from '@patternfly/react-core';
import {useProjectsStore} from "@stores/ProjectStore";
import {Project, RESERVED_WORDS} from "@models/ProjectModels";
import {isValidProjectId, nameToProjectId} from "@util/StringUtils";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {shallow} from "zustand/shallow";
import {useDashboardStore} from "@stores/DashboardStore";
import {ProjectService} from "@services/ProjectService";
import {SideBarFormWrapper} from "@shared/ui/SideBarFormWrapper";
import {useProjectInfoStore} from "../../../stores/ProjectInfoStore";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@app/navigation/Routes";
import {ProjectFunctionHook} from "@app/navigation/ProjectFunctionHook";
import {KaravanApi} from "@api/KaravanApi";
import {useFormUtil} from "@util/useFormUtil";

export function DashboardDevelopmentProjectPanel() {

    const [projects] = useProjectsStore((s) => [s.projects], shallow);
    const {fetchProjectInfos} = useProjectInfoStore();
    const { showSideBar, setShowSideBar,} = useDashboardStore();

    const [isProjectIdChanged, setIsProjectIdChanged] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const {createOpenApiForProject} = ProjectFunctionHook();
    const navigate = useNavigate();

    // 1. Setup Form
    const formContext = useForm<Project>({ mode: "all" });
    const { getTextField, getCheckbox } = useFormUtil(formContext);
    const { reset, trigger, setValue, setFocus, watch } = formContext;

    // 2. Prepare Data
    useEffect(() => {
        if (['integration', 'rest'].includes(showSideBar)) {
            const p = new Project();
            reset(p);
            setBackendError(undefined);
            setIsProjectIdChanged(false);
            setTimeout(() => setFocus('name'), 300);
        }
    }, [showSideBar, reset, setFocus]);

    // 3. Save Handler
    const onSave = (data: Project) => {
        KaravanApi.postProject(data, (result, res) => after(result, res, data));
    }

    function after(result: boolean, res: AxiosResponse<Project> | any, data: Project) {
        if (result) {
            EventBus.sendAlert("Success", "Project successfully created!", "success");
            if (showSideBar === 'rest') {
                createOpenApiForProject(data.projectId);
            }
            ProjectService.refreshProjects();
            fetchProjectInfos();
            setShowSideBar(null)
            navigate(`${ROUTES.PROJECTS}/${data.projectId}`)
        } else {
            setBackendError(res?.response?.data);
        }

    }

    // 4. Field Change Handlers
    function onNameChange(value: string) {
        if (!isProjectIdChanged) {
            setValue('projectId', nameToProjectId(value), { shouldValidate: true });
        }
    }

    function onIdChange(value: string) {
        setIsProjectIdChanged(true);
    }

    return (
        <SideBarFormWrapper
            formContext={formContext}
            selectedId={null} // "Create" mode
            onSave={onSave}
            onCancel={() => setShowSideBar(null)}
        >

            {getTextField('name', 'Name', {
                length: (v: any) => v.length > 5 || 'Project name should be longer than 5 characters',
            }, 'text', onNameChange)}

            {getTextField('projectId', 'Project ID', {
                regex: (v: any) => isValidProjectId(v) || 'Only lowercase characters, numbers and dashes allowed',
                length: (v: any)=> v.length > 5 || 'Project ID should be longer than 5 characters',
                name: (v: any) => !RESERVED_WORDS.includes(v) || "Reserved word",
                uniques: (v: any) => !projects.map(p => p.projectId).includes(v) || "Project already exists!",
            }, 'text', onIdChange)}
            {backendError && (
                <FormAlert>
                    <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                </FormAlert>
            )}
        </SideBarFormWrapper>
    );
}