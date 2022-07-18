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
    FormGroup,
    Checkbox, PopoverPosition, Popover, InputGroup
} from '@patternfly/react-core';
import '../designer/karavan.css';
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";

interface Props {
    label: string
    help: string
    files: string
    filesSelected: string
    onChange: (files: string) => void
    source: boolean
}

interface State {
    selected: []
}

export class FileSelector extends React.Component<Props, State> {

    public state: State = {
        selected: []
    };

    isChecked(file: string) {
        const finalFile = this.props.source ? "file:" + file : file;
        const s = this.props.filesSelected ? this.props.filesSelected.split(",").map(value => value.trim()) : [];
        return s.includes(finalFile);
    }

    onChange(file: string, checked: boolean) {
        const finalFile = this.props.source ? "file:" + file : file;
        const s = this.props.filesSelected.split(",").map(f => f.trim()).filter(f => f.length > 0);
        const already = s.includes(finalFile);
        if (checked && !already) {
            s.push(finalFile);
            this.props.onChange?.call(this, s.join(","));
        } else if (!checked) {
            const result = s.filter(f => f !== finalFile);
            this.props.onChange?.call(this, result.join(","));
        }
    }

    getFiles(): string[] {
        const allFiles = (this.props.files ? this.props.files.split(",") : []);
        if (this.props.source){
            const extensions = ['yaml', 'yml', 'java', 'js', 'kt', 'groovy', 'xml'];
            return  allFiles.filter(file => {
                const extension = file.split(".").pop() || '';
                return extensions.includes(extension);
            }).map(file => file.replace("file:", ""))
        }
        return allFiles;
    }

    render() {
        const files = this.getFiles();
        return (
            <FormGroup label={this.props.label} fieldId="files">
                <InputGroup>
                    <div style={{width:"100%"}}>
                        {files.map(file => {
                            const key = file + this.props.source;
                            return <Checkbox key={key} label={file} isChecked={this.isChecked(file)} onChange={checked => this.onChange(file, checked)} id={key} name={key}/>
                        })}
                    </div>
                    <Popover aria-label="files" position={PopoverPosition.left}
                             bodyContent={this.props.help}>
                        <Button variant="plain" onClick={e => {}}>
                            <HelpIcon/>
                        </Button>
                    </Popover>
                </InputGroup>
            </FormGroup>
        )
    }
};