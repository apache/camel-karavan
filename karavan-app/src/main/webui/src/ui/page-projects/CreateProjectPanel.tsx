import React, {lazy, Suspense, useEffect} from 'react';
import {Alert, Button, Divider, DrawerPanelBody, FormAlert} from '@patternfly/react-core';
import {useProjectsStore} from "@stores/ProjectStore";
import {Project, RESERVED_WORDS} from "@models/ProjectModels";
import {isValidProjectId, nameToProjectId} from "@utils/StringUtils";
import {EventBus} from "@designer/utils/EventBus";
import {useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {useDashboardStore} from "@stores/DashboardStore";
import {ProjectService} from "@services/ProjectService";
import {SideBarFormWrapper} from "@shared/ui/SideBarFormWrapper";
import {useProjectInfoStore} from "@stores/useProjectInfoStore";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@compass/navigation/Routes";
import {ProjectFunctionHook} from "@page-project/ProjectFunctionHook";
import {KaravanApi} from "@api/KaravanApi";
import {useCommandPaletteStore} from "@command-palette/useCommandPaletteStore";
import {CommandPaletteFooter} from "@command-palette/CommandPaletteFooter";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {useFormUtil} from "./useFormUtil";

const CommandPalettePanel = lazy(() => import("@command-palette/CommandPalettePanel").then(m => ({default: m.CommandPalettePanel})));

export function DashboardDevelopmentProjectPanel() {

    const projects = useProjectsStore((s) => s.projects);
    const fetchProjectInfos = useProjectInfoStore((s) => s.fetchProjectInfos);
    const showSideBar = useDashboardStore(state => state.showSideBar);
    const setShowSideBar = useDashboardStore(state => state.setShowSideBar);
    const filter = useCommandPaletteStore(state => state.filter);

    const [isProjectIdChanged, setIsProjectIdChanged] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const {createOpenApiForProject, createRoutesForEmptyProject, createDlqForEmptyProject} = ProjectFunctionHook();
    const navigate = useNavigate();

    // 1. Setup Form
    const formContext = useForm<Project>({mode: "all"});
    const {getTextField, getCheckbox} = useFormUtil(formContext);
    const {reset, setValue, setFocus, handleSubmit} = formContext;

    // 2. Prepare Data
    useEffect(() => {
        if (['integration'].includes(showSideBar)) {
            const p = new Project();
            reset(p);
            setBackendError(undefined);
            setIsProjectIdChanged(false);
            setTimeout(() => setFocus('name'), 300);
            ProjectService.loadBlockedComponentAndKamelets();
        }
    }, [showSideBar, reset, setFocus]);

    // 3. Save Handler
    async function onSave(data: Project): Promise<string> {
        await KaravanApi.postProject(data, (result, res) => after(result, res, data));
        createDlqForEmptyProject(data.projectId);
        return data.projectId;
    }


    function after(result: boolean, res: AxiosResponse<Project> | any, data: Project) {
        if (result) {
            EventBus.sendAlert("Success", "Project successfully created!", "success");
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
            setValue('projectId', nameToProjectId(value), {shouldValidate: true});
        }
    }

    function onIdChange(value: string) {
        setIsProjectIdChanged(true);
    }

    const footer =
        <div style={{display: 'flex', justifyContent: 'space-between', gap: 6}}>
            <Button variant={"tertiary"}
                    onClick={() => {
                        handleSubmit(async (data: Project) => {
                            await onSave(data);
                        })();
                    }}
            >Create Empty</Button>
            <CommandPaletteFooter
                onBeforeSave={(dsl: DslMetaModel) => {
                    handleSubmit(async (data: Project) => {
                        const projectId = await onSave(data);
                        createRoutesForEmptyProject(dsl, projectId);
                    })();
                }}
                onClose={() => setShowSideBar(null)}
            />
        </div>


    return (
        <>
            {/* --- TOP: Fixed panel --- */}
            <DrawerPanelBody style={{flexShrink: 0, flexGrow: 0, padding: '16px 16px 16px 16px'}}>
                <SideBarFormWrapper
                    className={"command-palette"}
                    formContext={formContext}
                    footer={<></>}
                >

                    {getTextField('name', 'Name', {
                        length: v => v.length > 5 || 'Project name should be longer than 5 characters',
                    }, 'text', onNameChange)}

                    {getTextField('projectId', 'Project ID', {
                        regex: v => isValidProjectId(v) || 'Only lowercase characters, numbers and dashes allowed',
                        length: v => v.length > 5 || 'Project ID should be longer than 5 characters',
                        name: v => !RESERVED_WORDS.includes(v) || "Reserved word",
                        uniques: v => !projects.map(p => p.projectId).includes(v) || "Project already exists!",
                    }, 'text', onIdChange)}
                    {backendError && (
                        <FormAlert>
                            <Alert variant="danger" title={backendError} aria-live="polite" isInline/>
                        </FormAlert>
                    )}
                </SideBarFormWrapper>
            </DrawerPanelBody>

            {/*<Divider style={{marginTop: 0}}/>*/}
            {/* --- MIDDLE: Scrollable panel --- */}
            <DrawerPanelBody style={{flexGrow: 1, overflowY: 'auto'}}>
                {showSideBar === 'integration' && <Suspense fallback={null}><CommandPalettePanel/></Suspense>}
            </DrawerPanelBody>

            <Divider style={{marginTop: 0}}/>
            {/* --- BOTTOM: Fixed Panel --- */}
            {/* flexShrink: 0 prevents it from squishing. flexGrow: 0 prevents it from expanding. */}
            <DrawerPanelBody style={{flexShrink: 0, flexGrow: 0, padding: '16px 16px 16px 16px'}}>
                {showSideBar === 'integration' && footer}
            </DrawerPanelBody>
        </>
    );
}