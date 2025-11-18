package org.apache.camel.karavan.cache;

import org.infinispan.api.annotations.indexing.Basic;
import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

@Indexed
public class AccessSession {

    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    public String sessionId;

    @Keyword(projectable = true, sortable = true)
    @ProtoField(2)
    public String username;

    @Keyword(projectable = true)
    @ProtoField(3)
    public String csrfToken;

    @Basic
    @ProtoField(4)
    public long createdAtMillis;

    @ProtoFactory
    public AccessSession(String sessionId, String username, String csrfToken, long createdAtMillis) {
        this.sessionId = sessionId;
        this.username = username;
        this.csrfToken = csrfToken;
        this.createdAtMillis = createdAtMillis;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getCsrfToken() {
        return csrfToken;
    }

    public void setCsrfToken(String csrfToken) {
        this.csrfToken = csrfToken;
    }

    public long getCreatedAtMillis() {
        return createdAtMillis;
    }

    public void setCreatedAtMillis(long createdAtMillis) {
        this.createdAtMillis = createdAtMillis;
    }
}
