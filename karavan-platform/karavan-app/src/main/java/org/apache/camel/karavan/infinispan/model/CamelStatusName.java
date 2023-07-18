package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoEnumValue;

public enum CamelStatusName {

        @ProtoEnumValue(number = 0, name = "context") context,
        @ProtoEnumValue (number = 1, name = "inflight") inflight,
        @ProtoEnumValue (number = 2, name = "memory") memory,
        @ProtoEnumValue (number = 3, name = "properties") properties,
        @ProtoEnumValue (number = 4, name = "route") route,
        @ProtoEnumValue (number = 5, name = "trace") trace,
        @ProtoEnumValue (number = 6, name = "jvm") jvm,
        @ProtoEnumValue (number = 7, name = "source") source
}
