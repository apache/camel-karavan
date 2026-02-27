package org.apache.camel.karavan.cache;

public class AccessPassword {

    public String username;

    public String pwdHash;

    public int costAtCreation;

    public long changedAt;

    public long lastAttempt;

    public long lastLogin;

    public int failedAttempts;

    public long lockedUntil; // epoch millis; 0 = not locked

    public AccessPassword() {
    }

    public AccessPassword(String username, String pwdHash, int costAtCreation, long changedAt, long lastAttempt, long lastLogin, int failedAttempts, long lockedUntil) {
        this.username = username;
        this.pwdHash = pwdHash;
        this.costAtCreation = costAtCreation;
        this.changedAt = changedAt;
        this.lastAttempt = lastAttempt;
        this.lastLogin = lastLogin;
        this.failedAttempts = failedAttempts;
        this.lockedUntil = lockedUntil;
    }

    public AccessPassword(String username, String pwdHash) {
        this.username = username;
        this.pwdHash = pwdHash;
        this.costAtCreation = extractCostFromBcrypt(pwdHash);
        this.changedAt = System.currentTimeMillis();
        this.failedAttempts = 0;
        this.lockedUntil = 0;
        this.lastLogin = 0;
        this.lastAttempt = 0;
    }

    private int extractCostFromBcrypt(String bcrypt) {
        // "$2a$12$..." -> 12
        String[] parts = bcrypt.split("\\$");
        return Integer.parseInt(parts[2]);
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPwdHash() {
        return pwdHash;
    }

    public void setPwdHash(String pwdHash) {
        this.pwdHash = pwdHash;
    }

    public int getCostAtCreation() {
        return costAtCreation;
    }

    public void setCostAtCreation(int costAtCreation) {
        this.costAtCreation = costAtCreation;
    }

    public long getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(long changedAt) {
        this.changedAt = changedAt;
    }

    public long getLastAttempt() {
        return lastAttempt;
    }

    public void setLastAttempt(long lastAttempt) {
        this.lastAttempt = lastAttempt;
    }

    public long getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(long lastLogin) {
        this.lastLogin = lastLogin;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public long getLockedUntil() {
        return lockedUntil;
    }

    public void setLockedUntil(long lockedUntil) {
        this.lockedUntil = lockedUntil;
    }
}
