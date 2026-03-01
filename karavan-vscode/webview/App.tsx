/*
 * Licensed to the Apache Software Foundation (ASF) xunder one or more
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
  Content,
  Page, PageSection, Spinner
} from "@patternfly/react-core";
import vscode from "./vscode";
import { KameletApi } from "@karavan-core/api/KameletApi";
import { ComponentApi } from "@karavan-core/api/ComponentApi";
import { TemplateApi } from "@karavan-core/api/TemplateApi";
import { BeanFactoryDefinition } from "@karavan-core/model/CamelDefinition";
import { IntegrationFile } from "@karavan-core/model/IntegrationDefinition";
import { TopologyTab } from "@features/project/project-topology/TopologyTab";
import { DocumentationPage } from "@features/documentation/DocumentationPage";
import { KaravanDesigner } from "@features/project/designer/KaravanDesigner";
import { EventBus } from "@features/project/designer/utils/EventBus";
import {ProjectFunctionHook} from "@app/navigation/ProjectFunctionHook";
import {ProjectProvider} from "@features/project/ProjectContext";

interface Props {
}

interface State {
  filename: string
  relativePath: string
  fullPath: string
  yaml: string
  key: string
  loaded: boolean
  loadingMessages: string[]
  interval?: NodeJS.Timeout
  scheduledYaml: string
  hasChanges: boolean
  page: "designer" | "knowledgebase" | 'topology'
  active: boolean
  tab?: "routes" | "rest" | "beans"
  files: IntegrationFile[],
  propertyPlaceholders: [string, string][],
  beans: BeanFactoryDefinition[]
}

class App extends React.Component<Props, State> {

  public state: State = {
    filename: '',
    relativePath: '',
    fullPath: '',
    yaml: '',
    key: '',
    loaded: false,
    loadingMessages: [],
    scheduledYaml: '',
    hasChanges: false,
    page: "designer",
    active: false,
    files: [],
    propertyPlaceholders: [],
    beans: []
  };

  saveScheduledChanges = () => {
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
        KameletApi.saveCustomKamelets(message.kamelets, true);
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("Kamelets loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
      case 'components':
        ComponentApi.saveComponents(message.components, true);
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("Components loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
      case 'supportedComponents':
        ComponentApi.saveSupportedComponents(message.components);
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("Supported Components loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
      case 'supportedOnly':
        ComponentApi.setSupportedOnly(true);
        break;
      case 'files':
        this.saveIntegrationFiles(message.files);
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("Integrations loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
      case 'templates':
        const templates = message.templates;
        const map = new Map(Object.keys(templates).map(key => [key, templates[key]]));
        TemplateApi.saveTemplates(map, true);
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("Templates loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
      case 'javaCode':
        const javaCode = message.javaCode;
        const javaCodeMap = new Map(Object.keys(javaCode).map(key => [key, javaCode[key]]));
        TemplateApi.saveJavaCodes(javaCodeMap, true);
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
            fullPath: message.fullPath,
            key: Math.random().toString(),
            loaded: true,
            active: true,
            tab: message.tab,
            propertyPlaceholders: message.propertyPlaceholders,
            beans: message.beans
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
      case 'downloadImage':
        EventBus.sendCommand("downloadImage");
        break;
      case 'blockList':
        const blockList = message.blockList;
        const blockListMap = new Map(Object.keys(blockList).map(key => [key, blockList[key]])).forEach((list, key) => {
          if (key === 'components-blocklist.txt') {
            ComponentApi.saveBlockedComponentNames(list.split(/\r?\n/));
          }
          else if (key === 'kamelets-blocklist.txt') {
            KameletApi.saveBlockedKameletNames(list.split(/\r?\n/));
          }
        });
        this.setState((prevState: State) => {
          prevState.loadingMessages.push("block lists loaded");
          return { loadingMessages: prevState.loadingMessages }
        });
        break;
    }
  };

  save(filename: string, yaml: string, propertyOnly: boolean) {
    if (this.state.active) {
      if (!propertyOnly) {
        vscode.postMessage({ command: 'save', filename: filename, relativePath: this.state.relativePath, fullPath: this.state.fullPath, code: yaml });
        this.setState({ scheduledYaml: yaml, hasChanges: false });
      } else {
        this.setState({ scheduledYaml: yaml, hasChanges: true });
      }
    }
  }

  saveJavCode(name: string, code: string) {
    TemplateApi.saveJavaCode(name, code);
    vscode.postMessage({ command: 'saveCode', name: name, yamlFullPath: this.state.fullPath, yamFileName: this.state.filename, code: code });
  }

  savePropertyPlaceholder(key: string, value: string) {
    vscode.postMessage({ command: 'savePropertyPlaceholder', key: key, value: value });
  }

  saveIntegrationFiles(files: any) {
    const f = Object.keys(files).map(key => new IntegrationFile(key, files[key]));
    this.setState({ files: f });
  }

  onchangeBlockedList(type: string, name: string, checked: boolean) {
    let fileContent = '';
    if (type === "component") {
      fileContent = ComponentApi.saveBlockedComponentName(name, checked).join('\n');
    } else {
      fileContent = KameletApi.saveBlockedKameletName(name, checked).join('\n');
    }
    vscode.postMessage({ command: 'saveBlockedList', key: type, value: fileContent });
  }

  public render() {
    const { loadingMessages, filename, key, yaml, page, loaded, tab } = this.state;
    return (
      <div className="karavan">
        {!loaded &&
          <PageSection className="loading-page">
            <Bullseye>
              <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..." />
              {/* {loadingMessages.map(message => <Text component={TextVariants.h5}>{message}</Text>)} */}
              <Content component={'h5'}>Loading...</Content>
            </Bullseye>
          </PageSection>
        }
        {loaded && page === "designer" &&
          <KaravanDesigner
            showCodeTab={false}
            key={key}
            filename={filename}
            yaml={yaml}
            onSave={(filename, yaml, propertyOnly) => this.save(filename, yaml, propertyOnly)}
            tab={tab}
            onSaveCustomCode={(name, code) => this.saveJavCode(name, code)}
            onGetCustomCode={(name, javaType) => {
              let code = TemplateApi.getJavaCode(name);
              if (code === undefined || code.length === 0) code = TemplateApi.generateCode(javaType, name);
              return new Promise<string | undefined>(resolve => resolve(code))
            }}
            propertyPlaceholders={this.state.propertyPlaceholders}
            onSavePropertyPlaceholder={(key, value) => this.savePropertyPlaceholder(key, value)}
            beans={this.state.beans}
            onInternalConsumerClick={(uri, name, routeId, fileName) => {
              vscode.postMessage({ command: 'internalConsumerClick', uri: uri, name: name, routeId: routeId, fileName: fileName });
            }}
            files={this.state.files.map(f => new IntegrationFile(f.name, f.code))}
            onCreateNewFile={() => { }}
            onCreateNewRoute={() => { }}
          />
        }
        {loaded && page === "knowledgebase" &&
          <DocumentationPage />
        }
        {loaded && page === "topology" &&
          <ProjectProvider useProjectHook={ProjectFunctionHook}>
            <TopologyTab asyncApiJson={undefined}/>
          </ProjectProvider>
        }
      </div>
    )
  }
}

export default App;
