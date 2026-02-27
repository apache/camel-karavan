package org.apache.camel.karavan.cache;

import java.time.Instant;

public class AccessSession {

    public String sessionId;

    public String username;

    public String csrfToken;

    public long createdAtMillis;

    public Instant expiredAt;

    public AccessSession(String sessionId, String username, String csrfToken, long createdAtMillis, Instant expiredAt) {
        this.sessionId = sessionId;
        this.username = username;
        this.csrfToken = csrfToken;
        this.createdAtMillis = createdAtMillis;
        this.expiredAt = expiredAt;
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

    public Instant getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(Instant expiredAt) {
        this.expiredAt = expiredAt;
    }

    public AccessSession copy() {
        return new AccessSession(sessionId, username, csrfToken, createdAtMillis, expiredAt);
    }
}
