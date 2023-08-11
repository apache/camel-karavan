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
import {
    Button,
    Modal,
    PageSection,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {
	Tbody,
	Th,
	Thead,
	Tr
} from '@patternfly/react-table';
import {
	Table
} from '@patternfly/react-table/deprecated';

import {ProjectModel, ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {useFileStore} from "../../api/ProjectStore";
import {ProjectModelApi} from "karavan-core/lib/api/ProjectModelApi";
import {shallow} from "zustand/shallow"
import {PropertyField} from "./PropertyField";
import {ProjectService} from "../../api/ProjectService";

export const PropertiesTable = () => {

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | undefined>(undefined);
    const [key, setKey] = useState<string | undefined>(undefined);
    const [properties, setProperties] = useState<ProjectProperty[]>([]);
    const [file, editAdvancedProperties, addProperty, setAddProperty] = useFileStore((state) =>
        [state.file, state.editAdvancedProperties, state.addProperty, state.setAddProperty], shallow)

    useEffect(() => {
        console.log("PropertiesTable useEffect");
        setProperties(getProjectModel().properties)
    }, [addProperty]);

    function save (props: ProjectProperty[]) {
        if (file) {
            file.code = ProjectModelApi.propertiesToString(props);
            ProjectService.saveFile(file);
        }
    }

    function getProjectModel(): ProjectModel {
        return file ? ProjectModelApi.propertiesToProject(file?.code) : ProjectModel.createNew()
    }

    function changeProperty(property: ProjectProperty) {
        const props = properties.map(prop => prop.id === property.id ? property : prop);
        save(props);
    }

    function startDelete(id: string) {
        console.log("startDelete", id)
        setShowDeleteConfirmation(true);
        setDeleteId(id);
    }

    function confirmDelete() {
        console.log("confirmDelete")
        const props = properties.filter(p => p.id !== deleteId);
        save(props);
        setShowDeleteConfirmation(false);
        setDeleteId(undefined);
        setAddProperty(Math.random().toString());
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => confirmDelete()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>Delete property?</div>
        </Modal>)
    }

    return (
        <PageSection isFilled className="kamelets-page" padding={{default: file !== undefined ? 'noPadding' : 'padding'}}>
            <PageSection padding={{default: "noPadding"}}>
                {properties.length > 0 &&
                    <Table aria-label="Property table" variant='compact' borders={false}
                                     className="project-properties">
                        <Thead>
                            <Tr>
                                <Th key='name'>Name</Th>
                                <Th key='value'>Value</Th>
                                <Th></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {properties.map((property, idx: number) => {
                                const readOnly = (property.key.startsWith("camel.jbang") || property.key.startsWith("camel.karavan")) && !editAdvancedProperties;
                                return (
                                    <PropertyField property={property} readOnly={readOnly} changeProperty={changeProperty} onDelete={startDelete}/>
                                )})}
                        </Tbody>
                    </Table>}
                {showDeleteConfirmation && getDeleteConfirmation()}
            </PageSection>
        </PageSection>
    )
}