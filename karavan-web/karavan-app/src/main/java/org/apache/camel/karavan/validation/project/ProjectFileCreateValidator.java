package org.apache.camel.karavan.validation.project;

import java.util.List;

import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.apache.camel.karavan.shared.validation.SimpleValidator;
import org.apache.camel.karavan.shared.validation.ValidationError;
import org.apache.camel.karavan.shared.validation.Validator;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectFileCreateValidator extends Validator<ProjectFile> {

    private final SimpleValidator simpleValidator;
    private final InfinispanService infinispanService;

    public ProjectFileCreateValidator(SimpleValidator simpleValidator, InfinispanService infinispanService) {
        this.simpleValidator = simpleValidator;
        this.infinispanService = infinispanService;
    }

    @Override
    protected void validationRules(ProjectFile value, List<ValidationError> errors) {
        simpleValidator.validate(value, errors);

        boolean projectFileExists = infinispanService.getProjectFile(value.getProjectId(), value.getName()) != null;

        if (projectFileExists) {
            errors.add(new ValidationError("name", "File with given name already exists"));
        }
    }
}
