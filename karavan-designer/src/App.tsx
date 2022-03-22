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

interface Props {
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
        yaml: 'apiVersion: camel.apache.org/v1\n' +
            'kind: Integration\n' +
            'metadata:\n' +
            '  name: postman.yaml\n' +
            'spec:\n' +
            '  flows:\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: direct:post\n' +
            '          steps:\n' +
            '            - log:\n' +
            '                message: \'Received: ${body}\'\n' +
            '            - to:\n' +
            '                uri: kamelet:kafka-sink\n' +
            '                parameters:\n' +
            '                  topic: topic1\n' +
            '        id: post\n' +
            ''
    };

    componentDidMount() {

        ["http-secured-sink.kamelet.yaml",
            "timer-source.kamelet.yaml",
            "http-secured-source.kamelet.yaml",
            "http-sink.kamelet.yaml",
            "http-source.kamelet.yaml",
            "insert-header-action.kamelet.yaml",
            "kafka-not-secured-sink.kamelet.yaml",
            "kafka-not-secured-source.kamelet.yaml",
            "kafka-sink.kamelet.yaml",
            "kafka-source.kamelet.yaml"].forEach(name =>
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
            "coap+tcp.json",
            "pg-replication-slot.json",
            "rest-api.json",
            "rest-openapi.json",
            "kubernetes-service-accounts.json",
            "mvel.json"].forEach(name =>
            fetch("components/" + name)
                .then((r) => r.text())
                .then(value => ComponentApi.saveComponent(value)));

    }

    save(filename: string, yaml: string) {
        // console.log(filename);
        console.log(yaml);
    }

    public render() {
        return (
            <Page className="karavan">
                <KaravanDesigner key={this.state.key} filename={this.state.name} yaml={this.state.yaml}
                                 onSave={(filename, yaml) => this.save(filename, yaml)}
                                 borderColor="#fb8824"
                                 borderColorSelected="#303284"
                                 dark={document.body.className.includes('vscode-dark')}
                />
            </Page>
        );
    }
}

export default App;
