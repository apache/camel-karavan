package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(
        includeClasses = {
                GroupedKey.class,
                Project.class,
                ProjectFile.class,
                PipelineStatus.class,
                CamelStatus.class,
                DeploymentStatus.class,
                PodStatus.class,
                Environment.class,
                ServiceStatus.class,
                CommandName.class,
                CamelStatusName.class,
                DevModeCommand.class,
                DevModeStatus.class
        },
        schemaFileName = "karavan.proto",
        schemaFilePath = "proto/",
        schemaPackageName = "karavan")
public interface KaravanSchema extends GeneratedSchema {
}
