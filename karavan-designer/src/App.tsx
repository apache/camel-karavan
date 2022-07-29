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
import * as React from "react";
import {
    Page,
} from "@patternfly/react-core";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {KaravanDesigner} from "./designer/KaravanDesigner";
import {KameletsPage} from "./kamelets/KameletsPage";
import {ComponentsPage} from "./components/ComponentsPage";
import {EipPage} from "./eip/EipPage";

interface Props {
    page: "designer" | "kamelets" | "components" | "eip" | "builder";
}

interface State {
    name: string
    yaml: string
    key: string
}

class App extends React.Component<Props, State> {

    public state: State = {
        name: 'demo.yaml',
        key: '',
        yaml:
            'apiVersion: camel.apache.org/v1\n' +
            'kind: Integration\n' +
            'metadata:\n' +
            '  name: postman.yaml\n' +
            'spec:\n' +
            '  flows:\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: kamelet:timer-source\n' +
            '          steps:\n' +
            '            - log:\n' +
            '                message: ${body}\n' +
            '            - aggregate: {}\n' +
            '            - choice: {}\n' +
            '            - split:\n' +
            '                expression: {}\n' +
            '            - saga: {}\n' +
            '            - to:\n' +
            '                uri: direct:hello-world\n' +
            '            - to:\n' +
            '                uri: salesforce:getSObject\n' +
            '                parameters:\n' +
            '                  sObjectId: xxx\n' +
            '                  sObjectClass: Account\n' +
            '          parameters:\n' +
            '            period: 2000\n' +
            '            message: Hello World\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: direct:hello-world\n' +
            '        id: hello-world' +
            ''
    };

    componentDidMount() {
        ["http-secured-sink.kamelet.yaml",
            "timer-source.kamelet.yaml",
            "http-secured-source.kamelet.yaml",
            "http-sink.kamelet.yaml",
            "http-source.kamelet.yaml",
            "mqtt-source.kamelet.yaml",
            "insert-header-action.kamelet.yaml",
            "kafka-not-secured-sink.kamelet.yaml",
            "kafka-not-secured-source.kamelet.yaml",
            "kafka-sink.kamelet.yaml",
            "kafka-source.kamelet.yaml",
            "postgresql-sink.kamelet.yaml",
            "postgresql-source.kamelet.yaml"
        ].forEach(name =>
            fetch("kamelets/" + name)
                .then((r) => r.text())
                .then(value => KameletApi.saveKamelet(value)));

        ["bonita.json",
            "activemq.json",
            "direct.json",
            "seda.json",
            "docker.json",
            "netty-http.json",
            "jms.json",
            "sql.json",
            "cxf.json",
            "file.json",
            "log.json",
            "kafka.json",
            "coap+tcp.json",
            "pg-replication-slot.json",
            "rest-api.json",
            "rest-openapi.json",
            "salesforce.json",
            "kubernetes-service-accounts.json",
            "mvel.json"].forEach(name =>
            fetch("components/" + name)
                .then((r) => r.text())
                .then(value => ComponentApi.saveComponent(value)));
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        // console.log(filename);
        // console.log(yaml);
        // console.log(propertyOnly);
    }

    public render() {
        return (
            <Page className="karavan">
                {this.props.page === "designer" && <KaravanDesigner key={this.state.key} filename={this.state.name} yaml={this.state.yaml}
                                                                    onSave={(filename, yaml, propertyOnly) => this.save(filename, yaml, propertyOnly)}
                                                                    dark={document.body.className.includes('vscode-dark')}
                                                                    showStartHelp={true}/>}
                {this.props.page === "kamelets" && <KameletsPage dark={document.body.className.includes('vscode-dark')} />}
                {this.props.page === "components" && <ComponentsPage dark={document.body.className.includes('vscode-dark')} />}
                {this.props.page === "eip" && <EipPage dark={document.body.className.includes('vscode-dark')} />}
            </Page>
        );
    }
}

export default App;
