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
import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";

interface Props {
  dark: boolean
}

interface State {
  filename: string
  relativePath: string
  yaml: string
  key: string
  loaded: boolean
}

class App extends React.Component<Props, State> {

  public state: State = {
    filename: '',
    relativePath: '',
    yaml: '',
    key: '',
    loaded: false,
  };


  componentDidMount() {
    window.addEventListener('message', this.onMessage, false);
    vscode.postMessage({ command: 'getData' })
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.onMessage, false);
  }

  onMessage = (event) => {
    const message = event.data;
    console.log("Message received", message);
    switch (message.command) {
      case 'kamelets':
        console.log("Kamelets saving");
        KameletApi.saveKamelets(message.kamelets);
        console.log("Kamelets saved");
        break;
      case 'components':
        console.log("Components saving");
        ComponentApi.saveComponents(message.components);
        console.log("Components saved");
        break;
      case 'open':
        console.log(event);
        if (this.state.filename === '' && this.state.key === '') {
          this.setState({ filename: message.filename, yaml: message.yaml, relativePath: message.relativePath, key: Math.random().toString(), loaded: true });
        }
        break;
    }
  };

  save(filename: string, yaml: string) {
    vscode.postMessage({
      command: 'save',
      filename: filename,
      relativePath: this.state.relativePath,
      yaml: yaml
    })
  }

  public render() {
    return (
      <Page className="karavan">
        {!this.state.loaded &&
          <PageSection variant={this.props.dark ? "dark" : "light"} className="loading-page">
            <Spinner  className="progress-stepper" isSVG diameter="80px" aria-label="Loading..."/>
          </PageSection>
        }
        {this.state.loaded &&
          <KaravanDesigner
            key={this.state.key}
            filename={this.state.filename}
            yaml={this.state.yaml}
            onSave={(filename, yaml) => this.save(filename, yaml)}
            borderColor="rgb(239, 166, 79)"
            borderColorSelected="rgb(171, 172, 224)"
            dark={this.props.dark} />
        }
      </Page>
    )
  }
}

export default App;
