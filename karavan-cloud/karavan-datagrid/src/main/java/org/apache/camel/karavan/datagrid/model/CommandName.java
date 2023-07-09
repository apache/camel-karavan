package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;

public enum CommandName {

        @ProtoEnumValue(number = 0, name = "RUN") RUN,
        @ProtoEnumValue (number = 1, name = "DELETE") DELETE,
        @ProtoEnumValue (number = 2, name = "RELOAD") RELOAD
}
