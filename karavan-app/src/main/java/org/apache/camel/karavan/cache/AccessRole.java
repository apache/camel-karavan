package org.apache.camel.karavan.cache;

import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.api.annotations.indexing.Text;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

@Indexed
public class AccessRole {

    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    public String name;
    @Text
    @ProtoField(2)
    public String description;

    public AccessRole() {
    }

    @ProtoFactory
    public AccessRole(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
