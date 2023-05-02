import React from 'react';
import {
    CodeBlockAction, CodeBlockCode, CodeBlock, Button, Skeleton, Banner, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import {LogViewer} from '@patternfly/react-log-viewer';
import {Subscription} from "rxjs";
import {ProjectEventBus} from "./ProjectEventBus";
import {Project} from "./ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import {SsoApi} from "../api/SsoApi";

interface Props {

}

interface State {
    showLog: boolean,
}

export class ProjectLog extends React.Component<Props, State> {

    public state: State = {
        showLog: false
    }

    sub?: Subscription;

    componentDidMount() {
        this.sub = ProjectEventBus.onShowLog()?.subscribe((logName: String) => {
            this.setState({showLog: true});
        });
    }

    componentWillUnmount() {
        this.sub?.unsubscribe();
    }

    code = "apiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docsapiVersion: helm.openshift.io/v1beta1/\n" +
        "kind: HelmChartRepository\n" +
        "metadata:\n" +
        "name: azure-sample-repo0oooo00ooo\n" +
        "spec:\n" +
        "connectionConfig:\n" +
        "url: https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs"

    getButtons() {
        return (<div className="buttons">
            <Button variant="plain" onClick={event => {
            }} icon={<ExpandIcon/>}/>
            <Button variant="plain" onClick={() =>this.setState({showLog: false})} icon={<CloseIcon/>}/>
        </div>);
    }

    render() {
        const {showLog} = this.state;
        return (showLog ? <LogViewer hasLineNumbers={false}
                           header={this.getButtons()}
                           height={300}
                           data={this.code}
                           theme={'dark'}/> : <></>);
    }
}
