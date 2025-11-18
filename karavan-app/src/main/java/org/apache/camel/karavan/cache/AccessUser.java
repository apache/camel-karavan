package org.apache.camel.karavan.cache;

import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.api.annotations.indexing.Text;
import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.util.ArrayList;
import java.util.List;

@Indexed
public class AccessUser {

    public enum UserStatus {
        @ProtoEnumValue(number = 0, name = "ACTIVE")
        ACTIVE,
        @ProtoEnumValue(number = 1, name = "INACTIVE")
        INACTIVE,
        @ProtoEnumValue(number = 2, name = "DELETED")
        DELETED
    }


    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    public String username;
    @Text
    @ProtoField(2)
    public String firstName;
    @Text
    @ProtoField(3)
    public String lastName;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(4)
    public String email;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(5)
    public UserStatus status;
    @Text(name = "roles_text", projectable = true)
    @Keyword(name = "roles", projectable = true)
    @ProtoField(value = 6, collectionImplementation = ArrayList.class)
    public List<String> roles;

    public AccessUser() {
    }

    @ProtoFactory
    public AccessUser(String username, String firstName, String lastName, String email, UserStatus status, List<String> roles) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.status = status;
        this.roles = roles;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    @Override
    public String toString() {
        return "AccessUser{" +
                "username='" + username + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                '}';
    }
}
