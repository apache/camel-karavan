package org.apache.camel.karavan.validation.project;

import java.util.List;

import org.apache.camel.karavan.cache.KaravanCacheService;
import org.apache.camel.karavan.cache.model.ProjectFile;
import org.apache.camel.karavan.shared.validation.SimpleValidator;
import org.apache.camel.karavan.shared.validation.ValidationError;
import org.apache.camel.karavan.shared.validation.Validator;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectFileCreateValidator extends Validator<ProjectFile> {

    private final SimpleValidator simpleValidator;
    private final KaravanCacheService karavanCacheService;

    public ProjectFileCreateValidator(SimpleValidator simpleValidator, KaravanCacheService karavanCacheService) {
        this.simpleValidator = simpleValidator;
        this.karavanCacheService = karavanCacheService;
    }

    @Override
    protected void validationRules(ProjectFile value, List<ValidationError> errors) {
        simpleValidator.validate(value, errors);

        boolean projectFileExists = karavanCacheService.getProjectFile(value.getProjectId(), value.getName()) != null;

        if (projectFileExists) {
            errors.add(new ValidationError("name", "File with given name already exists"));
        }
    }
}
