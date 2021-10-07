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
import {KaravanDesigner} from "../designer/ui/KaravanDesigner";
import vscode from "./vscode";
import {KameletApi} from "../designer/api/KameletApi";

interface Props {
}

interface State {
  name: string
  yaml: string
  key: string
}

class App extends React.Component<Props, State> {

  public state: State = {
    name: '',
    yaml: '',
    key: ''
  };


  componentDidMount() {
    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent
      switch (message.command) {
        case 'kamelets':
          KameletApi.saveKamelets(message.kamelets);
          break;
        case 'open':
          if (this.state.name === '' && this.state.key === ''){
            this.setState({name: message.name, yaml: message.yaml, key: Math.random().toString()});
          }
          break;
      }
    });
  }

  save(name: string, yaml: string) {
    vscode.postMessage({
      command: 'save',
      name: name,
      yaml: yaml
    })
  }

  public render() {
    return (
      <Page className="karavan">
         <KaravanDesigner key={this.state.key} name={this.state.name} yaml={this.state.yaml} onSave={(name, yaml) => this.save(name, yaml)}/>
      </Page>
    );
  }
}

export default App;
