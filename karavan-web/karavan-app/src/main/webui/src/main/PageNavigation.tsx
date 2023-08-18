import React, { useState} from 'react';
import {
    Button,
    Flex,
    FlexItem,
    Tooltip,
    Divider, Popover, Badge
} from '@patternfly/react-core';
import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import Icon from "../Logo";
import UserIcon from "@patternfly/react-icons/dist/js/icons/user-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import KnowledgebaseIcon from "@patternfly/react-icons/dist/js/icons/book-open-icon";
import ContainersIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import DashboardIcon from "@patternfly/react-icons/dist/js/icons/tachometer-alt-icon";
import ServicesIcon from "@patternfly/react-icons/dist/js/icons/services-icon";
import {useAppConfigStore, useDevModeStore, useFileStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";

class MenuItem {
    pageId: string = '';
    tooltip: string = '';
    icon: any;

    constructor(pageId: string, tooltip: string, icon: any) {
        this.pageId = pageId;
        this.tooltip = tooltip;
        this.icon = icon;
    }
}

export const PageNavigation = () => {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const [showUser, setShowUser] = useState<boolean>(false);
    const [pageId, setPageId] = useState<string>();
    const navigate = useNavigate();

    function getMenu() : MenuItem[]  {
        const pages: MenuItem[] = [
            new MenuItem("dashboard", "Dashboard", <DashboardIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
        ]
        if (config.infrastructure === 'docker') {
            pages.push(
                new MenuItem("services", "Services", <ServicesIcon/>),
                new MenuItem("containers", "Containers", <ContainersIcon/>)
            )
        }
        pages.push(new MenuItem("knowledgebase", "Knowledgebase", <KnowledgebaseIcon/>));
        return pages;
    }

    return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height: "100%"}}
                  spaceItems={{default: "spaceItemsNone"}}>
        <FlexItem alignSelf={{default: "alignSelfCenter"}}>
            <Tooltip className="logo-tooltip" content={"Apache Camel Karavan " + config.version}
                     position={"right"}>
                {Icon()}
            </Tooltip>
        </FlexItem>
        {getMenu().map(page =>
            <FlexItem key={page.pageId} className={pageId === page.pageId ? "nav-button-selected" : ""}>
                <Tooltip content={page.tooltip} position={"right"}>
                    <Button id={page.pageId} icon={page.icon} variant={"plain"}
                            className={pageId === page.pageId ? "nav-button-selected" : ""}
                            onClick={event => {
                                setFile('none',undefined);
                                setPodName(undefined);
                                setStatus("none");
                                setPageId(page.pageId);
                                navigate(page.pageId);
                            }}
                    />
                </Tooltip>
            </FlexItem>
        )}
        <FlexItem flex={{default: "flex_2"}} alignSelf={{default: "alignSelfCenter"}}>
            <Divider/>
        </FlexItem>
        {KaravanApi.authType !== 'public' &&
            <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                <Popover
                    aria-label="Current user"
                    position={"right-end"}
                    hideOnOutsideClick={false}
                    isVisible={showUser}
                    shouldClose={(_event, tip) => setShowUser(false)}
                    shouldOpen={(_event, tip) => setShowUser(true)}
                    headerContent={<div>{KaravanApi.me?.userName}</div>}
                    bodyContent={
                        <Flex direction={{default: "row"}}>
                            {KaravanApi.me?.roles && Array.isArray(KaravanApi.me?.roles)
                                && KaravanApi.me?.roles
                                    .filter((r: string) => ['administrator', 'developer', 'viewer'].includes(r))
                                    .map((role: string) => <Badge id={role} isRead>{role}</Badge>)}
                        </Flex>
                    }
                >
                    <UserIcon className="avatar"/>
                </Popover>
            </FlexItem>}
    </Flex>)
}