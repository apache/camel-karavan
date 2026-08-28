# Apache Camel Karavan — Threat Model

| | |
| --- | --- |
| **Project** | Apache Camel Karavan |
| **Version / commit** | 4.22.0 — `51247d48ba95b7d3461597845d7135cf95e27e5f` |
| **Date** | 2026-08-28 |
| **Status** | **DRAFT — not yet reviewed by maintainers.** Produced from public artifacts only. |
| **Author** | Drafted with the ASF Security `threat-model-producer` rubric. |

## Version binding

This model is versioned alongside the project and should be tagged with releases. A
report filed against Karavan version *N* is triaged against the model as it stood at
*N*, not against HEAD.

## Reporting cross-reference

Findings that violate a property claimed in §4.8 should be reported privately to
`security@apache.org` per the ASF disclosure process — **not** as a GitHub issue.
Findings that land in §4.3 (out of scope), §4.9 (disclaimed properties), or §4.11a
(known non-findings) will be closed citing this document.

## Provenance legend

Every non-trivial claim carries one of three tags:

| Tag | Meaning |
| --- | --- |
| *(documented)* | Stated in the project's own artifacts — source, config, install docs, or the Apache Camel security model. Cited. |
| *(maintainer)* | Stated by a Karavan maintainer in response to this process. |
| *(inferred)* | Reasoned from code structure or the absence of a feature. Not yet confirmed; has a matching question in §4.14. |

## Draft confidence

**53 documented / 0 maintainer / 28 inferred.** No claim in this draft has yet been
ratified by a maintainer. The *(inferred)* claims concentrate in §4.5 (negative
side-effect claims), §4.7 (adversary model), and §4.9 (disclaimed properties) — the
three areas that are almost never written down and therefore matter most to confirm.
Treat §4.14 wave 1 as blocking for publication.

## What Karavan is

Apache Camel Karavan is a low-code data-integration platform. It gives a team a web
UI (and a companion VS Code extension) for visually designing Apache Camel routes,
storing them in a Git repository that acts as the source of truth, running them
locally in "developer mode" containers, building them into container images, and
deploying them to Docker or Kubernetes/OpenShift. The server component is a Quarkus
application that holds credentials for a Git repository and an image registry, and
that drives either the host Docker daemon or the Kubernetes API on the user's behalf.
*(documented — `README.md`, `docs/install/`)*

---

## 4.2 Scope and intended use

Karavan is designed to be run by a team as **an internal developer platform on a
trusted network** — the same posture as a CI server or an internal PaaS console.
*(inferred — §4.14 Q1)* It is not a multi-tenant SaaS product, and it is not an
appliance intended to face the public internet.

### Caller roles

Karavan is a service, not a library, so "the caller" splits into four roles. These map
onto the vocabulary already established by the Apache Camel security model
*(documented — <https://camel.apache.org/manual/security-model.html>)*:

| Role | Trust | Notes |
| --- | --- | --- |
| **Operator / deployer** | Fully trusted | Installs Karavan, sets `platform.auth`, supplies Git and registry credentials, mounts `docker.sock` or binds the Kubernetes `Role`. Equivalent to the Camel model's "deployment operator". |
| **Authenticated Karavan user** | **Fully trusted** | Any account with any of `platform-user` / `platform-developer` / `platform-admin`. Equivalent to the Camel model's "route author", which that model declares fully trusted and able to execute arbitrary code by design. |
| **Service-account token holder** | **Fully trusted** | A `platform-service-account` identity created from `/ui/access/tokens`. Functionally equivalent to an authenticated user for everything except the `/ui/access` administration surface. *(inferred — §4.14 Q4)* |
| **Unauthenticated network peer** | **Untrusted — the primary adversary** | Anyone who can reach the Karavan HTTP port but holds no valid session or token. |

The critical consequence: **the trust boundary is authentication, and nothing after
it.** A user who can log in can, by design, cause arbitrary code to run on the Docker
host or in the Kubernetes namespace. This is the intended function of the product, not
a defect.

### Component families

| Family | Entry point | Touches outside the process? | In this model? |
| --- | --- | --- | --- |
| **Karavan server API** | `karavan-app` — JAX-RS resources under `/ui/*`, `/platform/internal/*`, `/public/*` | Yes: Docker socket, Kubernetes API, Git remote, image registry, PostgreSQL | **In scope — this is the core** |
| **Karavan web UI** | `karavan-app/src/main/webui` React SPA, served same-origin | Browser only | **In scope** |
| **DevMode / builder image** | `karavan-devmode` — `entrypoint.sh`, `KaravanDevMode` | Yes: clones Git, runs Maven/JiB, pushes images, runs the user's Camel routes | **In scope as an executor**, but see §4.3 — the routes it runs are governed by the Camel security model, not this one |
| **VS Code extension** | `karavan-vscode` | Local filesystem, local JBang/Maven/`kubectl`/`oc` via terminal | **In scope, separately** — see §4.2.1 |
| **Code generator** | `karavan-generator` | Build-time only; not shipped at runtime | Out of scope — §4.3 |
| **Reference install manifests** | `docs/install/karavan-docker`, `karavan-kubernetes`, `karavan-helm` | n/a | **In scope as documented posture**, out of scope as production-ready config — §4.3 |
| **Repo dev tooling** | `Dockerfile.claude`, `claude_*.sh`, `release-utils/` | n/a | Out of scope — §4.3 |

### 4.2.1 The VS Code extension is a different product

`karavan-vscode` has an entirely different threat profile from the server: it runs
wholly on a developer's own machine, exposes no network listener, and its "caller" is
the developer who installed it. *(documented — `docs/VSCODE_INSTALL.md`, `README.md`)*
It shells out to JBang, Maven, `kubectl` and `oc` through VS Code terminals
*(documented — `karavan-vscode/src/exec.ts`, `jbang.ts`, `maven.ts`)*, which is its
purpose. The relevant adversary for it is a **malicious workspace**: a repository the
developer opens that contains crafted Camel YAML or `application.properties`. Whether
opening an untrusted workspace in the extension is a supported scenario is an open
question — see §4.14 Q10.

---

## 4.3 Out of scope (explicit non-goals)

**Uses Karavan does not aim to support:**

- **Multi-tenancy.** Karavan is not a tenancy boundary. All projects live in one Git
  repository, one database, and one Docker network or Kubernetes namespace. *(inferred
  — §4.14 Q2)*
- **Internet-facing deployment.** Nothing in the reference deployment terminates TLS,
  rate-limits, or fronts the API with a WAF. *(documented — `docs/install/karavan-helm/values.yaml`
  ships `ingress.tls: false`; `docs/WEB_DOCKER.md` publishes port 8080 directly.)*
- **Being a security boundary between its own users.** See §4.9.

**Threats deliberately not defended against:**

- **A Karavan user escalating to host or namespace privileges.** This is the product's
  function. Karavan is given the Docker socket *(documented —
  `docs/install/karavan-docker/docker-compose.yaml`: `"/var/run/docker.sock:/var/run/docker.sock"`,
  with the comment "Allows Karavan to build and manage Docker containers on the host")*
  or a Kubernetes `Role` with `["*"]` on `secrets`, `configmaps`, `serviceaccounts`,
  `pods`, `services`, `deployments`, `ingresses`, PVs/PVCs plus `create` on `pods/exec`
  *(documented — `docs/install/karavan-kubernetes/role.yaml`)*. A logged-in user
  driving that is working as designed.
- **Anything inside a running Camel route.** Once an integration is deployed, its
  security is governed by the Apache Camel security model, which is a separate document
  with its own scope. *(documented — the Camel security model states it covers
  `apache/camel` artifacts and that sibling subprojects "have their own security
  surfaces".)* A header-injection or deserialization issue in a Camel component is a
  Camel report, not a Karavan report.
- **Compromise of the Git repository or image registry.** Both are trusted inputs; see
  §4.6. *(inferred — §4.14 Q3)*
- **Denial of service through resource exhaustion.** Consistent with the Camel model,
  which places DoS out of scope. Karavan places no quota on how many devmode or build
  containers a user may start. *(inferred — §4.14 Q7)*
- **Transitive third-party CVEs**, absent a demonstrated path from an in-scope adversary
  to a Karavan-claimed property. *(inferred — §4.14 Q3)*

**Code that ships but is not covered:**

- `karavan-generator/` — a build-time code generator that reads the Camel catalog and
  emits TypeScript/Java model classes. It never runs in a deployed Karavan. Threat-model
  separately if it ever ingests untrusted catalogs.
- `release-utils/`, `change_version.sh`, `claude_*.sh`, `Dockerfile.claude` — maintainer
  tooling, not shipped to users.
- `docs/install/*` — **reference manifests, not a hardened production configuration.**
  They contain placeholder credentials and TLS-off defaults by design (see §4.11a).
  Findings against them are `OUT-OF-MODEL: unsupported-component` unless the finding is
  that the documentation fails to *say* they need hardening — which is a §4.10 doc gap.

---

## 4.4 Trust boundaries and data flow

There is exactly **one security boundary in Karavan: HTTP authentication at the
`karavan-app` API surface.** Everything else in the diagram is inside that boundary.

```
  UNTRUSTED                    │  TRUSTED (route-author equivalent)
                               │
  browser / HTTP client ──────►│ karavan-app  ──► PostgreSQL (state, users, sessions)
   • no session, no token      │   /ui/*        ──► Git remote      (source of truth)
   • ← THE ADVERSARY           │   /platform/*  ──► Image registry
                               │   /public/*    ──► Docker socket  ── root on host
                               │                └─► Kubernetes API ── namespace admin
                               │                        │
                               │                        ▼
                               │                 devmode / builder container
                               │                  • runs user's Camel routes
                               │                  • runs configuration/build.sh
                               │                        │
  ─────────────────────────────┼────────────────────────┼─────────────────────
  Integration message traffic  │  governed by the Apache Camel security model
```

### Trust transitions

| Transition | What crosses | Trust change |
| --- | --- | --- |
| HTTP request → `CookieSessionAuthMechanism` / `TokenAuthenticationMechanism` | `sessionId` cookie, `Authorization: Bearer`, `X-API-Key` | **untrusted → fully trusted.** The only transition that matters. *(documented — `karavan-app/.../api/CookieSessionAuthMechanism.java`, `TokenAuthenticationMechanism.java`)* |
| Project file write → Git commit → devmode/build | Camel YAML, `application.properties`, `docker-compose.yaml`, `configuration/build.sh` | No change — trusted throughout. Project files are **code**, authored by trusted users. |
| `karavan-app` → Docker daemon | container spec derived from the project's compose file, including image, bind mounts, ports and `/bin/sh -c` command *(documented — `DockerService.createContainer`)* | No change — Karavan is fully privileged on the daemon. |
| `karavan-app` → Kubernetes API | pod/deployment manifests derived from `configuration/builder.pod.jkube.yaml` | No change — Karavan holds its namespace `Role`. |
| Builder container → `/platform/internal/sources/{projectId}` | one-shot `sessionId` env var, invalidated after use *(documented — `InternalResource.getProjectFiles` invalidates in `finally`)* | Re-entry into the trusted zone with a short-lived credential. |
| devmode container → integration peers | Camel exchange data | **Karavan's model ends here.** Camel's model begins. |

### Reachability preconditions per component

Apply these before anything else when triaging a tool or AI finding:

- A finding in `org.apache.camel.karavan.api.*` is in model **only if** it is reachable
  by a caller holding no valid session and no valid API token, i.e. from
  `@PermitAll`-annotated endpoints (`/ui/auth/type`, `/ui/auth/sso-config`,
  `/ui/auth/login`, `/ui/auth/logout`, `/public/readiness`,
  `/platform/internal/sources/**`), the static SPA assets, or the authentication
  mechanisms themselves. A finding reachable only after `@Authenticated` succeeds is
  `OUT-OF-MODEL: adversary-not-in-scope`.
- A finding in `org.apache.camel.karavan.docker.*` or `.kubernetes.*` is in model **only
  if** the attacker-controlled value reaches it without passing through an authenticated
  request or a project file. In practice this is almost never true; container specs are
  route-author input.
- A finding in `CodeService`, `ProjectService`, or `GitService` is in model **only if**
  triggered by data Karavan did not receive from a trusted user or from the Git
  repository.
- A finding in `karavan-devmode` is in model **only if** it lets *untrusted integration
  traffic* — not the route author — affect the container. Everything the route author
  controls is by design.
- A finding in `karavan-vscode` is in model **only if** it is triggered by opening a
  workspace, not by the developer's own explicit command invocation. *(inferred — §4.14 Q10)*

---

## 4.5 Assumptions about the environment

- **Runtime.** JVM 21, Quarkus. *(documented — `karavan-devmode/Dockerfile` uses
  `ubi9/openjdk-21`; `karavan-app/pom.xml`.)*
- **Persistence.** A PostgreSQL instance, reachable and trusted. Flyway migrates the
  schema at startup. *(documented — `application.properties`.)* The database is
  assumed to be on a private network; Karavan does not encrypt its own rows.
  *(inferred — §4.14 Q5)*
- **Container platform.** Exactly one of: a Docker daemon reachable at
  `/var/run/docker.sock`, or a Kubernetes API server with the `karavan` service account
  bound to the `karavan` `Role`. Karavan selects the mode at runtime.
  *(documented — `ConfigService.inKubernetes()`, `docs/install/`.)*
- **Git remote.** A reachable Git repository that Karavan owns. Karavan treats it as the
  single source of truth and will import whatever it finds there into its own state.
  *(documented — `README.md`; `ProjectService.importProject`.)*
- **Network.** Karavan assumes it sits on a trusted network. It does not terminate TLS
  itself; the reference Helm chart offers an optional ingress TLS block that defaults
  off. *(documented — `docs/install/karavan-helm/templates/ingress.yaml`, `values.yaml`.)*
- **Clock.** Session and API-token expiry are wall-clock comparisons against
  `Instant.now()`. A backwards clock jump extends credential lifetime. *(inferred —
  §4.14 Q5)*
- **Concurrency.** The API is stateless per request; shared state lives in
  `KaravanCache` backed by PostgreSQL. No claim is made about behaviour under concurrent
  writes to the same project file — last write wins. *(inferred — §4.14 Q5)*

### What Karavan does *not* do to its host

These are **negative claims**, almost never written down anywhere, and therefore the
highest-priority confirmation targets in §4.14 (Q5).

- Does **not** install signal handlers or otherwise mutate process-global state beyond
  what Quarkus itself does. *(inferred — §4.14 Q5)*
- Does **not** spawn child processes on the Karavan host. All execution is delegated to
  the container platform; there is no `Runtime.exec` / `ProcessBuilder` in
  `karavan-app`. *(inferred — §4.14 Q5; verified by absence in the source tree)*
- Does **not** read arbitrary host filesystem paths. It reads only its own classpath
  resources and the two operator-configured SSH paths (`karavan.private-key-path`,
  `karavan.known-hosts-path`), plus Vert.x temp directories for Git clones. *(inferred — §4.14 Q5)*
- Does **not** listen on any port other than the configured HTTP port. *(inferred — §4.14 Q5)*
- **Does** read environment variables and MicroProfile Config values, and **exposes both
  to authenticated callers** via `/ui/diagnostics/*` — see §4.9. *(documented —
  `DiagnosticResource`)*
- **Does** write to the configured Git remote and image registry on user action.
  *(documented)*

---

## 4.5a Build-time and configuration variants

Karavan is not one binary with one security posture; it is a family of deployments.
These knobs change which properties in §4.8 hold.

| Knob | Default | Effect on the model | Maintainer stance |
| --- | --- | --- | --- |
| `platform.auth` | `session` | `session` uses Karavan's own bcrypt user store and cookie sessions. `oidc` delegates to Keycloak and takes roles from the access token. *(documented — `application.properties`, `CookieSessionAuthMechanism`)* | **Unresolved — §4.14 Q1** |
| `quarkus.oidc.tenant-enabled` | `false` | **Must be flipped to `true` when `platform.auth=oidc`.** The property file says so in a comment. If `platform.auth=oidc` is set without it, `CookieSessionAuthMechanism` returns null and OIDC is disabled — the resulting posture is undefined. *(documented — `application.properties` comment: "Important! Set `quarkus.oidc.tenant-enabled=true` for `platform.auth=oidc`")* | **Unresolved — §4.14 Q6** |
| `platform.password` | `K@r@v@n422` | Seeds the `admin` and `developer` accounts on first start. **This is the insecure-default case.** The install docs link directly to the line in `application.properties` that holds it, and do not instruct the operator to change it. *(documented — `AuthService.loadDefaults`, `docs/WEB_DOCKER.md`, `docs/WEB_KUBERNETES.md`)* | **Unresolved — §4.14 Q1. This ruling decides whether "default admin credentials" is `VALID` or `OUT-OF-MODEL: non-default-build`.** |
| `quarkus.security.jaxrs.deny-unannotated-endpoints` | `true` | Deny-by-default on the JAX-RS surface: an endpoint with no security annotation is refused rather than exposed. Flipping it to `false` voids the §4.8 authorization property wholesale. *(documented — `application.properties`)* | **Unresolved — §4.14 Q8** |
| `quarkus.http.auth.permission.public.paths` | `/public/*,/static/*,/robots.txt,/favicon.ico`, GET only | The unauthenticated surface. Widening it moves the §4.4 boundary. *(documented)* | **Unresolved — §4.14 Q8** |
| `quarkus.kubernetes-client.trust-certs` | `true` | Disables TLS certificate verification against the Kubernetes API server. Suits minikube; means Karavan will not detect a MitM on the API-server connection. *(documented — `application.properties`)* | **Unresolved — §4.14 Q6** |
| `ingress.tls` (Helm) | `false` | Session cookies are marked `secure`, so with TLS off the browser will not send them — login effectively requires TLS or a plaintext-localhost origin. *(documented — `values.yaml`, `AuthResource`)* | **Unresolved — §4.14 Q6** |
| `karavan.devmode.createm2` | `false` | When true, adds a named Docker volume per project for the Maven repository. Cross-project cache sharing implications. *(documented — `DockerForKaravan`)* | **Unresolved** |
| `configuration/build.sh` | ships with `-Djib.allowInsecureRegistries=true` | Permits pushing built images to a registry over plaintext HTTP. Suits the bundled `registry:2`. *(documented — `karavan-app/src/main/resources/configuration/docker/build.sh`)* | **Unresolved — §4.14 Q6** |
| `KARAVAN_FLYWAY_ACTIVE`, `KARAVAN_HIBERNATE_ORM_ACTIVE` | `true` | Disabling either leaves the schema unmanaged. Not security-relevant on its own. *(documented)* | n/a |

---

## 4.6 Assumptions about inputs

Karavan is a service, so the table is keyed by route rather than by function. "Attacker"
below means the §4.7 adversary — an **unauthenticated** peer.

| Route / input | Element | Attacker-controllable? | Operator/user must enforce |
| --- | --- | --- | --- |
| `POST /ui/auth/login` | `username`, `password` body | **yes** | Non-default `platform.password`; TLS in front |
| `POST /ui/auth/logout` | `sessionId` cookie | **yes** | — |
| `GET /ui/auth/type`, `/ui/auth/sso-config` | none | **yes (reachable)** | Accepts that auth mode, Keycloak URL, realm and public client ID are disclosed pre-auth *(documented — `@PermitAll` on both)* |
| `GET /public/readiness` | none | **yes (reachable)** | Accepts that infra health and `karavan.environment` are disclosed pre-auth |
| `GET /platform/internal/sources/{projectId}` | `sessionId` cookie, `projectId` | **yes (reachable)** — `@PermitAll`, gated by manual `authService.validateSession` | Network isolation between the Karavan pod/container and untrusted peers *(documented — `InternalResource`)* |
| `Authorization: Bearer` / `X-API-Key` | raw token | **yes** | Token expiry; revocation via `/ui/access/tokens/{hashedToken}` |
| All `/ui/**` bodies and path params | project ids, file names, file contents, container commands | **no — trusted route-author input** | Never grant a Karavan login to anyone who may not run code on the host |
| `docker-compose.yaml` in a project | image, `volumes` (incl. `bind`), ports, `command` | **no — trusted.** Reaches `MountType.valueOf(...)` and `/bin/sh -c` *(documented — `DockerService.createContainer`)* | — |
| `configuration/build.sh` | whole shell script, copied into the builder container with mode `0755` and executed *(documented — `DockerForKaravan.runBuildProject`)* | **no — trusted** | — |
| `configuration/builder.pod.jkube.yaml` | full pod spec applied to the cluster | **no — trusted** | — |
| Git repository contents | project folders, files, commit metadata | **no — trusted source of truth** *(documented — `README.md`; `ProjectService.importProjectFromRepo`)* | Restrict write access to the repo to the same population that may log into Karavan |
| Container image registry | images pulled for `packaged` containers | **no — trusted** | Registry access control |

**Size, shape and rate:** Karavan documents no limits on project count, file size, number
of concurrent devmode containers, or request rate. *(inferred — §4.14 Q7)*

---

## 4.7 Adversary model

**The adversary in scope is the unauthenticated network peer** who can reach Karavan's
HTTP port. Their goal is to obtain an authenticated identity — because an authenticated
identity is, by design, equivalent to code execution on the host. *(inferred — §4.14 Q2)*

Capabilities assumed:

- Send arbitrary HTTP requests to every route, including `@PermitAll` ones.
- Attempt credential guessing against `POST /ui/auth/login`.
- Attempt to present forged or stolen `sessionId` cookies and API tokens.
- Induce a logged-in user's browser to issue cross-origin requests (classic CSRF), or
  get script to run in the Karavan origin (XSS) — **whether these are in the model is
  §4.14 Q9, and it is the most consequential open question in this document.**
- Observe network traffic when TLS is absent.

Capabilities **not** assumed:

- Access to the host filesystem, the Docker socket, or the Kubernetes API.
- Write access to the Git repository or the image registry.
- Ability to read the PostgreSQL database directly.
- Precise timing side-channel measurement against bcrypt or token comparison.
  *(inferred — §4.14 Q9)*

**Actors explicitly out of the model:**

- **Any authenticated Karavan user, at any role.** They are the Camel security model's
  "route author", which that model declares fully trusted. They can start a container
  with `/var/run/docker.sock` bind-mounted, or edit `configuration/build.sh`. Reports of
  the form "an authenticated user can achieve RCE" are `OUT-OF-MODEL:
  adversary-not-in-scope`. *(documented — the Camel security model places "route author
  code writing expressions over untrusted input" out of scope; extended here to Karavan
  by inference — §4.14 Q2)*
- **The operator.** Misconfiguration is theirs; see §4.10.
- **A co-tenant on the Docker host or in the Kubernetes namespace.** They already share
  Karavan's privilege domain.
- **A compromised Git remote or image registry.** Both are trusted inputs. *(inferred —
  §4.14 Q3)*
- **An authenticated user attacking another user's project.** There is no isolation to
  breach; see §4.9.

---

## 4.8 Security properties Karavan provides

Each property states the conditions under which it holds, what a violation looks like,
and whether a violation is security-critical or a correctness bug.

**1. Deny-by-default authorization on the HTTP API.** *(documented —
`quarkus.security.jaxrs.deny-unannotated-endpoints=true`; every `/ui/*` resource
method carries `@Authenticated`, `@RolesAllowed`, or `@PermitAll`.)*
*Conditions:* `deny-unannotated-endpoints` left at `true`, public path list unwidened.
*Violation symptom:* any state-changing or data-returning endpoint outside the §4.6
`@PermitAll` list answers a request bearing no valid session and no valid token.
*Severity:* **security-critical.**

**2. The unauthenticated surface is limited to the §4.6 list.** *(documented — the
`@PermitAll` annotations and `quarkus.http.auth.permission.public.*`)*
*Conditions:* as above.
*Violation symptom:* an unauthenticated caller reads project data, container status,
logs, environment variables, Kubernetes secrets, or user records.
*Severity:* **security-critical.**

**3. Passwords are stored only as bcrypt hashes.** Cost factor 12. *(documented —
`AuthService.COST = 12`, `BcryptUtil.bcryptHash`.)*
*Conditions:* `platform.auth=session`. Under `oidc` Karavan stores no password at all.
*Violation symptom:* a plaintext or reversibly-encoded password recoverable from the
database, an API response, or a log line.
*Severity:* **security-critical.**

**4. Failed logins are counted and the account locks.** After more than five failed
attempts the account is refused until reset; a `lockedUntil` timestamp is honoured.
*(documented — `AuthService.login`.)*
*Conditions:* `platform.auth=session`.
*Violation symptom:* unbounded password guessing against one account.
*Severity:* **security-critical.**

**5. Session identifiers, CSRF tokens and API tokens are unguessable.** 32 bytes,
16 bytes and 32 bytes respectively from `SecureRandom`, base64url-encoded.
*(documented — `AuthService.random`, `AccessResource.generateToken`.)*
*Violation symptom:* a token or session id predictable from another, or from time.
*Severity:* **security-critical.**

**6. API tokens are stored hashed, never in plaintext.** SHA-256; the raw token is
returned to the creator once and never again; incoming tokens are hashed before lookup.
*(documented — `AccessResource.generateToken`, `TokenAuthenticationMechanism`.)*
*Violation symptom:* a usable raw token recoverable from the database or from
`GET /ui/access/tokens`.
*Severity:* **security-critical.**

**7. API tokens expire.** Default 30 days, operator-selectable at creation; expiry is
checked on every request and an expired token degrades to anonymous. *(documented —
`AccessToken.isExpired`, `TokenAuthenticationMechanism`.)*
*Violation symptom:* an expired token still authenticates.
*Severity:* **security-critical.**

**8. Session cookies are `HttpOnly` and `Secure`, and expire after 12 hours.**
*(documented — `AuthResource.login`, `AuthService.SESSION_MAX_AGE`.)*
*Violation symptom:* the `sessionId` cookie readable from JavaScript, sent over
plaintext HTTP, or accepted past its lifetime.
*Severity:* **security-critical.**

**9. The builder's bootstrap session is short-lived and single-use for the sources
endpoint.** `ProjectService.buildProject` mints a non-persisted session, passes it to the
builder container as an environment variable, and `InternalResource.getProjectFiles`
invalidates it in a `finally` block. *(documented.)*
*Conditions:* applies to `GET /platform/internal/sources/{projectId}`.
*Violation symptom:* the same builder session id usable a second time on that endpoint.
*Severity:* **security-critical.**
*Note:* the sibling route `GET /platform/internal/sources/{projectId}/{filename}` does
**not** invalidate. Whether that is deliberate is §4.14 Q11.

**10. User, role, session and token administration is admin-only.** Every mutating
endpoint under `/ui/access` carries `@RolesAllowed({ROLE_ADMIN})`, except token creation
which also admits `ROLE_DEVELOPER` and self-service profile update which admits
`ROLE_USER`. *(documented — `AccessResource`.)*
*Violation symptom:* a non-admin creates a user, changes another user's role or password,
or lists sessions.
*Severity:* **security-critical.**

**11. Changing a password invalidates the caller's session cookie and requires the
current password.** *(documented — `AuthResource.setPassword` calls `authService.login`
first, then clears the cookie.)*
*Violation symptom:* password change without knowledge of the current password.
*Severity:* **security-critical.**

**12. Git operations use the operator-supplied credential, never a user-supplied one.**
Users cannot direct Karavan at an arbitrary remote or supply their own credentials
through the API. *(documented — `GitService.setCredentials` reads only
`karavan.git.*` / `karavan.private-key-path`.)*
*Violation symptom:* an API path that causes Karavan to authenticate to a remote of the
caller's choosing.
*Severity:* **security-critical** (credential exfiltration).

---

## 4.9 Security properties Karavan does *not* provide

**This is the section a downstream operator most needs.** None of the following are
defects; they are the shape of the product.

### No isolation between authenticated users

- **There is no per-project authorization.** Almost every functional endpoint is
  annotated `@Authenticated` with no role constraint. Any account — including a bare
  `platform-user` — can list, read, modify, copy and delete **every** project and
  project file, start and stop **any** devmode container, trigger builds, roll out and
  delete **any** deployment, and stream **any** container's logs. *(documented — the
  annotation survey across `ProjectResource`, `ProjectFileResource`, `DevModeResource`,
  `ContainerResource`, `InfrastructureResource`, `StatusResource`, `LogWatchResource`.)*
- **The `platform-user` / `platform-developer` / `platform-admin` roles do not tier
  functional access.** They gate only the `/ui/access` administration surface. See
  "false friends" below.
- **API-token project scoping is recorded but not enforced.** `allowedProjectIds` is
  stored on the token and attached to the identity as an attribute, but no endpoint
  reads it. A token scoped to one project has the same reach as one scoped to `*`.
  *(inferred — `grep` finds no consumer of the `allowedProjectIds` identity attribute;
  §4.14 Q4.)*
- **Username path parameters are not checked against the caller.**
  `/ui/notification/user/{username}` and `/ui/logwatch/{type}/{name}/{username}` take a
  username from the path. *(inferred — §4.14 Q4.)*

### No confidentiality of platform configuration from authenticated users

- `GET /ui/diagnostics/env-vars` and `/ui/diagnostics/app-props` enumerate every
  environment variable and MicroProfile Config key, and the `/{name}` variants return
  the **values** — base64-wrapped, which is encoding, not protection. Any authenticated
  user can therefore read `KARAVAN_GIT_PASSWORD`, `KARAVAN_DATASOURCE_PASSWORD`,
  `karavan.container-image.registry-password`, and the Keycloak backend secret.
  *(documented — `DiagnosticResource`.)*
- `GET /ui/infrastructure/secrets` returns Kubernetes `Secret` objects from the
  namespace to any authenticated user. *(documented — `InfrastructureResource`.)*

Both are consistent with the trust model — a route author who can bind-mount the host
already has these — but they must not be mistaken for protected surfaces.

### No sandbox around user-authored deployment artifacts

- A project's `docker-compose.yaml` controls image, `bind` mounts, published ports and a
  `/bin/sh -c` command. *(documented — `DockerService.createContainer`,
  `DockerComposeConverter`.)*
- `configuration/build.sh` is an ordinary project file, editable through `/ui/file`, that
  is copied into the builder container mode `0755` and executed for every build.
  *(documented — `CodeService.getConfigurationText`, `DockerForKaravan.runBuildProject`.)*
- `configuration/builder.pod.jkube.yaml` is likewise a user-editable pod spec applied to
  the cluster.

### No transport or platform hardening

- **Karavan does not terminate TLS.** The reference Helm chart defaults `ingress.tls` to
  `false`; the reference compose file publishes `8080` in the clear.
- **No rate limiting** on login or on any other endpoint beyond the per-account lockout.
- **No quota** on containers, builds, projects, or file sizes.
- **No audit log of security-relevant events.** `ActivityFilter` publishes presence and
  project-touch events to an event bus for the UI's "who is working on what" display; it
  is telemetry, not an audit trail. *(inferred — §4.14 Q12.)*
- **No secret redaction in logs.** *(inferred — §4.14 Q12.)*
- **No constant-time comparison** outside bcrypt's own verification. Token lookup is a
  hash-map hit on a SHA-256 digest.

### False friends — things that look like security controls but are not

| Looks like | Actually is |
| --- | --- |
| **`component-blocklist.txt` (344 entries)** | A **UI curation list**, not a security control. It is served to the designer to hide components, it lives in the user-editable `configuration` project *(documented — `webui/src/services/ProjectService.ts`)*, and nothing in the backend or in `karavan-devmode` refuses to *run* a blocklisted component. Do not treat it as an allow-list enforcement point. |
| **The `csrf` cookie** | Karavan mints a CSRF token, stores it on the session, and returns it in a JS-readable cookie — but **no server-side handler was found that validates it** against an incoming header. *(inferred — §4.14 Q9.)* Its presence should not be read as evidence that CSRF is defended. |
| **`platform-admin` / `platform-developer` / `platform-user`** | A three-tier RBAC scheme that tiers **only** `/ui/access`. It is not a functional privilege ladder; see above. |
| **`Secure` / `HttpOnly` on the session cookie** | Cookie attributes, not TLS enforcement. Karavan will happily run without TLS; the browser then simply declines to send the cookie. |
| **The `platform-service-account` role** | Never appears in any `@RolesAllowed`. It is a label, not a restriction; a token satisfies `@Authenticated` everywhere. *(inferred — §4.14 Q4.)* |
| **SHA-256 hashing of API tokens** | Storage protection against database disclosure. It is a fast unsalted digest, appropriate here only because the token is 32 bytes of `SecureRandom` — it would be inadequate for anything low-entropy. |
| **Git as "source of truth"** | An availability and history mechanism. It is not integrity verification: commits are not signed or verified, and whatever is in the repo is imported as trusted code. *(inferred — §4.14 Q3.)* |

### Well-known attack classes Karavan does not defend against

- **CSRF** against a logged-in operator's browser — see §4.14 Q9.
- **Stored XSS** in the designer, if any project-file content is rendered as HTML. The
  designer's content is route-author input, so under the trust model this is
  self-inflicted; it becomes interesting only if it crosses between users, which — given
  the absence of project isolation — it would. *(inferred — §4.14 Q9.)*
- **Supply-chain substitution of `karavan.devmode.image`** — the devmode image tag is an
  operator-set config value and is pulled and run without digest pinning.
- **SSRF via Camel components** inside a running route — Camel's model, not Karavan's.
- **Credential stuffing** across the shared `admin` account.

---

## 4.10 Operator responsibilities

This is a contract, not a tutorial. For Karavan's model to hold, the operator must:

1. **Change `platform.password` before first start**, or delete the seeded `admin` and
   `developer` accounts immediately after. The install docs ship a known default and link
   to it. *(inferred — §4.14 Q1)*
2. **Put Karavan behind TLS.** Session cookies are `Secure`; without TLS, login does not
   work off `localhost` anyway. Set `ingress.tls: true` and `tlsSecretName` in the Helm
   values.
3. **Never expose Karavan to an untrusted network.** Treat the HTTP port as you would a
   Jenkins controller or a Kubernetes dashboard.
4. **Grant a Karavan login only to people you would grant root on the Docker host, or
   admin on the Kubernetes namespace.** There is no lesser tier. This is the single most
   important line in this document.
5. **Scope the Git credential to Karavan's own repository.** Karavan hands
   `GIT_USERNAME` / `GIT_PASSWORD` to every build container's `git credential approve`
   *(documented — `karavan-devmode/entrypoint.sh`)*. A broadly-scoped PAT is exposed to
   anything running there.
6. **Scope the registry credential to Karavan's own image group**, for the same reason —
   it is passed as `-Djib.to.auth.password` on a Maven command line inside the builder.
7. **Network-isolate `/platform/internal/*`** from anything but Karavan's own build and
   devmode containers.
8. **When setting `platform.auth=oidc`, also set `quarkus.oidc.tenant-enabled=true`.**
   The property file says so; nothing enforces it.
9. **Reconsider `quarkus.kubernetes-client.trust-certs=true`** for any cluster that is
   not a local minikube.
10. **Rotate and revoke API tokens.** They default to 30 days and to `*` project scope,
    and the scope is not enforced (§4.9).
11. **Restrict write access to the Git repository** to exactly the population allowed to
    log into Karavan — a repo write is equivalent to an authenticated Karavan action.
12. **Review `configuration/build.sh` and `configuration/builder.*.yaml`** as you would
    review CI pipeline definitions. They are executable code, and any Karavan user can
    change them.

---

## 4.11 Known misuse patterns

- **Exposing Karavan on the public internet, or on a broad corporate network.** *What it
  looks like:* an ingress without an auth proxy, or a `NodePort`. *Why it is unsafe:* the
  only thing between an anonymous peer and host-level code execution is one password
  form with a shipped default. *Instead:* private network plus VPN or an authenticating
  reverse proxy.
- **Running with the shipped `admin` password.** *Instead:* set `platform.password`, or
  use `platform.auth=oidc`.
- **Treating Karavan roles as a permission tier.** *What it looks like:* granting
  `platform-user` to contractors on the theory that it is read-only. *Why it is unsafe:*
  `platform-user` can start a container with an arbitrary image, an arbitrary bind mount
  and an arbitrary shell command. *Instead:* run separate Karavan instances per trust
  group.
- **Treating Karavan as multi-tenant.** *What it looks like:* several teams sharing one
  instance and expecting project separation. *Why it is unsafe:* every project is visible
  and writable to every account. *Instead:* one instance per team.
- **Handing Karavan an organisation-wide Git PAT or registry credential.** *Why it is
  unsafe:* the credential is materialised inside every build container. *Instead:* a
  deploy key or a repo-scoped token.
- **Setting `platform.auth=oidc` and stopping there.** *Why it is unsafe:*
  `quarkus.oidc.tenant-enabled` is still `false`, so the intended mechanism does not
  engage. *Instead:* set both.
- **Reading `component-blocklist.txt` as a security control.** *Why it is unsafe:* it is
  a UI hint in a user-editable file. *Instead:* if a component must not run, do not give
  the person a Karavan account.
- **Copying `docs/install/*` into production unmodified.** *Why it is unsafe:*
  placeholder credentials, TLS off, PostgreSQL published on `5432`, registry published on
  `5555`. *Instead:* treat them as a getting-started illustration.

---

## 4.11a Known non-findings (recurring false positives)

These are what scanners, secret detectors and AI reviewers report against Karavan that
are **not** bugs given this model. Suitable for use verbatim as a suppression list.

- **"Hardcoded credentials in `application.properties`"** — `platform.password`,
  `karavan.git.password`, `karavan.datasource.password`,
  `karavan.keycloak.backend.secret`. These are development defaults for a self-contained
  local stack, overridden by `KARAVAN_*` environment variables in every documented
  deployment. **The one exception is `platform.password`**, whose default *is* the
  documented first-login credential — that is §4.14 Q1 and is not settled.
- **"Hardcoded credentials in `docs/install/karavan-helm/values.yaml` /
  `karavan-kubernetes/secret.yaml`"** — placeholder values in reference manifests. Out of
  scope per §4.3.
- **"Command injection: `/bin/sh -c` in `DockerService.createContainer`"** — the command
  originates from a project's `docker-compose.yaml`, which is trusted route-author input
  per §4.6. Not reachable by the §4.7 adversary.
- **"Arbitrary file write / host bind mount via `MountType.valueOf(...)`"** — same origin,
  same disposition.
- **"Arbitrary script execution: `build.sh` copied at mode 0755 and executed"** — same;
  `configuration/build.sh` is trusted input.
- **"Overly permissive RBAC: `verbs: ["*"]` and `pods/exec` in `role.yaml`"** — the
  privilege Karavan requires to do its job, namespace-scoped. §4.3.
- **"Docker socket mounted into a container"** — likewise, and documented as such in the
  compose file's own comment. §4.3.
- **"Insecure registry: `-Djib.allowInsecureRegistries=true`"** — targets the bundled
  in-cluster `registry:2`. A §4.5a knob in a user-editable file.
- **"TLS verification disabled: `quarkus.kubernetes-client.trust-certs=true`"** — a
  §4.5a knob with a minikube-oriented default; report against it as a *default* choice,
  not as a code defect (§4.14 Q6).
- **"Authenticated user can reach privileged functionality"** — by design; §4.7. Includes
  every report of the form "logged-in user achieves RCE / reads secrets / deletes another
  project".
- **"Base64 used for encoding secrets in `DiagnosticResource`"** — base64 is transport
  encoding here and is not claimed as protection; the underlying disclosure is disclaimed
  in §4.9.
- **"Unpinned container image `karavan.devmode.image`"** — an operator configuration
  value; §4.9.
- **Third-party CVEs in transitive dependencies** with no demonstrated path from the §4.7
  adversary to a §4.8 property. §4.3.

---

## 4.12 Conditions that would change this model

Revise when any of these happens — not for internal refactors:

- **A per-project or per-user authorization layer is added**, or `allowedProjectIds`
  becomes enforced. This would move most of §4.9's first block into §4.8 and make
  cross-project access a `VALID` finding.
- **Karavan gains a supported multi-tenant or internet-facing deployment mode.**
- **A new unauthenticated endpoint is added**, or the `@PermitAll` /
  `quarkus.http.auth.permission.public.paths` set is widened.
- **`quarkus.security.jaxrs.deny-unannotated-endpoints` is changed**, or a new
  authentication mechanism is registered alongside the two in `api/`.
- **CSRF validation is implemented**, or the `csrf` cookie is removed.
- **The default of a §4.5a knob changes** — above all `platform.password` and
  `platform.auth`.
- **Karavan begins accepting input from a party other than an authenticated user or its
  own Git remote** — a webhook receiver, an inbound event API, a public template gallery.
- **`karavan-generator` or the VS Code extension is promoted into the server's runtime
  path.**
- **A report arrives that cannot be routed to exactly one §4.13 disposition.** That is
  evidence of a `MODEL-GAP`; the correct response is to add the property to §4.8 or §4.9,
  not to make an ad-hoc call.

---

## 4.13 Triage dispositions

A report, tool finding, or AI analysis judged against this model receives exactly one of:

| Disposition | Meaning | Licensed by |
| --- | --- | --- |
| `VALID` | Violates a §4.8 property, reachable by the §4.7 adversary through a §4.6 attacker-controllable input. | §4.6, §4.7, §4.8 |
| `VALID-HARDENING` | No §4.8 property is violated, but a §4.11 misuse is made easy enough that Karavan elects to harden. Fixed at maintainer discretion; normally no CVE. | §4.11 |
| `OUT-OF-MODEL: trusted-input` | Requires control of an input §4.6 marks trusted — a project file, `build.sh`, a compose file, the Git repo, the registry. | §4.6 |
| `OUT-OF-MODEL: adversary-not-in-scope` | Requires an authenticated Karavan session, an operator action, or host/cluster access. **The most common disposition.** | §4.7 |
| `OUT-OF-MODEL: unsupported-component` | Lands in `karavan-generator/`, `release-utils/`, `docs/install/*`, or repo dev tooling. | §4.3 |
| `OUT-OF-MODEL: non-default-build` | Only manifests under a non-default or discouraged §4.5a setting. | §4.5a |
| `OUT-OF-MODEL: camel-core` | Concerns a running route, a Camel component, or exchange data — the Apache Camel security model's territory. Route to `apache/camel`. | §4.3 |
| `BY-DESIGN: property-disclaimed` | Concerns a property §4.9 explicitly does not provide, including the false friends. | §4.9 |
| `KNOWN-NON-FINDING` | Matches a documented recurring false positive. | §4.11a |
| `MODEL-GAP` | Routes to none of the above. Escalate; revise the model. | triggers §4.12 |

---

## 4.14 Open questions for the maintainers

Every question below states a **proposed answer**. Confirm, correct, or strike it. When
a question is answered, the matching *(inferred)* tags in the body are promoted to
*(maintainer)* and the question is deleted.

### Wave 1 — scope and the insecure default (blocking)

**Q1. The default admin password.** *Proposed:* `platform.password=K@r@v@n422` seeding
`admin` and `developer` is a getting-started convenience, and operators are expected to
override it; a report of "default credentials" is therefore `OUT-OF-MODEL:
non-default-build`. **However**, `docs/WEB_DOCKER.md` and `docs/WEB_KUBERNETES.md`
present it as *the* first-login credential and link straight to the source line, with no
instruction to change it. Which is it — supported production posture (making such reports
`VALID`), or dev-only (making them out of model, and making the docs a gap to close)?
→ lands in §4.5a, §4.10, §4.13.

**Q2. Is "any authenticated user is fully trusted" the intended model?** *Proposed:* yes.
A Karavan account is the Camel security model's "route author", declared fully trusted
there; Karavan therefore does not treat one user attacking another as a vulnerability,
and the absence of per-project authorization is a scope decision rather than a gap.
→ lands in §4.2, §4.7, §4.9.

**Q3. Are the Git repository and the image registry trusted inputs?** *Proposed:* yes.
Karavan imports whatever the repo holds as code, does not verify commit signatures, and
pulls images by tag. A malicious repo or registry is out of the adversary model.
→ lands in §4.3, §4.6, §4.7.

**Q4. Is API-token project scoping meant to be enforced?** `allowedProjectIds` is
persisted on the token, documented in `AccessToken` as "Scoped access limits (ABAC)", and
attached to the identity — but no endpoint reads it, and `ROLE_SERVICE_ACCOUNT` appears in
no `@RolesAllowed`. Likewise `/ui/notification/user/{username}` and
`/ui/logwatch/.../{username}` take a username from the path without comparing it to the
caller. *Proposed:* these are forward-looking scaffolding, not current guarantees, and
§4.9 should say so plainly. → lands in §4.8 or §4.9.

**Q5. The negative side-effect inventory.** *Proposed:* on its own host, `karavan-app`
installs no signal handlers, spawns no child processes, reads no host filesystem paths
beyond its classpath, the two configured SSH files, and Vert.x temp directories, and
listens on no port but the configured HTTP one. Are all four deliberate guarantees, or
merely true today? Also: is the PostgreSQL connection assumed to be on a trusted network,
and is any behaviour claimed for concurrent edits to the same project file?
→ lands in §4.5.

### Wave 2 — configuration variants and resource limits

**Q6. Which §4.5a defaults are supported production posture?** Specifically:
`quarkus.kubernetes-client.trust-certs=true`; Helm `ingress.tls: false`;
`-Djib.allowInsecureRegistries=true` in the shipped `build.sh`; and the requirement to
set `quarkus.oidc.tenant-enabled=true` alongside `platform.auth=oidc`. *Proposed:* all
four are local-development conveniences that operators are expected to change, and the
fourth should be enforced at startup rather than left to a comment. → lands in §4.5a,
§4.10.

**Q7. Where is the line on resource consumption?** *Proposed:* consistent with the Camel
security model, DoS through resource exhaustion is out of scope, and there is no cap on
concurrent devmode containers, builds, projects, file sizes, or request rate. Is an
unauthenticated request that causes unbounded allocation nonetheless a bug? → lands in
§4.3, §4.8.

**Q8. What is the intended unauthenticated surface, exactly?** *Proposed:* precisely
`/ui/auth/type`, `/ui/auth/sso-config`, `/ui/auth/login`, `/ui/auth/logout`,
`/public/readiness`, `/platform/internal/sources/**`, and the static SPA assets — nothing
else, ever. Is disclosing the Keycloak URL, realm and client ID pre-authentication
intended? → lands in §4.6, §4.8.

### Wave 3 — browser-side threats and operational surface

**Q9. Is the browser an adversary channel?** The `csrf` cookie is minted and stored on
the session, but no server-side validation of it was found. *Proposed (a):* CSRF is in the
model, the validation is simply missing, and a working CSRF proof-of-concept against a
state-changing `/ui/*` endpoint is `VALID`. *Proposed (b):* the browser is not an adversary
channel at all, the cookie is vestigial, and it should be removed so it stops reading as a
control. Which? The same question decides whether stored XSS in the designer is `VALID` or
`BY-DESIGN`, and whether timing side channels are in scope. → lands in §4.7, §4.9.

**Q10. Is opening an untrusted workspace in the VS Code extension supported?**
*Proposed:* no — the extension assumes the developer trusts the workspace they open, in
line with VS Code's own Workspace Trust model, and crafted Camel YAML in a cloned repo is
out of scope. → lands in §4.2.1, §4.4.

**Q11. Is the non-invalidating `/platform/internal/sources/{projectId}/{filename}` route
deliberate?** Its sibling invalidates the builder session in a `finally` block; this one
does not. *Proposed:* an oversight rather than a design choice, and §4.8 property 9 should
apply to both. → lands in §4.8.

**Q12. Is there meant to be an audit trail?** *Proposed:* no. `ActivityFilter` is UI
presence telemetry, not audit, and Karavan makes no claim about recording who deployed or
deleted what, nor about redacting secrets from logs. If audit is intended, it belongs in
§4.8. → lands in §4.9.

### Wave 4 — document ownership

**Q13. Where should this document live, and how does it relate to the Camel security
model?** The Camel security model at `camel.apache.org/manual/security-model.html` scopes
itself to `apache/camel` artifacts and notes that sibling subprojects have their own
security surfaces; Karavan is not named. *Proposed:* this document becomes Karavan's own
model, is linked from the Camel security page's subproject list, and inherits Camel's
role vocabulary (route author / operator / external sender) without restating it.
Karavan has no `SECURITY.md`; should one be added pointing at `security@apache.org` and
at this file? → lands in §4.1.

**Q14. Who owns revisions, and does the model ship with releases?** *Proposed:* the
Karavan committers own it; it is updated in the same PR as any change that hits §4.12's
trigger list, and is tagged with each release so a report against 4.22.0 is triaged
against the 4.22.0 model.

---

## Appendix A — back-map to the Apache Camel security model

Karavan has no `SECURITY.md` of its own. The nearest maintainer-authored security policy
in the Camel family is the Apache Camel security model. It does not claim Karavan, but
this model deliberately inherits its vocabulary so that a triager moving between the two
does not have to re-derive the roles.

| Camel security model statement | Where it lands here |
| --- | --- |
| Applies to artifacts released from `apache/camel`; sibling subprojects have their own security surfaces | §4.3 — establishes that Karavan needs this document; §4.14 Q13 |
| Trust boundary separates the route and operator configuration from the data flowing through the route | §4.4 — Karavan's boundary sits one layer earlier, at HTTP authentication |
| Route authors are fully trusted and may execute arbitrary code | §4.2, §4.7 — extended to "any authenticated Karavan user" |
| Deployment operators are fully trusted | §4.2, §4.10 |
| External message senders are the primary adversary | §4.3 — out of Karavan's model; that is Camel's adversary, not Karavan's |
| Operator misconfiguration (TLS disabled, exposed management surfaces) is out of scope | §4.3, §4.10 — Karavan takes the same position |
| Denial of service through resource exhaustion is out of scope | §4.3, §4.14 Q7 |
| Management surface operations (JMX, Jolokia, developer console) are out of scope | §4.9 — Karavan's `/ui/diagnostics` and devmode console are the analogue |
| Transitive third-party CVEs are out of scope | §4.3, §4.11a |
| Non-default settings requiring explicit opt-in are out of scope | §4.5a, §4.13 `OUT-OF-MODEL: non-default-build` |
| Hardening advice: explicit `prod` profile, vaults for secrets, TLS via SSLContextParameters, least privilege | §4.10 — Karavan's operator contract is the parallel list |
