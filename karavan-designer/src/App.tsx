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
        ["http-secured-sink.kamelet.yaml",
        "http-secured-source.kamelet.yaml",
        "http-sink.kamelet.yaml",
        "http-source.kamelet.yaml",
        "insert-field-action.kamelet.yaml",
        "insert-header-action.kamelet.yaml",
        "kafka-not-secured-sink.kamelet.yaml",
        "kafka-not-secured-source.kamelet.yaml",
        "kafka-sink.kamelet.yaml",
        "kafka-source.kamelet.yaml"].forEach(name =>
            fetch("kamelets/" + name)
                .then((r) => r.text())
                .then(value => KameletApi.saveKamelets([value])));
    }

    save(name: string, yaml: string) {
        console.log(yaml);
    }

    public render() {
        return (
            <Page className="karavan">
                <KaravanDesigner key={this.state.key} name={this.state.name} yaml={this.state.yaml}
                                 onSave={(name, yaml) => this.save(name, yaml)}/>
            </Page>
        );
    }
}

export default App;
