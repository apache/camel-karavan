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
  Page, PageSection, Spinner,
} from "@patternfly/react-core";
import { KaravanDesigner } from "./designer/KaravanDesigner";
import vscode from "./vscode";
import { KameletApi } from "core/api/KameletApi";
import { ComponentApi } from "core/api/ComponentApi";
import { KameletsPage } from "./kamelets/KameletsPage";
import { ComponentsPage } from "./components/ComponentsPage";
import { EipPage } from "./eip/EipPage";

interface Props {
  dark: boolean
}

interface State {
  filename: string
  relativePath: string
  yaml: string
  key: string
  loaded: boolean
  interval?: NodeJS.Timer
  scheduledYaml: string
  hasChanges: boolean
  showStartHelp: boolean
  page: "designer" | "kamelets" | "components" | "eip" | "builder"
  active: boolean
  tab?: string
  files: string
}

class App extends React.Component<Props, State> {

  public state: State = {
    filename: '',
    relativePath: '',
    yaml: '',
    key: '',
    loaded: false,
    scheduledYaml: '',
    hasChanges: false,
    showStartHelp: false,
    page: "designer",
    active: false,
    files: '',
  };

  saveScheduledChanges = () => {
    console.log("saveScheduledChanges", this.state.active);
    if (this.state.active && this.state.hasChanges) {
      this.save(this.state.relativePath, this.state.scheduledYaml, false);
    }
  }

  componentDidMount() {
    window.addEventListener('message', this.onMessage, false);
    vscode.postMessage({ command: 'getData' });
    this.setState({ interval: setInterval(this.saveScheduledChanges, 2000) });
  }

  componentWillUnmount() {
    if (this.state.interval) clearInterval(this.state.interval);
    window.removeEventListener('message', this.onMessage, false);
  }

  onMessage = (event) => {
    const message = event.data;
    console.log("message.command", message.command);
    switch (message.command) {
      case 'kamelets':
        KameletApi.saveKamelets(message.kamelets, true);
        break;
      case 'components':
        ComponentApi.saveComponents(message.components, true);
        break;
      case 'showStartHelp':
        this.setState({ showStartHelp: message.showStartHelp });
        break;
      case 'open':
        if (this.state.filename === '' && this.state.key === '') {
          if (message.page !== "designer" && this.state.interval) clearInterval(this.state.interval);
          this.setState({
            page: message.page,
            filename: message.filename,
            yaml: message.yaml,
            scheduledYaml: message.yaml,
            relativePath: message.relativePath,
            key: Math.random().toString(),
            loaded: true,
            active: true,
            tab: message.tab
          });
        }
        break;
      case 'activate':
        this.setState({ loaded: false, filename: '', key: '', active: true, tab: message.tab });
        vscode.postMessage({ command: 'getData', reread: true });
        break;
      case 'deactivate':
        this.setState({ active: false, hasChanges: false });
        break;
    }
  };

  save(filename: string, yaml: string, propertyOnly: boolean) {
    if (this.state.active) {
      if (!propertyOnly) {
        vscode.postMessage({ command: 'save', filename: filename, relativePath: this.state.relativePath, yaml: yaml });
        this.setState({ scheduledYaml: yaml, hasChanges: false });
      } else {
        this.setState({ scheduledYaml: yaml, hasChanges: true });
      }
    }
  }

  disableStartHelp() {
    vscode.postMessage({ command: 'disableStartHelp' });
  }

  public render() {
    return (
      <Page className="karavan">
        {!this.state.loaded &&
          <PageSection variant={this.props.dark ? "dark" : "light"} className="loading-page">
            <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..." />
          </PageSection>
        }
        {this.state.loaded && this.state.page === "designer" &&
          <KaravanDesigner
            showStartHelp={this.state.showStartHelp}
            key={this.state.key}
            filename={this.state.filename}
            yaml={this.state.yaml}
            onSave={(filename, yaml, propertyOnly) => this.save(filename, yaml, propertyOnly)}
            onDisableHelp={this.disableStartHelp}
            tab={this.state.tab}
            dark={this.props.dark} />
        }
        {this.state.loaded && this.state.page === "kamelets" && <KameletsPage dark={this.props.dark} />}
        {this.state.loaded && this.state.page === "components" && <ComponentsPage dark={this.props.dark} />}
        {this.state.loaded && this.state.page === "eip" && <EipPage dark={this.props.dark} />}
      </Page>
    )
  }
}

export default App;
