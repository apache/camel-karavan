package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;

public enum DevModeCommandType {

        @ProtoEnumValue(number = 0, name = "DEVMODE") DEVMODE,
        @ProtoEnumValue (number = 1, name = "DEVSERVICE") DEVSERVICE
}
