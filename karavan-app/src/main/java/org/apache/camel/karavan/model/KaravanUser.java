package org.apache.camel.karavan.model;

import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

public class KaravanUser {
    @ProtoField(number = 1)
    String username;
    @ProtoField(number = 2)
    String password;
    @ProtoField(number = 3)
    String firstName;
    @ProtoField(number = 4)
    String lastName;
    @ProtoField(number = 5)
    boolean showTour;


    @ProtoFactory
    public KaravanUser(String username, String password, String firstName, String lastName, boolean showTour) {
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.showTour = showTour;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public boolean isShowTour() {
        return showTour;
    }

    public void setShowTour(boolean showTour) {
        this.showTour = showTour;
    }
}
