import React, {Component} from "react";
import Tour, {StepType, TourProvider, useTour, withTour} from "@reactour/tour";
import {EventBus} from "./utils/EventBus";
import {TextContent, TextVariants, Title, Text, Button} from "@patternfly/react-core";
import ArrowIcon from "@patternfly/react-icons/dist/js/icons/arrow-right-icon";
import CloseIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {FromDefinition} from "karavan-core/lib/model/CamelDefinition";


function getContent(text: string, title?: string){
    return (
        <div>
            {title && <Title headingLevel="h3">{title}</Title>}
            <TextContent>
                <Text component={TextVariants.p}>
                    {text}
                </Text>
                <Text component={TextVariants.blockquote}>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <div>Follow the tour by clicking</div>
                        <ArrowIcon style={{margin: "auto"}}/>
                        <div>button</div>
                    </div>
                </Text>
            </TextContent>
        </div>
    )
}

const STEPS: Map<string, any[]> = new Map([
    ['routes', [
        {selector: '[data-tour="routes"]', content: getContent("Create a route from MQTT to Kafka for messages with header 'approved' equals to 'true'", "Tour use case")},
        {selector: '[data-tour="add-route"]', content: getContent("Click button to add new route")},
        {selector: '[data-tour="selector-tabs"]', content: getContent("Select Source Kamelet")},
        {selector: '[data-tour="mqtt-source"]', content: getContent("Click on MQTT Source")},
        {selector: '[data-tour="route-created"]', content: getContent("Route created")},
        {selector: '[data-tour="FromDefinition-icon"]', content: getContent("Click on MQTT Source icon to select")},
        {selector: '[data-tour="properties"]', content: getContent("Set MQTT Source broker and topic")},
        {highlightedSelectors: ['[data-tour="topic"]', '[data-tour="brokerUrl"]'], content: getContent("MQTT Source broker and topic are set")},
        {selector: '[data-tour="add-step"]', content: getContent("Click button to add step")},
        {selector: '[data-tour="selector-tabs"]', content: getContent("Select Integration Pattern")},
        {selector: '[data-tour="filter"]', content: getContent("Click on Filter")},
        {selector: '[data-tour="FilterDefinition"]', content: getContent("Filter added")},
        {selector: '[data-tour="properties"]', content: getContent("Set Filter expression")},
        {selector: '[data-tour="expression"]', content: getContent("Filter expression is set")},
        {selector: '[data-tour="add-step"]', content: getContent("Click button to add step")},
        {selector: '[data-tour="selector-tabs"]', content: getContent("Select source Kamelet")},
        {selector: '[data-tour="kafka-not-secured-sink"]', content: getContent("Click on Kafka Sink")},
        {selector: '[data-tour="ToDefinition"]', content: getContent("Kafka Sink added")},
        {selector: '[data-tour="properties"]', content: getContent("Set Kafka Sink bootstrap servers and topic")},
        {highlightedSelectors: ['[data-tour="topic"]', '[data-tour="bootstrapServers"]'], content: getContent("Kafka Sink bootstrap servers and topic are set")},
        {selector: '[data-tour="route-created"]', content: getContent("Route filtered messages from MQTT to Kafka is done", "Tour use case")},
        {
            selector: '[data-tour="route-created"]', content:
                <div>
                    <Title headingLevel="h3">Tour use case:</Title>
                    <TextContent>
                        <Text component={TextVariants.p}>
                            Route from MQTT to Kafka for messages with header 'approved' equals to 'true' created
                        </Text>
                        <Text component={TextVariants.blockquote} size={14}>
                            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                                <div>Close the tour by clicking</div>
                                <CloseIcon style={{margin: "auto"}}/>
                                <div>button</div>
                            </div>
                        </Text>
                    </TextContent>
                </div>
        },
    ]],
    ['rest', []],
]);


interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    showTour: boolean
    tab: string
    onClose: () => void
}

interface State {
    showTour: boolean
    steps: any[]
    currentStep: number
}

export class KaravanTour extends React.Component<Props, State> {

    public state: State = {
        showTour: this.props.showTour,
        currentStep: 0,
        steps: STEPS.get(this.props.tab) || []
    }

    setCurrentStep(step: number) {
        if (step > this.state.currentStep) {
            switch (this.props.tab) {
                case "routes":
                    this.routeSteps(step);
            }
            setTimeout(() => { this.setState({ currentStep: step }); }, 0);
        }
    }

    routeSteps(step: number) {
        switch (step) {
            case 2:
                EventBus.sendTourEvent("routes", "openSelector", "kamelet");
                break;
            case 4:
                const route = CamelDefinitionApi.createRouteDefinition({from: new FromDefinition({uri: "kamelet:mqtt-source"})});
                const i = CamelDefinitionApiExt.addStepToIntegration(this.props.integration, route, '');
                const clone = CamelUtil.cloneIntegration(i);
                this.props.onSave?.call(this, clone, true);
                EventBus.sendTourEvent("routes", "closeSelector");
                break;
            case 6:
                const from = this.props.integration.spec.flows?.[0].from;
                EventBus.sendTourEvent("routes", "selectElement", undefined, from);
                break;
            case 7:
                const mqtt = this.props.integration.spec.flows?.[0].from;
                mqtt.parameters.brokerUrl = "tcp://localhost:1883";
                mqtt.parameters.topic = "topic1";
                const i2 = CamelDefinitionApiExt.updateIntegrationRouteElement(this.props.integration, mqtt);
                const clone2 = CamelUtil.cloneIntegration(i2);
                this.props.onSave?.call(this, clone2, true);
                break;
            case 9:
                EventBus.sendTourEvent("routes", "openSelector", "routing");
                break;
            case 11:
                const filter = CamelDefinitionApi.createFilterDefinition({});
                const from3 = this.props.integration.spec.flows?.[0].from;
                const i3 = CamelDefinitionApiExt.addStepToIntegration(this.props.integration, filter, from3.uuid);
                const clone3 = CamelUtil.cloneIntegration(i3);
                this.props.onSave?.call(this, clone3, true);
                EventBus.sendTourEvent("routes", "closeSelector", undefined, filter);
                break;
            case 12:
                const filter0 = this.props.integration.spec.flows?.[0].from.steps[0];
                EventBus.sendTourEvent("routes", "selectElement", undefined, filter0);
                break;
            case 13:
                const filter1 = this.props.integration.spec.flows?.[0].from.steps[0];
                filter1.expression = CamelDefinitionApi.createExpressionDefinition({simple: CamelDefinitionApi.createSimpleExpression({expression: "${header.approved} != 'true'"})});
                const i4 = CamelDefinitionApiExt.updateIntegrationRouteElement(this.props.integration, filter1);
                const clone4 = CamelUtil.cloneIntegration(i4);
                this.props.onSave?.call(this, clone4, true);
                break;
            case 15:
                EventBus.sendTourEvent("routes", "openSelector", "kamelet");
                break;
            case 17:
                const kafka = CamelDefinitionApi.createToDefinition({uri: "kamelet:kafka-not-secured-sink"});
                const filter2 = this.props.integration.spec.flows?.[0].from.steps[0];
                const i5 = CamelDefinitionApiExt.addStepToIntegration(this.props.integration, kafka, filter2.uuid);
                const clone5 = CamelUtil.cloneIntegration(i5);
                this.props.onSave?.call(this, clone5, true);
                EventBus.sendTourEvent("routes", "closeSelector", undefined, kafka);
                EventBus.sendTourEvent("routes", "selectElement", undefined, kafka);
                break;
            case 19:
                const kafka1 = this.props.integration.spec.flows?.[0].from.steps[0].steps[0];
                kafka1.parameters.bootstrapServers = "localhost:9092"
                kafka1.parameters.topic = "topic1"
                const i6 = CamelDefinitionApiExt.updateIntegrationRouteElement(this.props.integration, kafka1);
                const clone6 = CamelUtil.cloneIntegration(i6);
                this.props.onSave?.call(this, clone6, true);
                EventBus.sendTourEvent("routes", "selectElement", undefined, kafka1);
                break;
            case 21:
                this.props.onSave?.call(this, this.props.integration, true);
                this.close();
                break;
        }
    }

    close() {
        this.props.onClose?.call(this);
    }

    render() {
        return (
            <Tour
                scrollSmooth={true}
                currentStep={this.state.currentStep}
                setIsOpen={value => {}}
                disabledActions={false}
                setCurrentStep={value => this.setCurrentStep(value as number)}
                setDisabledActions={value => {}}
                setSteps={value => {}}
                steps={this.state.steps}
                isOpen={this.state.showTour}
                badgeContent={b => `${b.currentStep + 1}/${b.totalSteps}`}
                onClickHighlighted={e => e.stopPropagation()}
                disableInteraction
                // disableKeyboardNavigation
                // disableDotsNavigation
                // disableFocusLock
                onClickClose={clickProps => this.close()}
                prevButton={props => props.setIsOpen(false)}
            >
            </Tour>
        )
    }
}

export default KaravanTour;