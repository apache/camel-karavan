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
    Button, EmptyState, EmptyStateBody, EmptyStateIcon, Modal,
    PageSection, Title
} from '@patternfly/react-core';
import './karavan.css';
import {CamelElement, Integration} from "karavan-core/lib/model/CamelDefinition";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    key: string
}

export class ExceptionDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        key: "",
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, key: Math.random().toString()});
    }

    render() {
        return (
            <PageSection className="exception-page" isFilled padding={{default: 'noPadding'}}>
                <div className="exception-page-columns">
                    <EmptyState>
                        <EmptyStateIcon icon={CubesIcon} />
                        <Title headingLevel="h4" size="lg">
                            Exception Clauses
                        </Title>
                        <EmptyStateBody>
                            Exception Clauses not implemented yet
                        </EmptyStateBody>
                    </EmptyState>
                </div>
            </PageSection>
        );
    }
}
