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
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Text,
    TextContent,
    Flex,
    FlexItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {getProjectFileType} from "../api/ProjectModels";
import {useAppConfigStore, useFileStore, useProjectStore} from "../api/ProjectStore";

export function ProjectTitle () {

    const {project} = useProjectStore();
    const {file, operation, setFile} = useFileStore();
    const {config} = useAppConfigStore();

    const isFile = file !== undefined;
    const isLog = file !== undefined && file.name.endsWith("log");
    const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";
    return (<div className="dsl-title project-title">
        {isFile && <Flex direction={{default: "column"}} >
            <FlexItem>
                <Breadcrumb>
                    <BreadcrumbItem to="#" onClick={event => {
                        useFileStore.setState({file: undefined, operation: 'none'});
                    }}>
                        <div className={"project-breadcrumb"}>{project?.name + " (" + project?.projectId + ")"}</div>
                    </BreadcrumbItem>
                </Breadcrumb>
            </FlexItem>
            <FlexItem>
                <Flex direction={{default: "row"}}>
                    <FlexItem>
                        <Badge>{getProjectFileType(file)}</Badge>
                    </FlexItem>
                    <FlexItem>
                        <TextContent className="description">
                            <Text>{isLog ? filename : file.name}</Text>
                        </TextContent>
                    </FlexItem>
                </Flex>
            </FlexItem>
        </Flex>}
        {!isFile && <Flex direction={{default: "column"}} >
            <FlexItem>
                <TextContent className="title">
                    <Text component="h2">{project?.name + " (" + project?.projectId + ")"}</Text>
                </TextContent>
            </FlexItem>
            <FlexItem>
                <TextContent className="description">
                    <Text>{project?.description}</Text>
                </TextContent>
            </FlexItem>
        </Flex>}
    </div>)
}
