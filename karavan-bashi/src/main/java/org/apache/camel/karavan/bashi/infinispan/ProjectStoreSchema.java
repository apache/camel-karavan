package org.apache.camel.karavan.bashi.infinispan;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(includeClasses = {GroupedKey.class, PodStatus.class}, schemaPackageName = "karavan")
public interface ProjectStoreSchema extends GeneratedSchema {
}
