import React from 'react';
import {Button, Form} from "@patternfly/react-core";
import {UseFormReturn} from "react-hook-form";

interface AsyncFormWrapperProps {
    children: React.ReactNode;
    formContext: UseFormReturn<any>; // Accepts any form context
    selectedId: string | null;
    onSave?: (data: any) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    showDelete?: boolean;
    isSubmitDisabled?: boolean;
    footer?: React.ReactNode;
}

export function SideBarFormWrapper({
                                       children,
                                       formContext,
                                       selectedId,
                                       onSave,
                                       onCancel,
                                       onDelete,
                                       showDelete = false,
                                       isSubmitDisabled = false,
                                       footer
                                   }: AsyncFormWrapperProps) {

    const {formState: {errors}, handleSubmit, getValues} = formContext;

    function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit(onSave)();
        }
    }

    // Common Footer Logic
    function getFooter() {
        const isDisabled = Object.getOwnPropertyNames(errors).length > 0 || isSubmitDisabled;
        return (
            <div style={{display: "flex", flexDirection: "row", gap: 8, justifyContent: "space-between", marginTop: 16}}>
                <div style={{flexGrow: 1}}>
                    {showDelete &&
                        <Button
                            key="delete"
                            variant={"danger"}
                            isDanger
                            isDisabled={isDisabled}
                            onClick={onDelete}
                        >
                            Delete
                        </Button>
                    }
                </div>
                <Button
                    key="confirm"
                    variant={"primary"}
                    isDisabled={isDisabled}
                    onClick={handleSubmit(onSave)}
                >
                    Save
                </Button>
                <Button
                    key="cancel"
                    variant="link" // Standardized to "link" or "secondary" as you prefer
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        )
    }

    return (
        <Form isHorizontal={true} autoComplete="off" noValidate onKeyDown={onKeyDown}>
            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
                {children}
            </div>
            {footer || getFooter()}
        </Form>
    );
}