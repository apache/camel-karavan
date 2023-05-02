import React from 'react';
import {Button, Checkbox, PageSection, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import ScrollIcon from '@patternfly/react-icons/dist/esm/icons/scroll-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import {LogViewer} from '@patternfly/react-log-viewer';
import {Subscription} from "rxjs";
import {ProjectEventBus, ShowLogCommand} from "./ProjectEventBus";
import {findDOMNode} from "react-dom";

interface Props {

}

interface State {
    showLog: boolean,
    height?: number | string,
    logViewerRef: any,
    isTextWrapped: boolean
}

export class ProjectLog extends React.Component<Props, State> {

    public state: State = {
        showLog: false,
        height: "30%",
        logViewerRef: React.createRef(),
        isTextWrapped: false
    }

    sub?: Subscription;

    componentDidMount() {
        this.sub = ProjectEventBus.onShowLog()?.subscribe((log: ShowLogCommand) => {
            this.setState({showLog: true});
        });
    }

    componentWillUnmount() {
        this.sub?.unsubscribe();
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (this.state.height === "100%" && prevState.height !== "100%") {
            const element = findDOMNode(this.state.logViewerRef.current)
            console.log("change", element)
            console.log("change", this.state.logViewerRef.current)
        }
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
        const {height, isTextWrapped, logViewerRef} = this.state;
        return (<div className="buttons">
            <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped} id="wrap-text-checkbox"
                      onChange={checked => this.setState({isTextWrapped: checked})} />
            <Tooltip content={"Scroll to bottom"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => logViewerRef.current.scrollToBottom()} icon={<ScrollIcon/>}/>
            </Tooltip>
            <Tooltip content={height === "100%" ? "Collapse": "Expand"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => {
                    const h = height === "100%" ? "30%" : "100%";
                    this.setState({height: h, showLog: true});
                }} icon={height === "100%" ? <CollapseIcon/> : <ExpandIcon/>}/>
            </Tooltip>
            <Button variant="plain" onClick={() => this.setState({height: "30%", showLog: false})} icon={<CloseIcon/>}/>
        </div>);
    }

    render() {
        const {showLog, height, logViewerRef, isTextWrapped} = this.state;
        console.log(this.state)
        return (showLog ?
            <PageSection className="project-log" padding={{default: "noPadding"}} style={{height: height}}>
                <LogViewer
                    isTextWrapped={isTextWrapped}
                    innerRef={logViewerRef}
                    hasLineNumbers={false}
                    loadingContent={"Loading..."}
                    header={this.getButtons()}
                    height={"100vh"}
                    data={this.code.concat(this.code).concat(this.code).concat(this.code)}
                    theme={'dark'}/>
            </PageSection>
            : <></>);
    }
}
