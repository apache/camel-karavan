package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;
//import org.infinispan.distribution.group.Group;


public class GroupedKey {

    @ProtoField(number = 1)
    String projectId;
    @ProtoField(number = 2)
    String env;
    @ProtoField(number = 3)
    String key;

    @ProtoFactory
    public GroupedKey(String projectId, String env, String key) {
        this.projectId = projectId;
        this.env = env;
        this.key = key;
    }

    public static GroupedKey create(String projectId, String env, String key) {
        return new GroupedKey(projectId, env, key);
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

//    @Group https://github.com/quarkusio/quarkus/issues/34677
    public String getProjectId() {
        return projectId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        GroupedKey that = (GroupedKey) o;

        if (!projectId.equals(that.projectId)) return false;
        if (!env.equals(that.env)) return false;
        return key.equals(that.key);
    }

    @Override
    public int hashCode() {
        int result = projectId.hashCode();
        result = 31 * result + env.hashCode();
        result = 31 * result + key.hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "GroupedKey{" +
                "projectId='" + projectId + '\'' +
                ", env='" + env + '\'' +
                ", key='" + key + '\'' +
                '}';
    }
}