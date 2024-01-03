package org.apache.camel.karavan.shared.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

@ApplicationScoped
public class SimpleValidator {
    private final Validator validator;

    public SimpleValidator(Validator validator) {
        this.validator = validator;
    }

    public <T> void validate(T object, List<ValidationError> errors) {
        Set<ConstraintViolation<T>> violations = validator.validate(object);

        violations
                .forEach(violation -> errors.add(new ValidationError(violation.getPropertyPath().toString(), violation.getMessage())));
    }

    public <T> ValidationResult validate(T object) {
        List<ValidationError> errors = new ArrayList<>();

        validate(object, errors);

        return new ValidationResult(errors);
    }
}
