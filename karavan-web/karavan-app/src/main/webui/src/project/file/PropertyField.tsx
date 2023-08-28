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
    TextInput
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {ProjectProperty} from "karavan-core/lib/model/ProjectModel";
import {Td, Tr} from "@patternfly/react-table";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";

interface Props {
    property: ProjectProperty,
    readOnly: boolean,
    changeProperty: (p: ProjectProperty) => void
    onDelete: (id: string) => void
}

export function PropertyField (props: Props) {

    const [key, setKey] = useState<string | undefined>(props.property.key);
    const [value, setValue] = useState<string | undefined>(props.property.value);

    useEffect(() => {
    }, []);

    return (
        <Tr key={props.property.id}>
            <Td noPadding width={10} dataLabel="key">
                <TextInput isDisabled={props.readOnly} isRequired={true} className="text-field" type={"text"}
                           id={"key-" + props.property.id}
                           value={key}
                           onChange={(e, val) => {
                               e.preventDefault();
                               setKey(val)
                               props.changeProperty(new ProjectProperty({id: props.property.id, key: val, value: value}));
                           }}/>
            </Td>
            <Td noPadding width={20} dataLabel="value">
                <TextInput isDisabled={props.readOnly} isRequired={true} className="text-field" type={"text"}
                           id={"value-" + props.property.id}
                           value={value }
                           onChange={(e, val) => {
                               e.preventDefault();
                               setValue(val);
                               props.changeProperty(new ProjectProperty({id: props.property.id, key: key, value: val}));
                           }}/>
            </Td>
            <Td noPadding isActionCell dataLabel="delete" className="delete-cell">
                {!props.readOnly && <Button variant={"plain"} icon={<DeleteIcon/>} className={"delete-button"}
                                      onClick={event => {
                                          props.onDelete(props.property.id)
                                      }}/>}
            </Td>
        </Tr>

    )
}