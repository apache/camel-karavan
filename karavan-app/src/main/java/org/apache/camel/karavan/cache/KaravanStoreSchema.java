package org.apache.camel.karavan.cache;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.ProtoSchema;
import org.infinispan.protostream.annotations.ProtoSyntax;

import static org.apache.camel.karavan.KaravanConstants.PLATFORM_PREFIX;

@ProtoSchema(
        includeClasses = {
                GroupedKey.class,
                ProjectFolder.class,
                ProjectFolder.Type.class,
                ProjectFile.class,
                ProjectFileCommited.class,
                ContainerType.class,
                DeploymentStatus.class,
                ServiceStatus.class,
                ContainerPort.class,
                PodContainerStatus.class,
                PodContainerStatus.Command.class,
                PodContainerStatus.State.class,
                CamelStatus.class,
                CamelStatusValue.class,
                CamelStatusValue.Name.class,
                AccessPassword.class,
                AccessUser.class,
                AccessUser.UserStatus.class,
                AccessRole.class,
                AccessSession.class,
        },
        syntax = ProtoSyntax.PROTO3,
        schemaFileName = PLATFORM_PREFIX + ".proto")
public interface KaravanStoreSchema extends GeneratedSchema {

}