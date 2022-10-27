package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class GroupedKey {


    @ProtoField(number = 1)
    String group;
    @ProtoField(number = 2)
    String key;

    @ProtoFactory
    public GroupedKey(String group, String key) {
        this.group = group;
        this.key = key;
    }

    public static GroupedKey create(String group, String key) {
        return new GroupedKey(group, key);
    }


    public String getGroup() {
        return group;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        GroupedKey that = (GroupedKey) o;

        if (!group.equals(that.group)) return false;
        return key.equals(that.key);
    }

    @Override
    public int hashCode() {
        int result = group.hashCode();
        result = 31 * result + key.hashCode();
        return result;
    }
}