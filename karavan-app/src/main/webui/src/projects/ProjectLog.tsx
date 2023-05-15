import React from 'react';
import {Button, Checkbox, Label, PageSection, Text, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../designer/karavan.css';
import CloseIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import ScrollIcon from '@patternfly/react-icons/dist/esm/icons/scroll-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import CleanIcon from '@patternfly/react-icons/dist/esm/icons/trash-alt-icon';
import {LogViewer} from '@patternfly/react-log-viewer';
import {Subscription} from "rxjs";
import {ProjectEventBus, ShowLogCommand} from "./ProjectEventBus";

const INITIAL_LOG_HEIGHT = "50%";

interface Props {

}

interface State {
    log?: ShowLogCommand,
    showLog: boolean,
    height?: number | string,
    logViewerRef: any,
    isTextWrapped: boolean
    autoScroll: boolean
    data: string,
    currentLine: number
}

export class ProjectLog extends React.Component<Props, State> {

    public state: State = {
        showLog: false,
        height: INITIAL_LOG_HEIGHT,
        logViewerRef: React.createRef(),
        isTextWrapped: true,
        autoScroll: true,
        data: '',
        currentLine: 0
    }
    eventSource?: EventSource;
    sub?: Subscription;

    componentDidMount() {
        this.eventSource?.close();
        this.sub = ProjectEventBus.onShowLog()?.subscribe((log: ShowLogCommand) => {
            this.setState({showLog: log.show, log: log, data: ''});
            if (log.show) {
                this.showLogs(log.type, log.name, log.environment);
            } else {
                this.eventSource?.close();
            }
        });
    }

    componentWillUnmount() {
        this.eventSource?.close();
        this.sub?.unsubscribe();
    }

    showLogs = (type: 'container' | 'pipeline', name: string, environment: string) => {
        this.eventSource?.close();
        this.eventSource = new EventSource("/api/logwatch/"+type+"/"+environment+"/"+name, { withCredentials: true });
        this.eventSource.onerror = (event) => {
            this.eventSource?.close();
        }
        this.eventSource.onmessage = (event) => {
            this.setState((state: Readonly<State>) => {
                const data = state.data.concat('\n').concat(event.data)
                return {data: data, currentLine: this.state.currentLine + 1}
            });
            if (this.state.autoScroll) {
                this.state.logViewerRef.current.scrollToBottom();
            }
        };
    }

    getButtons() {
        const {height, isTextWrapped, logViewerRef, log, data, autoScroll} = this.state;
        return (<div className="buttons">
            <Label className="log-name">{log?.type + ": " + log?.name}</Label>
            <Tooltip content={"Clean log"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => this.setState({data: ''})} icon={<CleanIcon/>}/>
            </Tooltip>
            <Checkbox label="Wrap text" aria-label="wrap text checkbox" isChecked={isTextWrapped} id="wrap-text-checkbox"
                      onChange={checked => this.setState({isTextWrapped: checked})} />
            <Checkbox label="Autoscroll" aria-label="autoscroll checkbox" isChecked={autoScroll} id="autoscroll-checkbox"
                      onChange={checked => this.setState({autoScroll: checked})} />
            <Tooltip content={"Scroll to bottom"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => logViewerRef.current.scrollToBottom()} icon={<ScrollIcon/>}/>
            </Tooltip>
            <Tooltip content={height === "100%" ? "Collapse": "Expand"} position={TooltipPosition.bottom}>
                <Button variant="plain" onClick={() => {
                    const h = height === "100%" ? INITIAL_LOG_HEIGHT : "100%";
                    this.setState({height: h, showLog: true, data: data.concat(' ')});
                }} icon={height === "100%" ? <CollapseIcon/> : <ExpandIcon/>}/>
            </Tooltip>
            <Button variant="plain" onClick={() => {
                this.eventSource?.close();
                this.setState({height: INITIAL_LOG_HEIGHT, showLog: false, data: '', currentLine: 0});
            }} icon={<CloseIcon/>}/>
        </div>);
    }

    render() {
        const {showLog, height, logViewerRef, isTextWrapped, data, currentLine} = this.state;
        return (showLog ?
            <PageSection className="project-log" padding={{default: "noPadding"}} style={{height: height}}>
                <LogViewer
                    isTextWrapped={isTextWrapped}
                    innerRef={logViewerRef}
                    hasLineNumbers={false}
                    loadingContent={"Loading..."}
                    header={this.getButtons()}
                    height={"100vh"}
                    data={data}
                    // scrollToRow={currentLine}
                    theme={'dark'}/>
            </PageSection>
            : <></>);
    }
}
