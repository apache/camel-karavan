package org.apache.camel.karavan.shared.error;

import java.util.Collection;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private final Date timestamp;
    private final int status;
    private final String error;
    private final String message;
    private Collection<Error> errors;

    public ErrorResponse(
            int httpStatus,
            String reasonPhrase,
            String message
    ) {
        this.timestamp = new Date();
        this.status = httpStatus;
        this.error = reasonPhrase;
        this.message = message;
    }

    public ErrorResponse(
            int httpStatus,
            String reasonPhrase,
            String message,
            Collection<Error> errors
    ) {
        this.timestamp = new Date();
        this.status = httpStatus;
        this.error = reasonPhrase;
        this.message = message;
        this.errors = errors;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public Collection<Error> getErrors() {
        return errors;
    }
}