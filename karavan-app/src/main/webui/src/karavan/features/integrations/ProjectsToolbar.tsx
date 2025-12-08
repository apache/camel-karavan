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

import React, {useEffect, useState} from 'react';
import {Button, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Tooltip, TooltipPosition,} from '@patternfly/react-core';
import {PlusIcon, SearchIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {Project} from "@models/ProjectModels";
import {shallow} from "zustand/shallow";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectService} from "@services/ProjectService";
import {useSearchStore} from "@stores/SearchStore";
import {useDebounceValue} from "usehooks-ts";
import {SearchApi} from "@api/SearchApi";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import PullIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {UploadProjectModal} from "@features/integrations/UploadProjectModal";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";

export function ProjectsToolbar() {

    const [search, setSearch, setSearchResults] = useSearchStore((s) => [s.search, s.setSearch, s.setSearchResults], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow)
    const [showUpload, setShowUpload] = useState<boolean>(false);
    const [debouncedSearch] = useDebounceValue(search, 300);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    useEffect(() => {
        if (search !== undefined && search !== '') {
            SearchApi.searchAll(search, response => {
                if (response) {
                    setSearchResults(response);
                }
            })
        } else {
            setSearchResults([])
        }
    }, [debouncedSearch]);

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInputGroupMain
                    value={search}
                    id="search-input"
                    // placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon />}
                    onChange={(_event, value) => {
                        setSearch(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setSearch('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    return (
        <div className='main-toolbar-toolbar'>
            <Tooltip content='Pull new Integrations from git' position={TooltipPosition.left}>
                <Button icon={<PullIcon/>}
                        variant={"link"}
                        isDanger
                        onClick={e => setPullIsOpen(true)}
                />
            </Tooltip>
            <Button icon={<RefreshIcon/>}
                    variant={"link"}
                    onClick={e => ProjectService.refreshProjects()}
            />
            {searchInput()}
            {isDev &&
                <Button className="dev-action-button" variant="secondary"
                        icon={<UploadIcon/>}
                        onClick={e => setShowUpload(true)}>
                    Import
                </Button>
            }
            {isDev &&
                <Button className="dev-action-button" variant="primary"
                        icon={<PlusIcon/>}
                        onClick={e => setProject(new Project(), 'create')}>
                    Create
                </Button>
            }
            {showUpload && <UploadProjectModal open={showUpload} onClose={() => setShowUpload(false)}/>}
            <ModalConfirmation isOpen={pullIsOpen}
                               message='Pull new Integrations from Git!'
                               onConfirm={() => {
                                   ProjectService.pullAllProjects();
                                   setPullIsOpen(false);
                               }}
                               onCancel={() => setPullIsOpen(false)}
                               btnConfirmVariant='danger'
                               btnConfirm='Confirm Pull'
            />
        </div>
    )
}