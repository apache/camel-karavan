import * as React from 'react';
import {MouseEventHandler, ReactElement, useState} from 'react';
import {Button, Divider, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import {useAppConfigStore} from '@stores/ProjectStore';
import {useTopologyHook} from '@features/project/project-topology/useTopologyHook';
import {useRouteDesignerHook} from "@features/project/designer/route/useRouteDesignerHook";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK} from "@models/ProjectModels";
import {ProjectTitle} from "@features/project/ProjectTitle";
import {useProjectFunctions} from "@features/project/ProjectContext";
import {CogIcon, DockerIcon, EllipsisVIcon} from "@patternfly/react-icons";
import {AddLarge} from "@carbon/icons-react";
import {KubernetesIcon} from "@features/project/designer/icons/ComponentIcons";

export function TopologyToolbar() {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const {
        createNewBean,
        createRouteConfiguration,
        createOpenApi,
        isOpenApiExists,
        createNewKamelet,
        project
    } = useProjectFunctions();
    const {openSelector} = useRouteDesignerHook();

    const [isOpen, setIsOpen] = useState(false);

    const onToggleClick = () => {
        setIsOpen(!isOpen);
    };

    const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined) => {
        event?.stopPropagation();
        setIsOpen(!isOpen);
    };

    const {selectFile} = useTopologyHook();

    function getInfragetDropdownItem(): ReactElement {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const swarmMode = config.swarmMode;
        const fileName = isKubernetes
            ? 'deployment.jkube.yaml'
            : (swarmMode ? DOCKER_STACK : DOCKER_COMPOSE);
        const iconInfra = isKubernetes ? KubernetesIcon("infra-icon-k8s") : <DockerIcon className='infra-icon-docker'/>;
        return (
            <DropdownItem
                value={"infra"}
                icon={iconInfra}
                key="link"
                to="#default-link2"
                // Prevent the default onClick functionality for example purposes
                onClick={(ev: any) => {
                    ev.preventDefault();
                    selectFile(fileName)
                }}
            >
                {isKubernetes ? "Deployment" : "Compose"}
            </DropdownItem>
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
                    onClick={onToggleClick}
                    isExpanded={isOpen}
                    icon={<EllipsisVIcon/>}
                />
            )}
            shouldFocusToggleOnSelect
        >
            <DropdownList>
                {getDropdownItem("Route Configuration", <AddLarge className='carbon'/>, event => createRouteConfiguration())}
                {getDropdownItem("Route Template", <AddLarge className='carbon'/>, event => openSelector(undefined, undefined, true, undefined, true))}
                {getDropdownItem("Kamelet", <AddLarge className='carbon'/>, event => createNewKamelet())}
                {getDropdownItem("Bean", <AddLarge className='carbon'/>, event => createNewBean())}
                <Divider component="li" key="separator"/>
                {getDropdownItem("Properties", <CogIcon/>, event => selectFile(APPLICATION_PROPERTIES))}
                {getInfragetDropdownItem()}
            </DropdownList>
        </Dropdown>
    );

    const primaryButtons = <>
        {getButton("Route", 'primary', <AddLarge className='carbon'/>, event => openSelector(undefined, undefined))}
        {!openApiExists && getButton("OpenAPI", 'primary', <AddLarge className='carbon'/>, _ => createOpenApi(), true)}
    </>

    return (
        <div className='topology-toolbar'>
            <div className="group-switch">
                <ProjectTitle/>
            </div>
            {primaryButtons}
            {dropDown}
        </div>
    )
}