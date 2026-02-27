package org.apache.camel.karavan.service;

import com.google.common.base.Objects;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.cache.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Singleton
public class AuthService {
    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());

    @ConfigProperty(name = "platform.auth")
    Optional<String> auth;

    @ConfigProperty(name = "platform.password", defaultValue = "Pl@tf0rm")
    String password;

    static final SecureRandom RNG = new SecureRandom();
    public static final int SESSION_MAX_AGE = 12 * 60 * 60;

    public static final String ROLE_ADMIN = "platform-admin";
    public static final String ROLE_DEVELOPER = "platform-developer";
    public static final String ROLE_USER = "platform-user";
    public static final String ROLE_SYSTEM_BUILDER = "platform-system-builder";

    public static final String USER_ADMIN = "admin";
    public static final String USER_DEVELOPER = "developer";
    public static final String DEFAULT_EMAIL_SUFFIX = "@platform.platform";

    public static List<String> getAllRoles(){
        return List.of(ROLE_ADMIN, ROLE_DEVELOPER, ROLE_USER);
    }

    private static final int COST = 12;

    @Inject
    KaravanCache karavanCache;

    public void loadDefaults() {
        if (auth.isEmpty() || !Objects.equal("oidc", auth.get())) {
            LOGGER.info("Creating default roles...");
            for (String name : getAllRoles()) {
                if (karavanCache.getRole(name) == null) {
                    karavanCache.saveRole(new AccessRole(name, Arrays.stream(name.split("-")).map(this::capitalize).collect(Collectors.joining(" "))), true);
                }
            }
            LOGGER.info("Creating default users...");
            createDefaultUser(USER_ADMIN, getAllRoles());
            createDefaultUser(USER_DEVELOPER, new ArrayList<>(List.of(ROLE_DEVELOPER, ROLE_USER)));
        }
    }
    private void createDefaultUser(String username, List<String> roles) {
        var currentUser = karavanCache.getUser(username);
        if (currentUser == null) {
            currentUser = new AccessUser(username, capitalize(username), capitalize(username), username + DEFAULT_EMAIL_SUFFIX, AccessUser.UserStatus.ACTIVE, roles);
            karavanCache.saveUser(currentUser, true);
            var pwdHash = BcryptUtil.bcryptHash(password, COST);
            karavanCache.savePassword(new AccessPassword(username, pwdHash), true);
        } else {
            LOGGER.info("User " + username + " already exists");
        }
    }

    public AccessUser login(String username, String password) {
        var user = karavanCache.getUser(username);
        var pwd = karavanCache.getPassword(username);
        String message = null;
        if (user != null && pwd != null) {
            pwd.setLastAttempt(System.currentTimeMillis());
            var lockedUntil = pwd.lockedUntil;
            var matched = BcryptUtil.matches(password, pwd.pwdHash);
            if (Instant.now().isBefore(Instant.ofEpochMilli(lockedUntil))) {
                message = "User is locked!";
            } else if (pwd.failedAttempts > 5) {
                pwd.setFailedAttempts(pwd.getFailedAttempts() + 1);
                message = "Max failed attempts reached!";
            } else if (!matched) {
                pwd.setFailedAttempts(pwd.getFailedAttempts() + 1);
                message = "Incorrect Username and/or Password!";
            }
            if (message != null) {
                karavanCache.savePassword(pwd, true);
                throw new RuntimeException(message);
            }
            pwd.setLastLogin(System.currentTimeMillis());
            pwd.setFailedAttempts(0);
            karavanCache.savePassword(pwd, true);
            return user;
        } else {
            throw new RuntimeException("Incorrect Username and/or Password!");
        }
    }

    public void changePassword(String username, String password, boolean admin) {
        var pwd = karavanCache.getPassword(username);

        if (pwd == null && admin) {
            pwd = new AccessPassword();
            pwd.setUsername(username);
        } else if (pwd == null) {
            throw new RuntimeException("Incorrect Username and/or Password!");
        }

        long now = System.currentTimeMillis();
        pwd.setLastAttempt(now);
        pwd.setChangedAt(now);
        pwd.setFailedAttempts(0);
        pwd.setLockedUntil(0);
        pwd.setPwdHash(BcryptUtil.bcryptHash(password, COST));

        karavanCache.savePassword(pwd, true);
    }


    public AccessSession createSession(String username) throws Exception {
        String sessionId = random(32);
        String csrf = random(16);
        var createdAt = Instant.now();
        return new AccessSession(sessionId, username, csrf, createdAt.toEpochMilli(), Instant.now().plus(SESSION_MAX_AGE, ChronoUnit.SECONDS));
    }

    public AccessSession createAndSaveSession(String username, boolean persist) throws Exception {
        var session = createSession(username);
        karavanCache.saveAccessSession(session, persist);
        return session;
    }

    public String random(int bytes) {
        byte[] b = new byte[bytes];
        RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}

