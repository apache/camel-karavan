import {useState} from 'react';
import {ErrorResponse} from "./ErrorResponse";
import {Error} from "./Error";
import {AxiosError} from "axios";

export function useResponseErrorHandler(errorResponseToFormFields: Map<string, string>, setError: any) {
    const [globalErrors, setGlobalErrors] = useState<string[]>([]);

    function registerResponseErrors(axiosError: AxiosError) {
        const errorResponse: ErrorResponse = axiosError.response?.data as ErrorResponse;
        // Register field errors if field errors were returned
        if (errorResponse.errors) {
            // Reset global error
            setGlobalErrors([]);

            // Register all field errors
            errorResponse.errors?.forEach((error: Error) => {
                // If field name was found in mapping table, register it to the form error
                if (errorResponseToFormFields.get(error.field)) {
                    setError(errorResponseToFormFields.get(error.field), {
                        type: 'custom',
                        message: error.message
                    });
                }
                // If field name was not found in mapping table, register it to the global error
                else {
                    // Make copy as state shouldn't be mutated
                    setGlobalErrors(prevGlobalErrors => [...prevGlobalErrors, error.message]);
                }
            });
        }
        // Register global error if no field errors were returned
        else {
            setGlobalErrors([errorResponse.message]);
        }
    }

    function resetGlobalErrors() {
        setGlobalErrors([]);
    }

    return [globalErrors, registerResponseErrors, resetGlobalErrors] as const;
}
