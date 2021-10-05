import * as yaml from 'js-yaml';
import {
    Integration,
    CamelElement,
    ToStep,
    Otherwise,
    Expression,
    WhenStep,
    ChoiceStep,
    FilterStep, FromStep, MulticastStep,
} from "../model/CamelModel";
import {CamelApi} from "./CamelApi";

// TODO need to split and regroup functions here
export class CamelYaml {

    static integrationToYaml = (integration: Integration): string => {
        const clone: any = Object.assign({}, integration);
        const flows = integration.spec.flows
        clone.spec.flows = flows.map((f: any) => CamelYaml.cleanupElement(f));
        const i = JSON.parse(JSON.stringify(clone, null, 3)); // fix undefined in string attributes
        const text = yaml.dump(i);
        return text;
    }

    static cleanupElement = (element: CamelElement): CamelElement => {
        const result: any = Object.assign({}, element)
        if (result.dslName === 'expression'){
            delete result.language
        }
        delete result.uuid
        delete result.dslName
        Object.keys(result).forEach(key => {
            if (result[key] instanceof CamelElement) {
                result[key] = CamelYaml.cleanupElement(result[key])
            } else if (Array.isArray(result[key])) {
                result[key] = CamelYaml.cleanupElements(result[key])
            }
        })
        return result as CamelElement
    }

    static cleanupElements = (elements: CamelElement[]): CamelElement[] => {
        const result: any[] = []
        elements.forEach(element => {
            const newElement = CamelYaml.cleanupElement(element)
            result.push(newElement)
        })
        return result
    }

    static yamlToIntegration = (text: string): Integration => {
        const fromYaml: any = yaml.load(text);
        const int: Integration = new Integration({...fromYaml});
        const flows = int.spec.flows.map(f => CamelApi.createFrom(f))
        int.spec.flows = flows;
        return int;
    }

    static cloneIntegration = (integration: Integration): Integration => {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows = int.spec.flows.map(f => CamelApi.createFrom(f))
        int.spec.flows = flows;
        return int;
    }

    static cloneStep = (step: CamelElement): CamelElement => {
        const dslName = step.dslName.replace("Step", "");
        const clone = JSON.parse(JSON.stringify(step));
        return CamelApi.createStep(dslName, clone);
    }

    static demo = (): Integration => {
        const to0 = new ToStep({uri: 'log:demo0'});
        const to1 = new ToStep({uri: 'log:demo1'});
        const to2 = new ToStep({uri: 'log:demo2'});
        const to3 = new ToStep({uri: 'log:demo3'});
        const to4 = new ToStep({uri: 'log:demo4'});
        const to5 = new ToStep({uri: 'kamelet:ftp-sink', parameters:{host:'localhost', port:'8021'}});
        const direct1 = new ToStep({uri: 'direct1'});
        const direct2 = new ToStep({uri: 'direct2'});
        const direct3 = new ToStep({uri: 'direct3'});

        const otherwise = new Otherwise({steps: [to0]})
        const expression1 = new Expression({simple: '${body} == "hello"'});
        const when1 = new WhenStep({steps: [to1, to5], expression: expression1})
        const expression2 = new Expression({simple: '${body} == "hello"'});
        const when2 = new WhenStep({steps: [to2], expression: expression2})

        const choice = new ChoiceStep({otherwise: otherwise, when: [when1, when2]})

        const expression = new Expression({simple: '${body} == "hello"'});
        const filter = new FilterStep({expression: expression, steps:[to3, to4]})

        const multicast = new MulticastStep({steps:[direct1, direct2, direct3]})
        const from = new FromStep({uri: 'direct1', steps: [filter, multicast, choice]});
        const flows: FromStep[] = [from as FromStep];
        const int = new Integration({metadata: {name: "hello-world"}, spec: {flows: flows}});
        return int;
    }
}

