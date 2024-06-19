import React, {useState} from 'react';
import {
    Controller,
    FieldError,
    UseFormReturn,
} from "react-hook-form";
import {
    Button,
    Flex,
    FormGroup,
    FormHelperText,
    FormSelect,
    FormSelectOption,
    HelperText,
    HelperTextItem, Switch, Text, TextArea,
    TextInput, TextInputGroup, TextInputGroupMain, TextVariants
} from "@patternfly/react-core";
import "./form-util.css"
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import {hasDigit, hasLowercase, hasMinimumLength, hasSpecialCharacter, hasUppercase} from "./StringUtils";

export function useFormUtil(formContext: UseFormReturn<any>) {

    const [showPassword, setShowPassword] = useState<boolean>(false);

    function getHelper(error: FieldError | undefined) {
        if (error) {
            return (
                <FormHelperText>
                    <HelperText>
                        <HelperTextItem variant={'error'}>
                            {error.message}
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
            )
        }
    }

    function getTextField(fieldName: string, label: string,
                          validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>,
                          type: | 'text' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url' = 'text') {
        const {control, setValue, getValues, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <Controller
                    rules={{required: "Required field", validate: validate}}
                    control={control}
                    name={fieldName}
                    render={() => (
                        <TextInput className="text-field" type={type} id={fieldName}
                                   value={getValues(fieldName)}
                                   validated={!!errors[fieldName] ? 'error' : 'default'}
                                   onChange={(_, v) => {
                                       setValue(fieldName, v, {shouldValidate: true});
                                   }}
                        />
                    )}
                />
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getTextArea(fieldName: string, label: string, validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        const {setValue, getValues, control, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <Controller
                    rules={{required: "Required field", validate: validate}}
                    control={control}
                    name={fieldName}
                    render={() => (
                        <TextArea type="text"
                                  id={fieldName}
                                  value={getValues(fieldName)}
                                  validated={!!errors[fieldName] ? 'error' : 'default'}
                            // ref={ref}
                                  onChange={(e, v) => {
                                      setValue(fieldName, v, {shouldValidate: true});
                                  }}
                                  autoResize
                        />
                    )}
                />
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getPasswordField(fieldName: string, label: string, validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        validate = {
            length: v => hasMinimumLength(v) || 'Password should be at least 8 characters',
            lower: v => hasLowercase(v) || 'Password should have at least one lowercase letter',
            upper: v => hasUppercase(v) || 'Password should have at least one uppercase letter',
            digit: v => hasDigit(v) || 'Password should have at least one digit',
            special: v => hasSpecialCharacter(v) || 'Password should have at least one special character',
        }
        const {control, setValue, getValues, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <Controller
                    rules={{required: "Required field", validate: validate}}
                    control={control}
                    name={fieldName}
                    render={() => (
                        <div style={{display:'flex'}}>
                            <TextInput className="text-field" type={showPassword ? "text" : "password"} id={fieldName}
                                       value={getValues(fieldName)}
                                       validated={!!errors[fieldName] ? 'error' : 'default'}
                                       onChange={(_, v) => {
                                           setValue(fieldName, v, {shouldValidate: true});
                                       }}
                            />
                            <Button variant="control" onClick={e => setShowPassword(!showPassword)}>
                                {showPassword ? <ShowIcon/> : <HideIcon/>}
                            </Button>
                        </div>
                    )}
                />
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getTextFieldPrefix(fieldName: string, label: string, prefix: string,
                                required: boolean,
                                validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        const {setValue, getValues, register, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <TextInputGroup>
                    <TextInputGroupMain className="text-field-with-prefix" type="text" id={fieldName}
                                        value={getValues(fieldName)}
                                        {...register(fieldName, {
                                            required: (required ? "Required field" : false),
                                            validate: validate
                                        })}
                                        onChange={(e, v) => {
                                            setValue(fieldName, v, {shouldValidate: true});
                                        }}
                    >
                        <Text className='text-field-prefix' component={TextVariants.p}>{prefix}</Text>
                    </TextInputGroupMain>
                </TextInputGroup>
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getTextFieldSuffix(fieldName: string, label: string, suffix: string,
                          validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>,
                          type: | 'text' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url' = 'text') {
        const {control, setValue, getValues, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <Controller
                    rules={{required: "Required field", validate: validate}}
                    control={control}
                    name={fieldName}
                    render={() => (
                        <div style={{display: 'flex'}}>
                            <TextInput className="form-util-text-field" type={type} id={fieldName}
                                       value={getValues(fieldName)}
                                       validated={!!errors[fieldName] ? 'error' : 'default'}
                                       onChange={(_, v) => {
                                           setValue(fieldName, v, {shouldValidate: true});
                                       }}
                            />
                            <TextInput className="form-util-text-field-suffix" id={fieldName + ':suffix'} value={suffix} isDisabled/>
                        </div>
                    )}
                />
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getFormSelect(fieldName: string, label: string, options: [string, string][]) {
        const {register, watch, setValue, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired>
                <FormSelect
                    ouiaId={fieldName}
                    validated={!!errors[fieldName] ? 'error' : 'default'}
                    value={watch(fieldName)}
                    {...register(fieldName, {required: "Required field"})}
                    onChange={(e, v) => {
                        setValue(fieldName, v, {shouldValidate: true});
                    }}
                    name={fieldName}

                >
                    <FormSelectOption key='placeholder' value={undefined} label='Select one' isDisabled/>
                    {options.map((option, index) => (
                        <FormSelectOption key={index} value={option[0]} label={option[1]}/>
                    ))}
                </FormSelect>
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getSwitches(fieldName: string, label: string, options: [string, string][]) {
        const {watch, register, getValues, setValue, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired {...register(fieldName)}>
                <Flex direction={{default: 'column'}}>
                    {options.map((option, index) => {
                        const key = option[0];
                        const label = option[0];
                        return (<Switch
                            id={key}
                            label={label}
                            labelOff={label}
                            isChecked={watch(fieldName) !== undefined && watch(fieldName).includes(key)}
                            onChange={(e, v) => {
                                const vals: string[] = watch(fieldName);
                                const idx = vals.findIndex(x => x === key);
                                if (idx > -1 && !v) {
                                    vals.splice(idx, 1);
                                    setValue(fieldName, [...vals]);
                                } else if (idx === -1 && v) {
                                    vals.push(key);
                                    setValue(fieldName, [...vals]);
                                }
                            }}
                            ouiaId={option[0]}
                        />)
                    })}
                </Flex>
            </FormGroup>
        )
    }

    return {getFormSelect, getTextField, getSwitches, getTextFieldPrefix, getTextArea, getPasswordField, getTextFieldSuffix}
}

