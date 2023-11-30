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
    Bullseye,
    Button,
    Divider,
    Flex,
    FlexItem,
    Masthead,
    Page,
    PageSidebar,
    PageSidebarBody,
    Spinner,
    Tooltip,
} from "@patternfly/react-core";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {BlueprintIcon} from "@patternfly/react-icons";
import KnowledgebaseIcon from "@patternfly/react-icons/dist/js/icons/book-open-icon";
import TopologyIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import {KaravanIcon} from "./designer/icons/KaravanIcons";
import './designer/karavan.css';
import {DesignerPage} from "./DesignerPage";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {KnowledgebasePage} from "./knowledgebase/KnowledgebasePage";
import {Notification} from "./designer/utils/Notification";
import {EventBus} from "./designer/utils/EventBus";
import {TopologyTab} from "./topology/TopologyTab";
import {IntegrationFile} from "./topology/TopologyStore";

class MenuItem {
    pageId: string = '';
    tooltip: string = '';
    icon: any;

    constructor(pageId: string, tooltip: string, icon: any) {
        this.pageId = pageId;
        this.tooltip = tooltip;
        this.icon = icon;
    }
}

interface Props {
}

interface State {
    name: string
    yaml: string
    key: string
    loaded?: boolean,
    pageId: string,
}

class App extends React.Component<Props, State> {

    public state: State = {
        pageId: "designer",
        name: 'example.yaml',
        key: '',
        yaml: ''
    }

    componentDidMount() {
        Promise.all([
            fetch("kamelets/kamelets.yaml"),
            fetch("components/components.json"),
            fetch("snippets/org.apache.camel.AggregationStrategy"),
            fetch("snippets/org.apache.camel.Processor"),
            fetch("example/demo.camel.yaml")
            // fetch("example/aws-cloudwatch-sink.kamelet.yaml")
            // fetch("example/aws-s3-cdc-source.kamelet.yaml")
            // fetch("components/supported-components.json"),
        ]).then(responses =>
            Promise.all(responses.map(response => response.text()))
        ).then(data => {
            const kamelets: string[] = [];
            data[0].split("\n---\n").map(c => c.trim()).forEach(z => kamelets.push(z));
            KameletApi.saveKamelets(kamelets, true);

            const jsons: string[] = [];
            JSON.parse(data[1]).forEach((c: any) => jsons.push(JSON.stringify(c)));
            ComponentApi.saveComponents(jsons, true);

            this.setState({loaded: true});

            TemplateApi.saveTemplate("org.apache.camel.AggregationStrategy", data[2]);
            TemplateApi.saveTemplate("org.apache.camel.Processor", data[3]);

            if (data[4]) {
                this.setState({yaml: data[4], name: "demo.camel.yaml"})
                // this.setState({yaml: data[4], name: "aws-s3-cdc-source.kamelet.yaml"})
            }

            if (data[5]) {
                ComponentApi.saveSupportedComponents(data[4]);
                ComponentApi.setSupportedOnly(true);
            }
        }).catch(err =>
            EventBus.sendAlert("Error", err.text, 'danger')
        );
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        // console.log(yaml);
    }

    getSpinner() {
        return (
            <Bullseye className="loading-page">
                <Spinner className="progress-stepper"  diameter="80px" aria-label="Loading..."/>
            </Bullseye>
        )
    }

    pageNav = () => {
        const {pageId} = this.state;
        const pages: MenuItem[] = [
            new MenuItem("designer", "Designer", <BlueprintIcon/>),
            new MenuItem("topology", "Topology", <TopologyIcon/>),
            new MenuItem("knowledgebase", "Knowledgebase", <KnowledgebaseIcon/>),
        ]
        return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height: "100%"}}
                      spaceItems={{default: "spaceItemsNone"}}>
            <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                <Tooltip className="logo-tooltip" content={"Apache Camel Karavan"}
                         position={"right"}>
                    {KaravanIcon()}
                </Tooltip>
            </FlexItem>
            {pages.map(page =>
                <FlexItem key={page.pageId} className={pageId === page.pageId ? "nav-button-selected" : ""}>
                    <Tooltip content={page.tooltip} position={"right"}>
                        <Button id={page.pageId} icon={page.icon} variant={"plain"}
                                className={pageId === page.pageId ? "nav-button-selected" : ""}
                                onClick={event => this.setState({pageId: page.pageId})}
                        />
                    </Tooltip>
                </FlexItem>
            )}
            <FlexItem flex={{default: "flex_2"}} alignSelf={{default: "alignSelfCenter"}}>
                <Divider/>
            </FlexItem>
        </Flex>)
    }

    getIntegrationFiles(): IntegrationFile[]{
        return [new IntegrationFile("demo.camel.yaml", this.state.yaml)];
    }

    getPage() {
        const { name, yaml, pageId} = this.state;
        const dark = document.body.className.includes('vscode-dark');
        switch (pageId) {
            case "designer":
                return (
                    <DesignerPage
                        name={name}
                        yaml={yaml}
                        onSave={(filename, yaml1, propertyOnly) => this.save(filename, yaml1, propertyOnly)}
                        dark={dark}/>
                )
            case "knowledgebase":
                return (
                    <KnowledgebasePage dark={dark}/>
                )
            case "topology":
                return (
                    <TopologyTab
                        files={this.getIntegrationFiles()}
                        onSetFile={fileName => {}}
                        onClickCreateButton={() => {}}
                        hideToolbar={false}
                    />
                )
        }
    }

    getHeader = () => (
        <Masthead>
        </Masthead>
    );

    getSidebar = () => (
        <PageSidebar isSidebarOpen={true} id="fill-sidebar">
            <PageSidebarBody>Navigation</PageSidebarBody>
        </PageSidebar>
    );

    public render() {
        const {loaded} = this.state;
        return (
            <Page className="karavan">
                <Notification/>
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem>
                        {this.pageNav()}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        {loaded !== true && this.getSpinner()}
                        {loaded === true && this.getPage()}
                </FlexItem>
                </Flex>
            </Page>
        )
    }
}

export default App;
