import * as React from 'react';
import {MouseEventHandler, ReactElement, useState} from 'react';
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement} from '@patternfly/react-core';
import {useAppConfigStore} from '@stores/ProjectStore';
import {useTopologyHook} from '../project-topology/useTopologyHook';
import {useRouteDesignerHook} from "@designer/route/useRouteDesignerHook";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE} from "@models/ProjectModels";
import {ProjectTitle} from "../ProjectTitle";
import {CogIcon, DockerIcon, EllipsisVIcon, SyncAltIcon} from "@patternfly/react-icons";
import {AddLarge, LogoKubernetes} from "@carbon/icons-react";
import {ProjectFunctionHook} from "../ProjectFunctionHook";
import {useComplexityStore} from "@stores/ComplexityStore";
import {useProjectPageStore} from "../ProjectPageStore";
import {useAppConfig} from "@compass/useConfig";
import {ProjectService} from "@services/ProjectService";
import {FileSearchToolbarItem} from "../FileSearchToolbarItem";
import {ProjectLabelSize} from "@shared/ui/ProjectLabelSize";
import {ProjectLabelRoutes} from "@shared/ui/ProjectLabelRoutes";

export function TopologyToolbar() {

    const config = useAppConfigStore((s) => s.config);
    const {setShowSideBar, setTitle} = useProjectPageStore();
    const {complexities} = useComplexityStore();
    const {isDev} = useAppConfig();

    const {
        createNewBean,
        createRouteConfiguration,
        createOpenApi,
        isOpenApiExists,
        createNewKamelet,
        createNewRestFile,
        project
    } = ProjectFunctionHook();
    const {openSelector} = useRouteDesignerHook();
    const complexity = complexities?.find(c => c.projectId === project?.projectId)
    const [isOpen, setIsOpen] = useState(false);

    const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined) => {
        event?.stopPropagation();
        setIsOpen(!isOpen);
    };

    const {selectFile} = useTopologyHook();

    function getInfraButton(): ReactElement {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const fileName = isKubernetes ? 'deployment.jkube.yaml' : DOCKER_COMPOSE;
        const iconInfra = isKubernetes ? <LogoKubernetes className={"carbon"}/> : <DockerIcon className='infra-icon-docker'/>;
        return (
            <Button className="dev-action-button "
                icon={iconInfra}
                variant={"tertiary"}
                onClick={(ev: any) => {
                    ev.preventDefault();
                    selectFile(fileName)
                }}
            >
                {isKubernetes ? "Deployment" : "Compose"}
            </Button>
        )
    }

    function getButton(caption: string,
                       variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain' | 'control' | 'stateful',
                       icon?: ReactElement,
                       onClick?: MouseEventHandler<any> | undefined,
                       isDanger?: boolean,
    ): ReactElement {
        return (
            <div>
                <Button className="dev-action-button "
                        isDisabled={!isDev}
                        icon={icon}
                        variant={variant}
                        onClick={onClick}
                        isDanger={isDanger}
                >
                    {caption}
                </Button>
            </div>
        )
    }

    function getDropdownItem(caption: string,
                             icon?: ReactElement,
                             onClick?: MouseEventHandler<any> | undefined,
    ): ReactElement {
        return (
            <DropdownItem
                value={caption}
                icon={icon}
                key={caption}
                to={"#default-" + caption}
                // Prevent the default onClick functionality for example purposes
                onClick={(ev: any) => {
                    ev.preventDefault();
                    onClick?.(ev);
                }}
            >
                {caption}
            </DropdownItem>
        )
    }

    const openApiExists = isOpenApiExists();

    const dropdownList = (
        <>
            {getDropdownItem("Route", <AddLarge className='carbon'/>, _ => openSelector(undefined, undefined))}
            {!openApiExists && getDropdownItem("OpenAPI", <AddLarge className='carbon'/>, _ => createOpenApi())}
        </>
    )

    function createTemplatedRoute() {
        setShowSideBar("templatedRoute");
        setTitle("Templated Routes");
    }

    const dropDown = (
        <Dropdown
            isOpen={isOpen}
            onSelect={onSelect}
            popperProps={{placement: 'bottom-end'}}
            onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                    ref={toggleRef}
                    aria-label="kebab dropdown toggle"
                    variant="plain"
                    onClick={() => setIsOpen(!isOpen)}
                    isExpanded={isOpen}
                    icon={<EllipsisVIcon/>}
                />
            )}
            shouldFocusToggleOnSelect
        >
            <DropdownList>
                {dropdownList}
                {getDropdownItem("REST API", <AddLarge className='carbon'/>, event => createNewRestFile())}
                {getDropdownItem("Route Configuration", <AddLarge className='carbon'/>, event => createRouteConfiguration())}
                {getDropdownItem("Route Template", <AddLarge className='carbon'/>, event => openSelector(undefined, undefined, true, undefined, true))}
                {getDropdownItem("Templated Route", <AddLarge className='carbon'/>, event => createTemplatedRoute())}
                {getDropdownItem("Kamelet", <AddLarge className='carbon'/>, event => createNewKamelet())}
                {getDropdownItem("Bean", <AddLarge className='carbon'/>, event => createNewBean())}
            </DropdownList>
        </Dropdown>
    );

    function primaryButtons() {
        return (
            <>
                {getButton("Route", 'secondary', <AddLarge className='carbon'/>, _ => openSelector(undefined, undefined))}
                {!openApiExists && getButton("OpenAPI", 'secondary', <AddLarge className='carbon'/>, _ => createOpenApi(), false)}
                {getButton("Properties", 'tertiary', <CogIcon className='carbon'/>, _ => selectFile(APPLICATION_PROPERTIES))}
                {getInfraButton()}
            </>
        )
    }

    return (
        <div className='topology-toolbar'>
            <div className="group-switch">
                <ProjectTitle/>
            </div>
            <div style={{display: "flex", flexDirection: 'column', justifyContent: "flex-start", alignItems: "stretch", gap: 3}}>
                <ProjectLabelSize complexity={complexity} full/>
                <ProjectLabelRoutes complexity={complexity} full/>
            </div>
            <FileSearchToolbarItem disabled={false}/>
            <Button icon={<SyncAltIcon/>}
                    variant={"link"}
                    onClick={() => ProjectService.refreshProjectFiles(project.projectId)}
            />
            {primaryButtons()}
            {dropDown}
        </div>
    )
}