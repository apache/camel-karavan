package org.apache.camel.karavan.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(
        includeClasses = {
                GroupedKey.class, Project.class, ProjectFile.class, PipelineStatus.class, CamelStatus.class, DeploymentStatus.class,
                PodStatus.class, Environment.class, ServiceStatus.class
        },
        schemaPackageName = "karavan")
public interface ProjectStoreSchema extends GeneratedSchema {
}
