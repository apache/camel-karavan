/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useState} from 'react';
import {
    Button,
    Flex,
    FlexItem,
    Tooltip,
    Divider,
    Popover,
    Spinner,
    Bullseye,
    DescriptionListDescription,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionList, Text, TextVariants, TextContent
} from '@patternfly/react-core';
import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import Icon from "./Logo";
import UserIcon from "@patternfly/react-icons/dist/js/icons/user-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import ResourcesIcon from "@patternfly/react-icons/dist/js/icons/blueprint-icon";
import KnowledgebaseIcon from "@patternfly/react-icons/dist/js/icons/book-open-icon";
import ContainersIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import ConfigIcon from "@patternfly/react-icons/dist/js/icons/cogs-icon";
import ServicesIcon from "@patternfly/react-icons/dist/js/icons/services-icon";
import {useAppConfigStore, useDevModeStore, useFileStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useNavigate} from "react-router-dom";
import LogoutIcon from "@patternfly/react-icons/dist/js/icons/door-open-icon";
import {SsoApi} from "../api/SsoApi";

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

export function PageNavigation () {

    const [config, loading] = useAppConfigStore((state) => [state.config, state.loading], shallow)
    const [setFile] = useFileStore((state) => [state.setFile], shallow)
    const [setStatus, setPodName] = useDevModeStore((state) => [state.setStatus, state.setPodName], shallow)
    const [showUser, setShowUser] = useState<boolean>(false);
    const [pageId, setPageId] = useState<string>();
    const navigate = useNavigate();

    function getMenu() : MenuItem[]  {
        const pages: MenuItem[] = [
            // new MenuItem("dashboard", "Dashboard", <DashboardIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
            new MenuItem("resources", "Resources", <ResourcesIcon/>),
        ]
        if (config.infrastructure === 'docker') {
            pages.push(
                new MenuItem("services", "Services", <ServicesIcon/>),
                new MenuItem("containers", "Containers", <ContainersIcon/>)
            )
        }
        pages.push(new MenuItem("knowledgebase", "Knowledgebase", <KnowledgebaseIcon/>));
        pages.push(new MenuItem("configuration", "Configuration", <ConfigIcon/>));
        return pages;
    }

    return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height: "100%"}}
                  spaceItems={{default: "spaceItemsNone"}}>
        <FlexItem alignSelf={{default: "alignSelfCenter"}}>
            <Bullseye>
                {loading && <Spinner style={{position: "absolute"}} diameter="40px" aria-label="Loading..."/>}
                <Tooltip className="logo-tooltip" content={config.title + " " + config.version}
                         position={"right"}>
                    {Icon()}
                </Tooltip>
            </Bullseye>

        </FlexItem>
        {getMenu().map(page =>
            <FlexItem key={page.pageId} className={pageId === page.pageId ? "nav-button-selected" : ""}>
                <Tooltip content={page.tooltip} position={"right"}>
                    <Button id={page.pageId} icon={page.icon} variant={"plain"}
                            className={pageId === page.pageId ? "nav-button-selected" : ""}
                            onClick={event => {
                                setFile('none', undefined);
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
                    hasAutoWidth
                    aria-label="Current user"
                    position={"right-end"}
                    hideOnOutsideClick={false}
                    isVisible={showUser}
                    shouldClose={(_event, tip) => setShowUser(false)}
                    shouldOpen={(_event, tip) => setShowUser(true)}
                    headerContent={
                        <TextContent>
                            <Text component={TextVariants.h3}>Profile</Text>
                        </TextContent>
                    }
                    bodyContent={
                        <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                                <DescriptionListTerm>UserName</DescriptionListTerm>
                                <DescriptionListDescription>{KaravanApi.me?.userName}</DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Display Name</DescriptionListTerm>
                                <DescriptionListDescription>{KaravanApi.me?.displayName}</DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    }
                    footerContent={
                        <Flex justifyContent={{default: "justifyContentFlexEnd"}}>
                            <Button size="sm"
                                    variant={"primary"}
                                    icon={<LogoutIcon/>}
                                    onClick={e => {
                                        setShowUser(false);
                                        SsoApi.logout(() => {});
                                    }}
                            >
                                Logout
                            </Button>
                        </Flex>
                    }
                >
                    <UserIcon className="avatar"/>
                </Popover>
            </FlexItem>}
    </Flex>)
}