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

import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { KnowledgebasePage } from "../knowledgebase/KnowledgebasePage"
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KaravanApi } from "../api/KaravanApi";
import { useState, useEffect } from "react";
import { ProjectFile } from "../api/ProjectModels";
import { ProjectService } from "../api/ProjectService";
interface Props {
    dark: boolean,
}
export const KnowledgebaseWrapper = (props: Props) => {

    const [blockList, setBlockList] = useState<ProjectFile[]>();

    useEffect(() => {
        KaravanApi.getConfigurationFiles((files:ProjectFile[]) => {
            setBlockList([...(files.filter(f => f.name.endsWith('blocklist.txt')))]);
        });
        ProjectService.reloadKamelets();
    }, []);

    const onChangeBlockedList = async (type: string, name: string, checked: boolean) => {
        let file: ProjectFile | undefined;
        let fileContent = '';
        if (type === "component") {
            file = blockList?.find(obj => obj.name === 'components-blocklist.txt');
            fileContent = ComponentApi.saveBlockedComponentName(name, checked).join('\n');
        } else {
            file = blockList?.find(obj => obj.name === 'kamelets-blocklist.txt');
            fileContent = KameletApi.saveBlockedKameletName(name, checked).join('\n');
        }
        if (file) {
            file.code = fileContent;
            ProjectService.updateFile(file, false);
        }
    }

    return (
        <KnowledgebasePage
            dark={props.dark}
            showBlockCheckbox={true}
            changeBlockList={(type: string, name: string, checked: boolean) => onChangeBlockedList(type, name, checked)} />
    );
}