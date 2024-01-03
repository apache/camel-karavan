package org.apache.camel.karavan.shared.validation;

import java.util.List;

import org.apache.camel.karavan.shared.exception.ValidationException;

public class ValidationResult {
    private List<ValidationError> errors;

    ValidationResult(List<ValidationError> errors) {
        this.errors = errors;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<ValidationError> errors;

        Builder() {}

        public Builder errors(List<ValidationError> errors) {
            this.errors = errors;
            return this;
        }

        public ValidationResult build() {
            return new ValidationResult(errors);
        }

        @Override
        public String toString() {
            return "Builder{" +
                    "errors=" + errors +
                    '}';
        }
    }

    public void failOnError() {
        if (!errors.isEmpty()) {
            throw new ValidationException("Object failed validation", errors);
        }
    }
}
