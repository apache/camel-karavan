package org.apache.camel.karavan.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(includeClasses = { GroupedKey.class, Project.class, ProjectFile.class }, schemaPackageName = "karavan")
public interface ProjectStoreSchema extends GeneratedSchema {
}
