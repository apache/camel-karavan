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
import {FormGroup, TextInput, Title} from "@patternfly/react-core";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";

interface Props {
    integration: Integration,
}

export class IntegrationHeader extends React.Component<Props> {

    render() {
        return (
            <div className="headers">
                <Title headingLevel="h1" size="md">Integration</Title>
                {/*<FormGroup label="Title" fieldId="title" isRequired>*/}
                {/*    <TextInput className="text-field" type="text" id="title" name="title" isReadOnly*/}
                {/*               value={*/}
                {/*                   CamelUi.titleFromName(this.props.integration.metadata.name)*/}
                {/*               }/>*/}
                {/*</FormGroup>*/}
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput className="text-field" type="text" id="name" name="name" isReadOnly
                               value={this.props.integration.metadata.name}/>
                </FormGroup>
            </div>
        )
    }
}
