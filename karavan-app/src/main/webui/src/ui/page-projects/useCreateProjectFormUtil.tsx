import React, {useState} from 'react';
import {Controller, FieldError, UseFormReturn,} from "react-hook-form";
import {
    Alert,
    Button,
    capitalize,
    Checkbox,
    Content,
    Flex,
    FormGroup,
    FormHelperText,
    FormSelect,
    FormSelectOption,
    HelperText,
    HelperTextItem,
    Switch,
    TextArea,
    TextInput,
    TextInputGroup,
    TextInputGroupMain,
    ToggleGroup,
    ToggleGroupItem,
} from "@patternfly/react-core";
import {EyeIcon, EyeSlashIcon} from "@patternfly/react-icons";
import {hasDigit, hasLowercase, hasMinimumLength, hasSpecialCharacter, hasUppercase} from "@utils/StringUtils";
import {SimpleSelect, TypeaheadSelect, TypeaheadSelectOption} from "@patternfly/react-templates";
import {SimpleSelectOption} from "@patternfly/react-templates/src/components/Select/SimpleSelect";
import {MonacoEditor} from "@shared/MonacoEditor";
import {useAppConfig} from "@compass/useConfig";

export function useCreateProjectFormUtil(formContext: UseFormReturn<any>) {

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const {isDev} = useAppConfig();

    function getError(error: FieldError | undefined) {
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
        } else return (<></>)
    }

    function getAlert(error: FieldError | undefined, variant?: 'success' | 'danger' | 'warning' | 'info' | 'custom') {
        if (error) {
            return <Alert variant={variant} isInline isPlain title={error.message}/>
        } else return (<></>)
    }

    function getHelper(text?: string) {
        if (text) {
            return (
                <FormHelperText>
                    <HelperText>
                        <HelperTextItem variant={'default'}>
                            {text}
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
            )
        } else return (<></>)
    }

    function getTextField(fieldName: string, label: string,
                          validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>,
                          type: | 'text' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url' = 'text',
                          onChange?: ((value: any) => void), hint?: string, onBlur?: () => void, readonly?: boolean, placeholder?: string)  {
        const {control, setValue, getValues, formState: {errors}} = formContext;
        const rules: any = {};
        if (validate !== undefined) {
            rules.required = "Required field";
        }
        if (validate) {
            rules.validate = validate;
        }
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired={validate !== undefined}>
                <Controller
                    rules={rules}
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                        <TextInput className="text-field"
                                   type={type}
                                   id={fieldName}
                                   ref={field?.ref}
                                   required={validate !== undefined}
                                   readOnly={readonly}
                                   value={getValues(fieldName) || ''}
                                   placeholder={placeholder}
                                   validated={errors[fieldName] ? 'error' : 'default'}
                                   onChange={(_, rawValue) => {
                                       field.onChange(rawValue);
                                       onChange?.(rawValue);
                                   }}
                                   onBlur={event => onBlur?.()}
                        />
                    )}
                />
                {getError((errors as any)[fieldName])}
                {getHelper(hint)}
            </FormGroup>
        )
    }

    function getTextFieldForId(fieldName: string, label: string, validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        const {control, getValues, formState: {errors}} = formContext;
        const rules: any = {};
        rules.required = "Required field";
        if (validate) {
            rules.validate = validate;
        }
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired={validate !== undefined}>
                <Controller
                    rules={rules}
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                        <TextInput className="text-field"
                                   type={"text"}
                                   id={fieldName}
                                   ref={field?.ref}
                                   required={validate !== undefined}
                                   value={getValues(fieldName) || ''}
                                   validated={errors[fieldName] ? 'error' : 'default'}
                                   onChange={(_, rawValue) => {
                                       const sanitizedValue = rawValue.replace(/[^a-zA-Z0-9]/g, '');
                                       field.onChange(sanitizedValue);
                                   }}
                        />
                    )}
                />
                {getError((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getTextFieldForApp(fieldName: string, label: string, validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        const {control, getValues, formState: {errors}} = formContext;
        const rules: any = {};
        rules.required = "Required field";
        if (validate) {
            rules.validate = validate;
        }
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired={validate !== undefined}>
                <Controller
                    rules={rules}
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                        <TextInput className="text-field"
                                   type={"text"}
                                   id={fieldName}
                                   ref={field?.ref}
                                   required={validate !== undefined}
                                   value={getValues(fieldName) || ''}
                                   validated={errors[fieldName] ? 'error' : 'default'}
                                   onChange={(_, rawValue) => {
                                       const sanitizedValue = rawValue
                                           .toLowerCase() // Force lower case
                                           .replace(/[^a-z0-9-]/g, '') // Remove everything except lowercase, numbers, and dashes
                                           .replace(/^[-0-9]+/, ''); // Remove any dashes or numbers that appear at the very start
                                       field.onChange(sanitizedValue);
                                   }}
                        />
                    )}
                />
                {getError((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getTextArea(fieldName: string, label: string, rows: number = 1, validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>) {
        const {setValue, getValues, control, formState: {errors}} = formContext;
        const rules: any = {};
        if (validate !== undefined) {
            rules.required = "Required field";
        }
        if (validate) {
            rules.validate = validate;
        }
        return (
            <FormGroup label={label} fieldId={fieldName} isRequired={validate !== undefined}>
                <Controller
                    rules={rules}
                    control={control}
                    name={fieldName}
                    render={() => (
                        <TextArea type="text"
                                  id={fieldName}
                                  rows={rows}
                                  value={getValues(fieldName) || ''}
                                  validated={errors[fieldName] ? 'error' : 'default'}
                            // ref={ref}
                                  onChange={(e, v) => {
                                      setValue(fieldName, v, {shouldValidate: true});
                                  }}
                                  autoResize
                        />
                    )}
                />
                {getError((errors as any)[fieldName])}
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
                        <div style={{display: 'flex'}}>
                            <TextInput className="text-field" type={showPassword ? "text" : "password"} id={fieldName}
                                       value={getValues(fieldName) || ''}
                                       validated={errors[fieldName] ? 'error' : 'default'}
                                       onChange={(_, v) => {
                                           setValue(fieldName, v, {shouldValidate: true});
                                       }}
                            />
                            <Button variant="control" onClick={e => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeIcon/> : <EyeSlashIcon/>}
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
                        <Content className='text-field-prefix' component='p'>{prefix}</Content>
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
                                       validated={errors[fieldName] ? 'error' : 'default'}
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
                    id={fieldName}
                    ouiaId={fieldName}
                    validated={errors[fieldName] ? 'error' : 'default'}
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

    function getTypeaheadSelect(fieldName: string, label: string, options: TypeaheadSelectOption[], readonly?: boolean, isCreatable?: boolean) {
        // 1. Destructure what you need. Note: register is needed to "register" the field logic,
        // but NOT to spread props onto the FormGroup.
        const { register, watch, setValue, formState: { errors } } = formContext;

        // 2. Register the field silently so RHF knows it exists (for validation/submit),
        // but don't attach the props to the UI component.
        React.useEffect(() => {
            register(fieldName);
        }, [register, fieldName]);

        const value = watch(fieldName);
        const initialOptions: TypeaheadSelectOption[] = options.map(o => ({
            ...o,
            value: o.value ?? '', // Ensure value is robust
            selected: o.value === value
        }));

        const isNewValue = (value !== null && value !== undefined && !initialOptions.find((option) => option.value === value));

        return (
            // [FIX]: Removed {...register(fieldName)} from here
            <FormGroup label={label} fieldId={fieldName}>
                <TypeaheadSelect
                    isDisabled={readonly}
                    // Key forces re-render if switching between known/new values (optional optimization)
                    key={fieldName}
                    id={fieldName}
                    ouiaId={fieldName}
                    initialOptions={initialOptions}
                    createOptionMessage={`New ${label} "${value}"`}
                    isCreatable={isCreatable}
                    isCreateOptionOnTop={true}
                    placeholder={`Select ${label}`}

                    // Handle text input changes (typing)
                    onInputChange={(newVal: string) => {
                        if (isCreatable) {
                            setValue(fieldName, newVal, { shouldValidate: false, shouldDirty: true });
                        }
                    }}

                    // Handle selection from the list
                    onSelect={(_ev, selection) => {
                        setValue(fieldName, selection, { shouldValidate: true, shouldDirty: true });
                    }}

                    // Handle pressing Enter to create a new tag
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                        if (isCreatable && event.key === 'Enter') {
                            event.preventDefault(); // Stop form submission
                            event.stopPropagation();
                            const inputVal = (event.target as HTMLInputElement).value;
                            setValue(fieldName, inputVal, { shouldValidate: true, shouldDirty: true });
                        }
                    }}
                />
                {/* Helper/Error display */}
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        );
    }

    function getTypeaheadSelectNotCreatable(fieldName: string, label: string, options: TypeaheadSelectOption[]) {
        const { register, watch, setValue, formState: { errors } } = formContext;
        React.useEffect(() => {
            register(fieldName);
        }, [register, fieldName]);

        const value = watch(fieldName);
        const initialOptions: TypeaheadSelectOption[] = options.map(o => ({
            ...o,
            value: o.value ?? '', // Ensure value is robust
            selected: o.value === value
        }));

        return (
            <FormGroup label={label} fieldId={fieldName}>
                <TypeaheadSelect
                    key={`${fieldName}-${value ?? 'empty'}`}
                    id={fieldName}
                    ouiaId={fieldName}
                    initialOptions={initialOptions}
                    placeholder={`Select ${label}`}
                    onSelect={(_ev, selection) => {
                        setValue(fieldName, selection, { shouldValidate: true, shouldDirty: true });
                    }}
                />
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        );
    }

    const ControlledSimpleSelect = ({
                                        fieldName,
                                        label,
                                        options,
                                        formContext
                                    }: {
        fieldName: string;
        label: string;
        options: SimpleSelectOption[];
        formContext: UseFormReturn<any>;
    }) => {
        const { register, watch, setValue, formState: { errors } } = formContext;

        React.useEffect(() => {
            register(fieldName);
        }, [register, fieldName]);

        const value = watch(fieldName);
        const initialOptions: SimpleSelectOption[] = options.map(o => ({
            ...o,
            value: o.value ?? '',
            selected: o.value === value
        }));

        return (
            <FormGroup label={label} fieldId={fieldName}>
                <SimpleSelect
                    toggleWidth={'100%'}
                    key={`${fieldName}-${value ?? 'empty'}`}
                    id={fieldName}
                    ouiaId={fieldName}
                    initialOptions={initialOptions}
                    placeholder={`Select ${label}`}
                    onSelect={(_ev, selection) => {
                        setValue(fieldName, selection, { shouldValidate: true, shouldDirty: true });
                    }}
                    isScrollable={true}
                    popperProps={{ position: 'end' }}
                />
                {/* Make sure getHelper is available here, or pass the error string directly */}
                {getHelper((errors as any)[fieldName])}
            </FormGroup>
        );
    };

    function getSimpleSelect(fieldName: string, label: string, options: SimpleSelectOption[]) {
        return (
            <ControlledSimpleSelect
                key={fieldName} // Important: gives React a stable identity
                fieldName={fieldName}
                label={label}
                options={options}
                formContext={formContext}
            />
        );
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

    function getCheckbox(fieldName: string, label: string) {
        const {watch, control, setValue, formState: {errors}} = formContext;
        const value = watch(fieldName)
        return (
            <FormGroup label={label} fieldId={fieldName} key={fieldName}>
                <Controller
                    control={control}
                    name={fieldName}
                    render={({ field }) => {
                        return (
                            <Checkbox id='exchangePattern'
                                      isChecked={value}
                                      onChange={(_, checked) => setValue(fieldName, checked, {shouldValidate: false})}
                            />
                        )
                    }}/>
            </FormGroup>
        )
    }

    function getToggleGroup(fieldName: string, label: string, options: string[], onChange?: (option: string, isSelected: boolean) => void) {
        const {control, formState: {errors}} = formContext;
        return (
            <FormGroup label={label} fieldId={fieldName}>
                <Controller
                    control={control}
                    name={fieldName}
                    render={({field}) => (
                        <ToggleGroup aria-label="ToggleGroup" className='combinations-toggle-group'>
                            {options.map((option) => {
                                return (
                                    <ToggleGroupItem
                                        key={option}
                                        text={capitalize(option)}
                                        isSelected={option === field.value}
                                        onChange={(_, isSelected) => {
                                            field.onChange(isSelected ? option : undefined);
                                            onChange?.(option, isSelected)
                                        }}
                                    />
                                )
                            })}
                        </ToggleGroup>
                    )}
                />
                {getError((errors as any)[fieldName])}
            </FormGroup>
        )
    }

    function getMonacoEditor(
        fieldName: string,
        language: string = 'markdown',
        height: string = '370px',
        onChange?: ((value: string | undefined) => void),
        validate?: ((value: string, formValues: any) => boolean | string) | Record<string, (value: string, formValues: any) => boolean | string>,
        onBlur?: () => void
    ) {
        const { control, setValue, getValues, formState: { errors } } = formContext;
        const rules: any = {};

        if (validate !== undefined) {
            rules.required = "Required field";
        }
        if (validate) {
            rules.validate = validate;
        }

        const hasError = !!errors[fieldName];

        return (
            <Controller
                rules={rules}
                control={control}
                name={fieldName}
                render={() => (
                    <div
                        className={`monaco-wrapper ${hasError ? 'has-error' : ''}`}
                        style={{
                            border: hasError
                                ? '1px solid var(--pf-v5-global--danger-color--100, #c9190b)'
                                : '1px solid var(--pf-v5-global--BorderColor--100, #d2d2d2)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            minHeight: 0
                        }}
                    >
                        <MonacoEditor
                            height={height} // Tells Monaco to fill the div
                            language={language}
                            value={getValues(fieldName) || ''}
                            onChange={(v) => {
                                setValue(fieldName, v, { shouldValidate: true });
                                onChange?.(v);
                            }}
                            onMount={(editor) => {
                                editor.onDidBlurEditorText(() => {
                                    onBlur?.();
                                });
                            }}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbersMinChars: 2,
                                automaticLayout: true, // Crucial for responsive resizing in a Drawer
                                readOnly: !isDev
                            }}
                        />
                    </div>
                )}
            />
        );
    }

    return {
        getFormSelect, getTextField, getSwitches, getTextFieldPrefix, getTextArea, getPasswordField, getTextFieldSuffix, getCheckbox, getSimpleSelect
    }
}
