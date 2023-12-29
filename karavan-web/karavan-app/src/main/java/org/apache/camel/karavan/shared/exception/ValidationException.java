package org.apache.camel.karavan.shared.exception;

import java.util.Collection;
import java.util.List;

import org.apache.camel.karavan.shared.validation.ValidationError;

public class ValidationException extends RuntimeException {
    private final transient Collection<ValidationError> errors;

    public ValidationException(String message, Collection<ValidationError> errors) {
        super(message);
        this.errors = errors;
    }

    public ValidationException(String message, ValidationError error) {
        super(message);
        this.errors = List.of(error);
    }

    public ValidationException(String message) {
        super(message);
        this.errors = List.of();
    }

    public ValidationError getFirstErrorOrNull() {
        return errors.stream().findFirst().orElse(null);
    }

    public Collection<ValidationError> getErrors() {
        return errors;
    }

    @Override
    public String toString() {
        return "ValidationException{" +
                "errors=" + errors +
                '}';
    }
}
