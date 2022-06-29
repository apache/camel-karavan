package org.apache.camel.karavan.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

import java.util.HashMap;

@AutoProtoSchemaBuilder(
        includeClasses = {
                GroupedKey.class, Project.class, ProjectFile.class, ProjectStatus.class, ProjectEnvStatus.class, DeploymentStatus.class
        },
        schemaPackageName = "karavan")
public interface ProjectStoreSchema extends GeneratedSchema {
}
