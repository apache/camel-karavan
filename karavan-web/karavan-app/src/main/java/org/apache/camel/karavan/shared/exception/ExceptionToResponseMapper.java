package org.apache.camel.karavan.shared.exception;

import java.util.Collection;
import java.util.List;

import org.apache.camel.karavan.shared.error.Error;
import org.apache.camel.karavan.shared.error.ErrorResponse;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestResponse;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

public class ExceptionToResponseMapper {
    private static final Logger LOGGER = Logger.getLogger(ExceptionToResponseMapper.class.getName());

    @ServerExceptionMapper
    public RestResponse<Object> validationException(ValidationException exception) {
        List<Error> errors = (exception).getErrors()
                .stream()
                .map(fieldError -> new Error(fieldError.getField(), fieldError.getMessage()))
                .toList();

        return logAndBuildResponse(
                exception,
                Response.Status.BAD_REQUEST.getStatusCode(),
                Response.Status.BAD_REQUEST.getReasonPhrase(),
                errors
        );
    }

    private RestResponse<Object> logAndBuildResponse(
            Throwable exception,
            int status,
            String reasonPhrase,
            Collection<Error> errors
    ) {
        LOGGER.error("Error occurred", exception);

        String cause = (exception.getCause() != null) ? exception.getCause().getMessage() : null;
        String message = (cause != null) ? exception.getMessage() + ", caused by: " + cause : exception.getMessage();

        if (message == null) {
            message = exception.getClass().toString();
        }

        // Hide errors array if there are no errors and leave just error message
        if (errors != null && errors.isEmpty()) {
            errors = null;
        }

        ErrorResponse responseBody = new ErrorResponse(
                status,
                reasonPhrase,
                message,
                errors
        );

        return RestResponse.ResponseBuilder
                .create(status)
                .entity(responseBody)
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
