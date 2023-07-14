package org.apache.camel.karavan.datagrid.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class LogLine {

    public static final String CACHE = "log-lines";
    @ProtoField(number = 1)
    String line;

    @ProtoFactory

    public LogLine(String line) {
        this.line = line;
    }
}
