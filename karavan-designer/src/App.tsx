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
            '  name: demo.yaml \n' +
            'spec:\n' +
            // '  dependencies:\n' +
            // '    - "mvn:org.apache.commons:commons-dbcp2:2.9.0" \n' +
            // '    - "mvn:org.postgresql:postgresql:42.2.14" \n' +
            '  flows:\n' +
            // '    - route:\n' +
            // '        from:\n' +
            // '          uri: kamelet:http-secured-source\n' +
            // '          steps:\n' +
            // '            - saga:\n' +
            // '                steps:\n' +
            // '                  - kamelet:\n' +
            // '                      name: http-sink\n' +
            // '                  - kamelet:\n' +
            // '                      name: kafka-sink\n' +
            // '            - wireTap: {}\n' +
            // '            - to:\n' +
            // '                uri: seda\n' +
            // '        id: Main Route\n' +
            // '    - route:\n' +
            // '        from:\n' +
            // '          uri: direct:completion\n' +
            // '        id: Completion\n' +
            // '    - route:\n' +
            // '        from:\n' +
            // '          uri: direct:compensation\n' +
            // '        id: Compensation\n' +
            // '    - route:\n' +
            // '        from:\n' +
            // '          uri: seda:demo\n' +
            // '        id: seda\n' +
            // '            - choice:\n' +
            // '                when:\n' +
            // '                  - expression:\n' +
            // '                      simple:\n' +
            // '                        expression: hello world\n' +
            // '                    steps:\n' +
            // '                      - to:\n' +
            // '                          uri: direct:demo1\n' +
            // '                  - expression:\n' +
            // '                      simple:\n' +
            // '                        expression: hello world\n' +
            // '                    steps:\n' +
            // '                      - to:\n' +
            // '                          uri: direct:demo1\n' +
            // '                  - expression:\n' +
            // '                      simple:\n' +
            // '                        expression: hello world\n' +
            // '                    steps:\n' +
            // '                      - to:\n' +
            // '                          uri: direct:demo1\n' +
            // '                  - expression:\n' +
            // '                      simple:\n' +
            // '                        expression: hello world\n' +
            // '                    steps:\n' +
            // '                      - wireTap:\n' +
            // '                otherwise:\n' +
            // '                  steps:\n' +
            // '                    - to:\n' +
            // '                        uri: direct:demo1\n' +
            // '                    - to:\n' +
            // '                        uri: direct\n' +
            // '                    - kamelet:\n' +
            // '                        name: insert-header-action\n' +
            // '                    - kamelet:\n' +
            // '                        name: http-sink\n' +
            // '    - route:\n' +
            // '       from:\n' +
            // '         uri: direct:demo2\n' +
            // '         steps:\n' +
            // '           - saga: \n' +
            // '               option:\n' +
            // '                 - option-name: o1\n' +
            // '                   expression:\n' +
            // '                     simple: "${body}" \n' +
            // '                 - option-name: o2\n' +
            // '                   expression:\n' +
            // '                     simple: "${body}" \n' +
            // '           - do-try:\n' +
            // '                steps:\n' +
            // '                  - to: "direct:direct1"\n' +
            // '                  - to: "direct:direct2"\n' +
            // '                  - log: "log1"\n' +
            // '                do-catch:\n' +
            // '                  - exception:\n' +
            // '                      - "java.io.FileNotFoundException"\n' +
            // '                      - "java.io.IOException"\n' +
            // '                    steps:\n' +
            // '                      - log: "log1"\n' +
            // '                      - kamelet: \n' +
            // '                           name: kafka-sink \n' +
            // '                  - exception:\n' +
            // '                      - "java.io.FileNotFoundException"\n' +
            // '                      - "java.io.IOException"\n' +
            // '                    steps:\n' +
            // '                      - log: "log1"\n' +
            // '                      - kamelet: \n' +
            // '                           name: http-sink \n' +
            // '            - choice:\n' +
            // '                when:\n' +
            // '                  - simple: "hello world"\n' +
            // '                    steps:\n' +
            // '                      - log:\n' +
            // '                           message: hello22s\n' +
            // '                           logName: log22\n' +
            // '                otherwise: {}\n'+
            '    - rest-configuration:\n' +
            '        component: "platform-http"\n' +
            '        context-path: "/base"  \n' +
            '        port: 8081\n' +
            '    - rest:\n' +
            '        path: "/"\n' +
            '        post:\n' +
            '          - path: "/foo"\n' +
            '            to: "direct:foo"\n' +
            '            description: "POST demo service"\n' +
            // '          - path: "/bar"\n' +
            // '            to: "direct:bar"  \n' +
            // '        get:\n' +
            // '          - path: "/getFoo"\n' +
            // '            to: "direct:foo"        \n' +
            // '          - path: "/getBar"\n' +
            // '            to: "direct:foo"    \n' +
            // '    - rest:\n' +
            // '        path: "/demo"\n' +
            // '        description: "REST API to demonstrate Karavan feature"\n' +
            // '        post:\n' +
            // '          - path: "/foo"\n' +
            // '            to: "direct:foo"\n' +
            // '          - path: "/bar"\n' +
            // '            to: "direct:bar"  \n' +
            // '        get:\n' +
            // '          - path: "/getFoo"\n' +
            // '            to: "direct:foo"        \n' +
            // '          - path: "/getBar"\n' +
            // '            to: "direct:foo"    \n' +
            // '    - from:\n' +
            // '        uri: \'direct:foo\'\n' +
            // '        steps:\n' +
            // '          - log: \'${body}\'\n' +
            // '          - log: \'${headers}\'\n' +
            // '          - setBody:\n' +
            // '              constant: "Hello world"  \n' +
            // '    - beans:\n' +
            // '      - name: datasource\n' +
            // '        type: org.apache.commons.dbcp2.BasicDataSource\n' +
            // '        properties:\n' +
            // '          driverClassName: org.postgresql.Driver\n' +
            // '          password: postgres\n' +
            // '          url: "jdbc:postgresql:localhost:5432:demo"\n' +
            // '          username: postgres\n'+
            // '      - name: myAggregatorStrategy \n' +
            // '        type: org.apache.camel.processor.aggregate.UseLatestAggregationStrategy\n' +
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
