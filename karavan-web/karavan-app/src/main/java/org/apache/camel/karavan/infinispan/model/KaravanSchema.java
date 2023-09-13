package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(
        includeClasses = {
                GroupedKey.class,
                Project.class,
                Project.Type.class,
                ProjectFile.class,
                CamelStatus.class,
                CamelStatusValue.class,
                CamelStatusValue.Name.class,
                DeploymentStatus.class,
                ContainerStatus.class,
                ContainerStatus.ContainerType.class,
                ContainerStatus.Command.class,
                ServiceStatus.class
        },
        schemaFileName = "karavan.proto",
        schemaFilePath = "proto/",
        schemaPackageName = "karavan")
public interface KaravanSchema extends GeneratedSchema {
}


