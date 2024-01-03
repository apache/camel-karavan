package org.apache.camel.karavan.shared.validation;

import java.util.ArrayList;
import java.util.List;

public abstract class Validator<T> {
    public ValidationResult validate(T object) {
        List<ValidationError> errors = new ArrayList<>();

        validationRules(object, errors);

        return ValidationResult.builder()
                .errors(errors)
                .build();
    }

    protected abstract void validationRules(T object, List<ValidationError> errors);

    public static class ValidationErrors {
        private ValidationErrors() {
        }
    }
}
