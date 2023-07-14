package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;

public enum DevModeCommandName {

        @ProtoEnumValue(number = 0, name = "RUN") RUN,
        @ProtoEnumValue (number = 1, name = "STOP") STOP,
        @ProtoEnumValue (number = 2, name = "DELETE") DELETE,
        @ProtoEnumValue (number = 3, name = "RELOAD") RELOAD,
        @ProtoEnumValue (number = 4, name = "LOG") LOG
}
