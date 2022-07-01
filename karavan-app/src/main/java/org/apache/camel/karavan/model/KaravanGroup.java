package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.List;

public class KaravanGroup {
    @ProtoField(number = 1)
    String name;
    @ProtoField(number = 2)
    List<String> users;

    @ProtoFactory
    public KaravanGroup(String name, List<String> users) {
        this.name = name;
        this.users = users;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getUsers() {
        return users;
    }

    public void setUsers(List<String> users) {
        this.users = users;
    }
}
