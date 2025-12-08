import * as React from 'react';
import {ReactElement, useState} from 'react';
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import {useAppConfigStore} from '@stores/ProjectStore';
import {useTopologyHook} from '@features/integration/integration-topology/useTopologyHook';
import {useRouteDesignerHook} from "@features/integration/designer/route/useRouteDesignerHook";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK} from "@models/ProjectModels";
import {ProjectTitle} from "@features/integration/ProjectTitle";
import {useProjectFunctions} from "@features/integration/ProjectContext";
import {ASYNCAPI_FILE_NAME_JSON, OPENAPI_FILE_NAME_JSON} from "@karavan-core/contants";
import {CheckIcon} from "@patternfly/react-icons";

export function TopologyToolbar() {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const {createNewRestFile, createNewBean, createRouteConfiguration, createOpenApi, isOpenApiExists, createNewKamelet, isAsyncApiExists, createAsyncApi, project}  = useProjectFunctions();
    const {openSelector} = useRouteDesignerHook();

    const [isOpen, setIsOpen] = useState(false);

    const onToggle = () => {
        setIsOpen(!isOpen);
    };

    const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined) => {
        event?.stopPropagation();
        setIsOpen(!isOpen);
    };

    const {selectFile} = useTopologyHook();

    function getInfraButton(): ReactElement {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const swarmMode = config.swarmMode;
        const fileName = isKubernetes
            ? 'deployment.jkube.yaml'
            : (swarmMode ? DOCKER_STACK : DOCKER_COMPOSE);

        return (
            <Button variant={"secondary"}
                    className='bean-button'
                // icon={icon}
                    onClick={() => {
                        selectFile(fileName)
                    }}
            >
                Configuration
            </Button>
        )
    }

    return (
        <div className='topology-toolbar'>
            <div className="group-switch">
                <ProjectTitle/>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"primary"}
                        onClick={(ev) => openSelector(undefined, undefined)}
                >
                    Add Route
                </Button>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={isAsyncApiExists() || isOpenApiExists() ? "secondary" : "primary"}
                        onClick={(ev) => {
                            createNewRestFile();
                        }}
                >
                    Add Rest DSL
                </Button>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"secondary"}
                        onClick={e => createNewBean()}
                >
                    Add Bean
                </Button>
            </div>
            <div>
                <Button variant={"secondary"}
                        className='bean-button'
                        onClick={() => {
                            selectFile(APPLICATION_PROPERTIES)
                        }}
                >
                    Properties
                </Button>
            </div>
            <div>
                {getInfraButton()}
            </div>
            <Dropdown
                className="dev-action-button"
                onSelect={onSelect}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                        ref={toggleRef}
                        onClick={onToggle}
                        variant="plain"
                        isExpanded={isOpen}
                        aria-label="Action list single group kebab"
                        icon={<EllipsisVIcon/>}
                    />
                )}
                isOpen={isOpen}
                onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
            >
                <DropdownList>
                    <DropdownItem value={0} key="config" onClick={(ev) => createRouteConfiguration()}>
                        Add Route Configuration
                    </DropdownItem>
                    <DropdownItem value={1} key="template" onClick={(ev) => openSelector(undefined, undefined, true, undefined, true)}>
                        Add Route Template
                    </DropdownItem>
                    <DropdownItem value={2} key="kamelet" onClick={(ev) => createNewKamelet()}>
                        Add Kamelet
                    </DropdownItem>
                </DropdownList>
            </Dropdown>
        </div>
    )
}