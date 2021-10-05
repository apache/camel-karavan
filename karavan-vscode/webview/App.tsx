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
