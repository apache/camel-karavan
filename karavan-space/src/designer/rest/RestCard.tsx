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
    Button, Tooltip
} from '@patternfly/react-core';
import './rest.css';
import '../karavan.css';
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {GetDefinition, RestDefinition} from "karavan-core/lib/model/CamelDefinition";
import {RestMethodCard} from "./RestMethodCard";
import {AddElementIcon, DeleteElementIcon} from "../utils/ElementIcons";

interface Props {
    rest: RestDefinition
    selectedStep?: CamelElement
    integration: Integration
    selectMethod: (element: CamelElement) => void
    selectElement: (element: CamelElement) => void
    deleteElement: (element: CamelElement) => void
}

export function RestCard(props: Props) {

    function selectElement(evt: React.MouseEvent) {
        evt.stopPropagation();
        props.selectElement(props.rest);
    }

    function selectMethod(evt: React.MouseEvent) {
        evt.stopPropagation();
        props.selectMethod(props.rest);
    }

    function onDelete(evt: React.MouseEvent) {
        evt.stopPropagation();
        props.deleteElement(props.rest);
    }

    const rest = props.rest;
    return (
        <div
            className={props.selectedStep?.uuid === rest.uuid ? "rest-card rest-card-selected" : "rest-card rest-card-unselected"}
            onClick={e => selectElement(e)}>
            <div className="header">
                <div className="title">REST</div>
                <div className="title">{rest.path}</div>
                <div className="description">{rest.description}</div>
                <Tooltip position={"bottom"} content={<div>Add REST method</div>}>
                    <Button variant={"link"} icon={AddElementIcon()} aria-label="Add" onClick={e => selectMethod(e)}
                            className="add-button">Add method</Button>
                </Tooltip>
                <Button variant="link" className="delete-button" onClick={e => onDelete(e)}>{DeleteElementIcon()}</Button>
            </div>
            <div className="rest-content" key={Math.random().toString()}>
                {rest.get?.map((get: GetDefinition) =>
                    <RestMethodCard key={get.uuid}
                                    method={get}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
                {rest.post?.map(post =>
                    <RestMethodCard key={post.uuid}
                                    method={post}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
                {rest.put?.map(put =>
                    <RestMethodCard key={put.uuid}
                                    method={put}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
                {rest.patch?.map(patch =>
                    <RestMethodCard key={patch.uuid}
                                    method={patch}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
                {rest.delete?.map(del =>
                    <RestMethodCard key={del.uuid}
                                    method={del}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
                {rest.head?.map(head =>
                    <RestMethodCard key={head.uuid}
                                    method={head}
                                    selectElement={props.selectElement}
                                    deleteElement={props.deleteElement}
                    />)}
            </div>
        </div>
    )
}
