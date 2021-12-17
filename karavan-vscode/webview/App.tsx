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
import { ComponentApi } from "../designer/api/ComponentApi";

interface Props {
  dark: boolean
}

interface State {
  filename: string
  yaml: string
  key: string
}

class App extends React.Component<Props, State> {

  public state: State = {
    filename: '',
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
        case 'components':
          ComponentApi.saveComponents(message.components);
          break;  
        case 'open':
          if (this.state.filename === '' && this.state.key === ''){
            this.setState({filename: message.filename, yaml: message.yaml, key: Math.random().toString()});
          }
          break;
      }
    });
  }

  save(filename: string, yaml: string) {
    vscode.postMessage({
      command: 'save',
      filename: filename,
      yaml: yaml
    })
  }

  public render() {
    return (
      <Page className="karavan">
         <KaravanDesigner 
          key={this.state.key} 
          filename={this.state.filename} 
          yaml={this.state.yaml} 
          onSave={(filename, yaml) => this.save(filename, yaml)}
          borderColor="#fca338"
          borderColorSelected="#fee3c3"
          dark={this.props.dark}
         />
      </Page>
    );
  }
}

export default App;
