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
import './ProjectLog.css';
import {LogViewer} from '@patternfly/react-log-viewer';
import {useLogStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow"
import {useTheme} from '@/main/ThemeContext';

interface Props {
    autoScroll: boolean
    isTextWrapped: boolean
    header?: React.ReactNode
}

export function ProjectLogTab(props: Props) {
    const {isDark} = useTheme();
    const [data, currentLine] = useLogStore((state) => [state.data, state.currentLine], shallow);
    const [logViewerRef] = useState(React.createRef());

    return (
        <LogViewer
            isTextWrapped={props.isTextWrapped}
            innerRef={logViewerRef}
            hasLineNumbers={false}
            loadingContent={"Loading..."}
            // header={}
            height={"100vh"}
            data={data.length > 0 ? data : "........."}
            scrollToRow={props.autoScroll ? currentLine : undefined}
            theme={isDark ? 'dark' : 'dark'}
            toolbar={props.header}
        />
    );
}
