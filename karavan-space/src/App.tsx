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
    Alert,
    AlertActionCloseButton, AlertGroup,
    Bullseye, Button, Divider, Flex, FlexItem,
    Page, Spinner, Tooltip,
} from "@patternfly/react-core";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {KameletsPage} from "./kamelets/KameletsPage";
import {ComponentsPage} from "./components/ComponentsPage";
import {EipPage} from "./eip/EipPage";
import {BlueprintIcon} from "@patternfly/react-icons";
import KameletsIcon from "@patternfly/react-icons/dist/js/icons/registry-icon";
import EipIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import {KaravanIcon} from "./designer/utils/KaravanIcons";
import './designer/karavan.css';
import {SpacePage} from "./space/SpacePage";
import {GithubModal} from "./space/GithubModal";
import {Subscription} from "rxjs";
import {AlertMessage, SpaceBus} from "./space/SpaceBus";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";

class ToastMessage {
    id: string = ''
    text: string = ''
    title: string = ''
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';

    constructor(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') {
        this.id = Date.now().toString().concat(Math.random().toString());
        this.title = title;
        this.text = text;
        this.variant = variant;
    }
}

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
    githubModalIsOpen: boolean,
    pageId: string,
    alerts: ToastMessage[],
    sub?: Subscription
}

class App extends React.Component<Props, State> {

    public state: State = {
        pageId: "designer",
        alerts: [],
        name: 'example.yaml',
        key: '',
        yaml: '',
        githubModalIsOpen: false
    }

    toast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => {
        const mess = [];
        mess.push(...this.state.alerts, new ToastMessage(title, text, variant));
        this.setState({alerts: mess})
    }

    deleteErrorMessage = (id: string) => {
        this.setState({alerts: this.state.alerts.filter(a => a.id !== id)})
    }

    componentDidMount() {
        const sub = SpaceBus.onAlert()?.subscribe((evt: AlertMessage) => this.toast(evt.title, evt.message, evt.variant));
        this.setState({sub: sub});
        Promise.all([
            fetch("kamelets/kamelets.yaml"),
            fetch("components/components.json"),
            fetch("snippets/org.apache.camel.AggregationStrategy"),
            fetch("snippets/org.apache.camel.Processor")
        ]).then(responses =>
            Promise.all(responses.map(response => response.text()))
        ).then(data => {
            const kamelets: string[] = [];
            data[0].split("\n---\n").map(c => c.trim()).forEach(z => kamelets.push(z));
            KameletApi.saveKamelets(kamelets, true);
            this.toast("Success", "Loaded " + kamelets.length + " kamelets", 'success');

            const components: [] = JSON.parse(data[1]);
            const jsons: string[] = [];
            components.forEach(c => jsons.push(JSON.stringify(c)));
            ComponentApi.saveComponents(jsons, true);

            this.toast("Success", "Loaded " + jsons.length + " components", 'success');
            this.setState({loaded: true, key: Math.random().toString()});

            TemplateApi.saveTemplate("org.apache.camel.AggregationStrategy", data[2]);
            TemplateApi.saveTemplate("org.apache.camel.Processor", data[3]);
        }).catch(err =>
            this.toast("Error", err.text, 'danger')
        );
    }

    componentWillUnmount() {
        this.state.sub?.unsubscribe();
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        this.setState({name: filename, yaml: yaml});
        // console.log(yaml);
    }

    closeGithubModal() {
        this.setState({githubModalIsOpen: false})
    }

    openGithubModal() {
        this.setState({githubModalIsOpen: true, key: Math.random().toString()});
    }

    getSpinner() {
        return (
            <Bullseye className="loading-page">
                <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..."/>
            </Bullseye>
        )
    }

    pageNav = () => {
        const {pageId} = this.state;
        const pages: MenuItem[] = [
            new MenuItem("designer", "Designer", <BlueprintIcon/>),
            new MenuItem("eip", "Enterprise Integration Patterns", <EipIcon/>),
            new MenuItem("kamelets", "Kamelets", <KameletsIcon/>),
            new MenuItem("components", "Components", <ComponentsIcon/>),
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

    getDesigner() {
        const {name, yaml, pageId} = this.state;
        const dark = document.body.className.includes('vscode-dark');
        switch (pageId) {
            case "designer":
                return (
                    <SpacePage
                        name={name}
                        yaml={yaml}
                        onSave={(filename, yaml1, propertyOnly) => this.save(filename, yaml1, propertyOnly)}
                        onPush={type => this.openGithubModal()}
                        dark={dark}/>
                )
            case "kamelets":
                return (
                    <KameletsPage dark={dark}/>
                )
            case "components":
                return (
                    <ComponentsPage dark={dark}/>
                )
            case "eip":
                return (
                    <EipPage dark={dark}/>
                )
        }
    }

    render() {
        const {loaded, githubModalIsOpen, yaml, name} = this.state;
        return (
            <Page className="karavan">
                <AlertGroup isToast isLiveRegion>
                    {this.state.alerts.map((e: ToastMessage) => (
                        <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title}
                               timeout={e.variant === "success" ? 1000 : 5000}
                               onTimeout={() => this.deleteErrorMessage(e.id)}
                               actionClose={<AlertActionCloseButton onClose={() => this.deleteErrorMessage(e.id)}/>}>
                            {e.text}
                        </Alert>
                    ))}
                </AlertGroup>
                <>
                    <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                          alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                        <FlexItem>
                            {this.pageNav()}
                        </FlexItem>
                        <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                            {loaded !== true && this.getSpinner()}
                            {loaded === true && this.getDesigner()}
                            {loaded === true && githubModalIsOpen &&
                                <GithubModal yaml={yaml} filename={name} isOpen={githubModalIsOpen} onClose={this.closeGithubModal}/>}
                        </FlexItem>
                    </Flex>
                </>
            </Page>
        )
    }
}

export default App;
