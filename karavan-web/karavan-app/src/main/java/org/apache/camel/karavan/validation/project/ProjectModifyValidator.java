package org.apache.camel.karavan.validation.project;

import java.util.List;

import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.Project;
import org.apache.camel.karavan.shared.validation.SimpleValidator;
import org.apache.camel.karavan.shared.validation.ValidationError;
import org.apache.camel.karavan.shared.validation.Validator;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectModifyValidator extends Validator<Project> {
    private static final List<String> FORBIDDEN_PROJECT_ID_VALUES = List.of("templates", "kamelets");

    private final SimpleValidator simpleValidator;
    private final KaravanCacheService karavanCacheService;

    public ProjectModifyValidator(SimpleValidator simpleValidator, KaravanCacheService karavanCacheService) {
        this.simpleValidator = simpleValidator;
        this.karavanCacheService = karavanCacheService;
    }


    @Override
    protected void validationRules(Project value, List<ValidationError> errors) {
        simpleValidator.validate(value, errors);

        boolean projectIdExists = karavanCacheService.getProject(value.getProjectId()) != null;

        if(projectIdExists) {
            errors.add(new ValidationError("projectId", "Project ID already exists"));
        }

        if(FORBIDDEN_PROJECT_ID_VALUES.contains(value.getProjectId())) {
            errors.add(new ValidationError("projectId", "'templates' or 'kamelets' can't be used as project ID"));
        }
    }
}
