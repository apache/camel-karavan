import React from 'react';
import {Button} from "@patternfly/react-core";
import {UseFormReturn} from "react-hook-form";

interface SideBarFormWrapperButtonsProps {
    formContext: UseFormReturn<any>; // Accepts any form context
    onSave?: (data: any) => void;
    onCancel?: () => void;
    onDelete?: () => void;
    showDelete?: boolean;
    isSubmitDisabled?: boolean;
}

export function SideBarFormWrapperButtons({
                                       formContext,
                                       onSave,
                                       onCancel,
                                       onDelete,
                                       showDelete = false,
                                       isSubmitDisabled = false,
                                   }: SideBarFormWrapperButtonsProps) {

    const {formState: {errors}, handleSubmit} = formContext;

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
                key="cancel"
                variant="link" // Standardized to "link" or "secondary" as you prefer
                onClick={onCancel}
            >
                Cancel
            </Button>
            <Button
                key="confirm"
                variant={"primary"}
                isDisabled={isDisabled}
                onClick={handleSubmit(onSave)}
            >
                Save
            </Button>
        </div>
    );
}