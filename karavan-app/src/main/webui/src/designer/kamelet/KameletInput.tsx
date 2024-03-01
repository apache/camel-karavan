import { GridItem, FormGroup, InputGroup, InputGroupItem, TextInput, InputGroupText, ToggleGroup, ToggleGroupItem, capitalize, TextArea } from "@patternfly/react-core";
import { useState } from "react";
import '../karavan.css';
import './kamelet.css';

export function KameletInput(props: any) {
    const [inputValue, setInputValue] = useState(props.value)
    function saveValue(value?: string) {
        props.setValue(value ? value : inputValue);
    }

    function getTextField() {
        return (
            <InputGroup>
                <InputGroupItem isFill>
                    <TextInput className="text-field" type="text" id={props.elementKey} name={props.elementKey}
                        onChange={(_, value) => setInputValue(value)}
                        onBlur={() => saveValue()}
                        value={inputValue} />
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getTextArea() {
        return (<InputGroup>
            <InputGroupItem isFill> <TextArea type="text" id={props.elementKey} name={props.elementKey} autoResize
                onChange={(_, value) => setInputValue(value)}
                onBlur={() => saveValue()}
                value={inputValue} /></InputGroupItem></InputGroup>)
    }

    function getIcon() {
        return (<InputGroup>
            <InputGroupText id="username">
                <svg className="icon">
                    <image href={props.value} className="icon" />
                </svg>
            </InputGroupText>
            <InputGroupItem isFill>
                <TextInput className="text-field" type="text" id={props.elementKey} name={props.elementKey}
                    onChange={(_, value) => setInputValue(value)}
                    onBlur={() => saveValue()}
                    value={inputValue} />
            </InputGroupItem>
        </InputGroup>);
    }

    function getToggleGroup() {
        return (<ToggleGroup aria-label={props.elementKey} id={props.elementKey} name={props.elementKey}>
            {props.options.map((option: string) =>
                <ToggleGroupItem
                    key={option}
                    text={capitalize(option)}
                    buttonId="toggle-group-single-1"
                    isSelected={inputValue === option}
                    onChange={(_, selected) => { setInputValue(option); saveValue(option) }}
                />
            )}
        </ToggleGroup>)
    }

    return (
        <GridItem span={props.span}>
            <FormGroup label={props.label} fieldId={props.elementKey} isRequired={props.isRequired}>
                {props.type === 'text' && getTextField()}
                {props.type === 'icon' && getIcon()}
                {props.type === 'toggle' && getToggleGroup()}
                {props.type === 'textArea' && getTextArea()}
            </FormGroup>
        </GridItem>
    )
}