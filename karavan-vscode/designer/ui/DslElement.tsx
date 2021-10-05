import React from 'react';
import {
    Text, Tooltip,
} from '@patternfly/react-core';
import '../karavan.css';
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {CamelElement, Otherwise, ProcessorStep, WhenStep} from "../model/CamelModel";
import {CamelApi} from "../api/CamelApi";
import {CamelUi} from "../api/CamelUi";
import { EventBus } from "../api/EventBus";
import {DslPath} from "./DslPath";

interface Props {
    step: CamelElement,
    deleteElement: any
    selectElement: any
    openSelector: any
    selectedUuid: string
}

interface State {
    step: CamelElement,
    element: CamelElement,
    showSelector: boolean
    tabIndex: string | number
    selectedUuid: string
}

export class DslElement extends React.Component<Props, State> {

    public state: State = {
        step: this.props.step,
        element: this.props.step.dslName === 'otherwise' ? this.props.step : CamelApi.elementFromStep(this.props.step),
        showSelector: false,
        tabIndex: 0,
        selectedUuid: this.props.selectedUuid
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.selectedUuid !== this.props.selectedUuid) {
            this.setState({selectedUuid: this.props.selectedUuid});
        }
    }

    openSelector = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.openSelector.call(this, this.state.step.uuid, this.state.element.dslName)
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    delete = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.deleteElement.call(this, this.state.step.uuid);
    }

    selectElement = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        this.props.selectElement.call(this, this.state.step);
    }

    isSelected = (): boolean => {
        return this.state.selectedUuid === this.state.step.uuid
    }

    getSteps = (): ProcessorStep[] => {
        return (this.state.element as any).steps
    }

    getWhens = (): WhenStep[] => {
        return (this.state.element as any).when
    }

    getOtherwise = (): Otherwise => {
        return (this.state.element as any).otherwise
    }

    horizontal = (): boolean => {
        return ['choice', 'multicast'].includes(this.state.element.dslName);
    }

    isRoot = (): boolean => {
        return this.state.step.dslName.startsWith("from");
    }

    render() {
        return (
            <div className="step-element"
                 style={{
                     borderWidth: this.isSelected() ? "2px" : "1px",
                     marginTop: this.isRoot() ? "16px" : "",
                     zIndex: this.state.step.dslName === 'toStep' ? 20 : 10
                 }}
                 onClick={event => this.selectElement(event)}
                 ref={el => {
                     if (el && (this.state.step.dslName === 'fromStep' || this.state.step.dslName === 'toStep')) EventBus.sendPosition(this.state.step, el.getBoundingClientRect());
                 }}
            >
                <div className="header">
                    <img draggable={false}
                         src={CamelUi.getIcon(this.state.element)}
                         className="icon" alt="icon">
                    </img>
                    <Text>{CamelUi.getTitle(this.state.element)}</Text>
                    <button type="button" aria-label="Delete" onClick={e => this.delete(e)}
                            className="delete-button">
                        <DeleteIcon noVerticalAlign/>
                    </button>
                </div>
                <div className={this.state.element.dslName}>
                    {this.state.element.hasSteps() &&
                    <div className="steps" style={this.horizontal() ? {display: "flex", flexDirection: "row"} : {}}>
                        {this.getSteps().map((step, index) => (
                            <div key={step.uuid} style={this.horizontal() ? {marginRight: (index < this.getSteps().length - 1) ? "6px" : "0"} :{}}>
                                <DslElement
                                    openSelector={this.props.openSelector}
                                    deleteElement={this.props.deleteElement}
                                    selectElement={this.props.selectElement}
                                    selectedUuid={this.state.selectedUuid}
                                    step={step}/>
                                {index < this.getSteps().length - 1 && !this.horizontal() &&
                                <img className={"arrow-down"} alt="arrow"
                                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' x='0' y='0' viewBox='0 0 512 512' style='enable-background:new 0 0 512 512' xml:space='preserve' class=''%3E%3Cg transform='matrix(1,0,0,1,1.7053025658242404e-13,1.1368683772161603e-13)'%3E%3Cg xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M374.108,373.328c-7.829-7.792-20.492-7.762-28.284,0.067L276,443.557V20c0-11.046-8.954-20-20-20 c-11.046,0-20,8.954-20,20v423.558l-69.824-70.164c-7.792-7.829-20.455-7.859-28.284-0.067c-7.83,7.793-7.859,20.456-0.068,28.285 l104,104.504c0.006,0.007,0.013,0.012,0.019,0.018c7.792,7.809,20.496,7.834,28.314,0.001c0.006-0.007,0.013-0.012,0.019-0.018 l104-104.504C381.966,393.785,381.939,381.121,374.108,373.328z' fill='%23e97826' data-original='%23000000' style='' class=''%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E"
                                />
                                }
                            </div>
                        ))}
                    </div>
                    }
                    {this.state.element.hasSteps() &&
                    <Tooltip position={"bottom"}
                             content={<div>{"Add element to " + CamelUi.getTitle(this.state.element)}</div>}>
                        <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                                className="add-button">
                            <AddIcon noVerticalAlign/>
                        </button>
                    </Tooltip>
                    }
                    {this.state.element.dslName === 'choice' &&
                    <Tooltip position={"bottom"} content={<div>{"Add element to Choice"}</div>}>
                        <button type="button" aria-label="Add" onClick={e => this.openSelector(e)}
                                className="add-button">
                            <AddIcon noVerticalAlign/>
                        </button>
                    </Tooltip>
                    }
                    {this.state.element.dslName === 'choice' &&
                    <div className="whens" style={this.horizontal() ? {display: "flex", flexDirection: "row"} : {}}>
                        {this.getWhens().map((when, index) => (
                            <div key={when.uuid} style={{marginLeft: (index !== 0) ? "6px" : "0"}}>
                                <DslElement
                                    openSelector={this.props.openSelector}
                                    deleteElement={this.props.deleteElement}
                                    selectElement={this.props.selectElement}
                                    selectedUuid={this.state.selectedUuid}
                                    step={when}/>
                            </div>
                        ))}
                        {this.getOtherwise() &&
                            <div key={this.getOtherwise().uuid} style={{marginLeft: (this.getWhens().length > 0) ? "6px" : "0"}}>
                                <DslElement
                                    openSelector={this.props.openSelector}
                                    deleteElement={this.props.deleteElement}
                                    selectElement={this.props.selectElement}
                                    selectedUuid={this.state.selectedUuid}
                                    step={this.getOtherwise()}/>
                            </div>
                        }
                    </div>
                    }
                </div>
            </div>
        );
    }
}