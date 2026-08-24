import React from 'react';
import {Form} from "@patternfly/react-core";
import {UseFormReturn} from "react-hook-form";
import {SideBarFormWrapperButtons} from "@shared/ui/SideBarFormWrapperButtons";

interface AsyncFormWrapperProps {
    children: React.ReactNode;
    formContext: UseFormReturn<any>; // Accepts any form context
    onSave?: (data: any) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    showDelete?: boolean;
    isSubmitDisabled?: boolean;
    footer?: React.ReactNode;
    saveOnEnter?: boolean;
    className?: string;
}

export function SideBarFormWrapper({
                                       children,
                                       formContext,
                                       onSave,
                                       onCancel,
                                       onDelete,
                                       showDelete = false,
                                       isSubmitDisabled = false,
                                       footer,
                                       saveOnEnter = true,
                                       className
                                   }: AsyncFormWrapperProps) {

    const { handleSubmit} = formContext;

    function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit(onSave)();
        }
    }

    return (
        <div style={{display: "flex", flexDirection: "column", gap: 0, justifyContent: 'space-between', flex: 1}} className={className}>
            <Form isHorizontal={true} autoComplete="off" noValidate onKeyDown={saveOnEnter ? onKeyDown : undefined}>
                {children}
            </Form>
            {footer ||
                <SideBarFormWrapperButtons
                    formContext={formContext}
                    isSubmitDisabled={isSubmitDisabled}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onSave={onSave}
                    showDelete={showDelete}
                />
            }
        </div>
    );
}