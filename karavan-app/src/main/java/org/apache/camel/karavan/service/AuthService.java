package org.apache.camel.karavan.service;

import com.google.common.base.Objects;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.cache.AccessPassword;
import org.apache.camel.karavan.cache.AccessRole;
import org.apache.camel.karavan.cache.AccessUser;
import org.apache.camel.karavan.cache.KaravanCache;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Singleton
public class AuthService {
    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());

    @ConfigProperty(name = "platform.auth")
    Optional<String> auth;

    @ConfigProperty(name = "platform.password", defaultValue = "Pl@tf0rm")
    String password;

    public static final String ROLE_ADMIN = "platform-admin";
    public static final String ROLE_DEVELOPER = "platform-developer";
    public static final String ROLE_USER = "platform-user";

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
                    karavanCache.saveRole(new AccessRole(name, Arrays.stream(name.split("-")).map(this::capitalize).collect(Collectors.joining(" "))));
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
            karavanCache.saveUser(currentUser);
            var pwdHash = BcryptUtil.bcryptHash(password, COST);
            karavanCache.savePassword(new AccessPassword(username, pwdHash));
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
                karavanCache.savePassword(pwd);
                throw new RuntimeException(message);
            }
            pwd.setLastLogin(System.currentTimeMillis());
            pwd.setFailedAttempts(0);
            karavanCache.savePassword(pwd);
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

        karavanCache.savePassword(pwd);
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}

