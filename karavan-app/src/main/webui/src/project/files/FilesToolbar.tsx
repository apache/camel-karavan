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
    Button,
    Flex,
    FlexItem,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useFileStore} from "../../api/ProjectStore";

export const FileToolbar = () => {

    return <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}>
        <FlexItem>
            <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                    onClick={e => useFileStore.setState({operation:"create"})}>Create</Button>
        </FlexItem>
        <FlexItem>
            <Button isSmall variant="secondary" icon={<UploadIcon/>}
                    onClick={e => useFileStore.setState({operation:"upload"})}>Upload</Button>
        </FlexItem>
    </Flex>
}
