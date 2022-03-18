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
            '    - rest:\n' +
            '        post:\n' +
            '          - to: direct:post\n' +
            '        path: /parcels\n' +
            '        consumes: application/json\n' +
            '        produces: application/json\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: direct:post\n' +
            '          steps:\n' +
            '            - log:\n' +
            '                message: \'Received: ${body}\'\n' +
            '            - multicast:\n' +
            '                steps:\n' +
            '                  - kamelet:\n' +
            '                      name: kafka-not-secured-sink\n' +
            '                      parameters:\n' +
            '                        topic: parcels\n' +
            '                        bootstrapServers: localhost:9092\n' +
            '                  - kamelet:\n' +
            '                      name: postgresql-sink\n' +
            '                      parameters:\n' +
            '                        serverName: localhost\n' +
            '                        serverPort: \'5432\'\n' +
            '                        username: postgres\n' +
            '                        password: postgres\n' +
            '                        databaseName: demo\n' +
            '                        query: >-\n' +
            '                          INSERT INTO parcels (id,address) VALUES\n' +
            '                          (:#id,:#address) ON CONFLICT (id)  DO NOTHING\n' +
            '                aggregationStrategy: >-\n' +
            '                  #class:org.apache.camel.processor.aggregate.UseOriginalAggregationStrategy\n' +
            '                parallelProcessing: false\n' +
            '                streaming: false\n' +
            '        id: post\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: kamelet:jms-apache-artemis-source\n' +
            '          steps:\n' +
            '            - to:\n' +
            '                uri: xj:identity\n' +
            '                parameters:\n' +
            '                  transformDirection: XML2JSON\n' +
            '            - kamelet:\n' +
            '                name: kafka-not-secured-sink\n' +
            '                parameters:\n' +
            '                  topic: payments\n' +
            '                  bootstrapServers: localhost:9092\n' +
            '          parameters:\n' +
            '            destinationType: queue\n' +
            '            destinationName: payments\n' +
            '            brokerURL: tcp://localhost:61616\n' +
            '        id: payment\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: kamelet:kafka-not-secured-source\n' +
            '          steps:\n' +
            '            - log:\n' +
            '                message: \'Aggegating: ${body}\'\n' +
            '            - unmarshal:\n' +
            '                json:\n' +
            '                  library: jackson\n' +
            '            - aggregate:\n' +
            '                steps:\n' +
            '                  - choice:\n' +
            '                      when:\n' +
            '                        - expression:\n' +
            '                            groovy:\n' +
            '                              expression: >-\n' +
            '                                body.find { it.containsKey(\'status\') }.status ==\n' +
            '                                \'confirmed\'\n' +
            '                          steps:\n' +
            '                            - marshal:\n' +
            '                                json:\n' +
            '                                  library: jackson\n' +
            '                            - log:\n' +
            '                                message: \'Send to MQTT : ${body}\'\n' +
            '                            - kamelet:\n' +
            '                                name: mqtt-sink\n' +
            '                                parameters:\n' +
            '                                  topic: deliveries\n' +
            '                                  brokerUrl: tcp://localhost:1883\n' +
            '                      otherwise:\n' +
            '                        steps:\n' +
            '                          - setBody:\n' +
            '                              expression:\n' +
            '                                groovy:\n' +
            '                                  expression: \'body.find { it.containsKey(\'\'status\'\') } \'\n' +
            '                          - marshal:\n' +
            '                              json:\n' +
            '                                library: jackson\n' +
            '                          - log:\n' +
            '                              message: \'Send to database: ${body}\'\n' +
            '                          - kamelet:\n' +
            '                              name: postgresql-sink\n' +
            '                              parameters:\n' +
            '                                serverName: localhost\n' +
            '                                serverPort: \'5432\'\n' +
            '                                username: postgres\n' +
            '                                password: postgres\n' +
            '                                databaseName: demo\n' +
            '                                query: >-\n' +
            '                                  UPDATE parcels set status = \'CANCELED\' WHERE\n' +
            '                                  id = :#id\n' +
            '                aggregationStrategy: aggregator\n' +
            '                completionSize: 2\n' +
            '                correlationExpression:\n' +
            '                  groovy:\n' +
            '                    expression: body.get(\'id\')\n' +
            '          parameters:\n' +
            '            topic: parcels,payments\n' +
            '            bootstrapServers: localhost:9092\n' +
            '            autoCommitEnable: true\n' +
            '            consumerGroup: postman\n' +
            '        id: aggregator\n' +
            '    - route:\n' +
            '        from:\n' +
            '          uri: kamelet:mqtt-source\n' +
            '          steps:\n' +
            '            - log:\n' +
            '                message: \'Delivery: ${body}\'\n' +
            '          parameters:\n' +
            '            topic: deliveries\n' +
            '            brokerUrl: tcp://localhost:1883\n' +
            '    - beans:\n' +
            '        - name: aggregator\n' +
            '          type: org.apache.camel.processor.aggregate.GroupedBodyAggregationStrategy\n' +
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
        // console.log(yaml);
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
