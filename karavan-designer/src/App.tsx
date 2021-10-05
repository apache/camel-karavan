import * as React from "react";
import {
  Page,
} from "@patternfly/react-core";
import {KaravanDesigner} from "./designer/ui/KaravanDesigner";
import {KameletApi} from "./designer/api/KameletApi";

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

  }

  save(name: string, yaml: string) {
    console.log(yaml);
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
