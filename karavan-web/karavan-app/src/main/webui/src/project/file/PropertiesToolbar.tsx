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
import React from 'react';
import {
    Button, Checkbox,
    Flex,
    FlexItem
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useFileStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";

export function PropertiesToolbar () {

    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty] = useFileStore((state) =>
        [state.file, state.editAdvancedProperties, state.setEditAdvancedProperties, state.setAddProperty], shallow )


    function addProperty() {
        if (file) {
            const project = file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew();
            const props = project.properties;
            props.push(ProjectProperty.createNew("", ""));
            file.code = ProjectModelApi.propertiesToString(props);
            ProjectService.saveFile(file, true);
            setAddProperty(Math.random().toString());
        }
    }

    return (
        <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}>
            <FlexItem>
                <Checkbox
                    id="advanced"
                    label="Edit advanced"
                    isChecked={editAdvancedProperties}
                    onChange={(_, checked) => setEditAdvancedProperties(checked)}
                />
            </FlexItem>
            <FlexItem>
                <Button size="sm" variant="primary" icon={<PlusIcon/>} onClick={e => addProperty()}>Add property</Button>
            </FlexItem>
        </Flex>
    )
}
