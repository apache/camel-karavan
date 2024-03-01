/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GridItem,
    FormGroup,
    InputGroup,
    InputGroupItem,
    TextInput,
    InputGroupText,
    ToggleGroup,
    ToggleGroupItem,
    capitalize,
    TextArea
} from "@patternfly/react-core";
import {useEffect, useState} from "react";
import '../karavan.css';
import './kamelet.css';

interface Props {
    label: string;
    type: string;
    span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    elementKey: string;
    value: any;
    isRequired: boolean;
    options?: string[];
    setValue: (value: string) => void;
}

export function KameletInput(props: Props) {

    const [inputValue, setInputValue] = useState(props.value)

    useEffect(()=> {
        const interval = setInterval(() => {
            if (props.value !== inputValue) {
                saveValue(inputValue);
            }
        }, 3000);
        return () => {
            clearInterval(interval)
        }
    }, [inputValue])

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
                               value={inputValue}/>
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getTextArea() {
        return (<InputGroup>
            <InputGroupItem isFill> <TextArea type="text" id={props.elementKey} name={props.elementKey} autoResize
                                              onChange={(_, value) => setInputValue(value)}
                                              onBlur={() => saveValue()}
                                              value={inputValue}/></InputGroupItem></InputGroup>)
    }

    function getIcon() {
        return (<InputGroup>
            <InputGroupText id="username">
                <svg className="icon">
                    <image href={props.value} className="icon"/>
                </svg>
            </InputGroupText>
            <InputGroupItem isFill>
                <TextInput className="text-field" type="text" id={props.elementKey} name={props.elementKey}
                           onChange={(_, value) => setInputValue(value)}
                           onBlur={() => saveValue()}
                           value={inputValue}/>
            </InputGroupItem>
        </InputGroup>);
    }

    function getToggleGroup() {
        return (<ToggleGroup aria-label={props.elementKey} id={props.elementKey} name={props.elementKey}>
            {props.options?.map((option: string) =>
                <ToggleGroupItem
                    key={option}
                    text={capitalize(option)}
                    buttonId="toggle-group-single-1"
                    isSelected={inputValue === option}
                    onChange={(_, selected) => {
                        setInputValue(option);
                        saveValue(option)
                    }}
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