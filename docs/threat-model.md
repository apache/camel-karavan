# Apache Camel Karavan — Threat Model

| | |
| --- | --- |
| **Project** | Apache Camel Karavan |
| **Version / commit** | 4.22.0 plus post-release hardening on `main` — `677a293a` |
| **Date** | 2026-09-08 |
| **Status** | **Maintainer-reviewed.** Waves 1–3 answered by @mgubaidullin on 2026-09-01 (apache/camel-karavan#1642). Two questions on document ownership remain open (§4.14). |
| **Author** | Drafted with the ASF Security `threat-model-producer` rubric; ratified by the Karavan maintainers. |

## Version binding

This model is versioned alongside the project and should be tagged with releases. A
report filed against Karavan version *N* is triaged against the model as it stood at
*N*, not against HEAD.

**This revision is bound to `main` after 4.22.0, not to the 4.22.0 release itself.**
Three controls described here — CSRF validation (§4.8 property 13), project-file name
validation (property 14), and Kubernetes resource validation (§4.5a, §4.9) — landed in
`d211d71f` and `5e425249` *after* the 4.22.0 tag. A report filed against 4.22.0 or
earlier is triaged against a model in which those three do not exist.

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
| *(maintainer)* | Stated by a Karavan maintainer in response to this process. Dated. |
| *(inferred)* | Reasoned from code structure or the absence of a feature. Not yet confirmed; has a matching question in §4.14. |

## Confidence

**57 documented / 40 maintainer / 0 inferred.** Every hypothesis in the first draft has
been confirmed, corrected, or superseded by a maintainer answer; nothing in the body is
unratified. The two questions still open in §4.14 concern who owns this document and how
it is revised — neither affects a claim made here.

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
*(maintainer, 2026-09 — §4.14 Q1)* It is not a multi-tenant SaaS product, and it is not an
appliance intended to face the public internet.

### Caller roles

Karavan is a service, not a library, so "the caller" splits into four roles. These map
onto the vocabulary already established by the Apache Camel security model
*(documented — <https://camel.apache.org/manual/security-model.html>)*:

| Role | Trust | Notes |
| --- | --- | --- |
| **Operator / deployer** | Fully trusted | Installs Karavan, sets `platform.auth`, supplies Git and registry credentials, mounts `docker.sock` or binds the Kubernetes `Role`. Equivalent to the Camel model's "deployment operator". |
| **Authenticated Karavan user** | **Fully trusted** | Any account with any of `platform-user` / `platform-developer` / `platform-admin`. Equivalent to the Camel model's "route author", which that model declares fully trusted and able to execute arbitrary code by design. |
| **Service-account token holder** | **Fully trusted** | A `platform-service-account` identity created from `/ui/access/tokens`. Functionally equivalent to an authenticated user for everything except the `/ui/access` administration surface. *(maintainer, 2026-09 — §4.14 Q4)* |
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
  repository, one database, and one Docker network or Kubernetes namespace. *(maintainer, 2026-09
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
  §4.6. *(maintainer, 2026-09 — §4.14 Q3)*
- **Denial of service through resource exhaustion.** Consistent with the Camel model,
  which places DoS out of scope. Karavan places no quota on how many devmode or build
  containers a user may start. *(maintainer, 2026-09 — §4.14 Q7)*
- **Transitive third-party CVEs**, absent a demonstrated path from an in-scope adversary
  to a Karavan-claimed property. *(maintainer, 2026-09 — §4.14 Q3)*

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
  workspace, not by the developer's own explicit command invocation. *(maintainer, 2026-09 — §4.14 Q10)*

---

## 4.5 Assumptions about the environment

- **Runtime.** JVM 21, Quarkus. *(documented — `karavan-devmode/Dockerfile` uses
  `ubi9/openjdk-21`; `karavan-app/pom.xml`.)*
- **Persistence.** A PostgreSQL instance, reachable and trusted. Flyway migrates the
  schema at startup. *(documented — `application.properties`.)* The database is
  assumed to be on a private network; Karavan does not encrypt its own rows.
  *(maintainer, 2026-09 — §4.14 Q5)*
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
  `Instant.now()`. A backwards clock jump extends credential lifetime. *(maintainer, 2026-09 —
  §4.14 Q5)*
- **Concurrency.** The API is stateless per request; shared state lives in
  `KaravanCache` backed by PostgreSQL. No claim is made about behaviour under concurrent
  writes to the same project file — last write wins. *(maintainer, 2026-09 — §4.14 Q5)*

### What Karavan does *not* do to its host

These are **negative claims**, almost never written down anywhere. The maintainers have
confirmed each is accurate today but have **not** committed to them as invariants — "that
is just how it is today and we do not have any plans to change that". Treat them as an
accurate description of the current release rather than a promise a future one will keep,
and re-verify them whenever §4.12 is triggered. *(maintainer, 2026-09 — §4.14 Q5)*

- Does **not** install signal handlers or otherwise mutate process-global state beyond
  what Quarkus itself does. *(maintainer, 2026-09 — §4.14 Q5)*
- Does **not** spawn child processes on the Karavan host. All execution is delegated to
  the container platform; there is no `Runtime.exec` / `ProcessBuilder` in
  `karavan-app`. *(maintainer, 2026-09 — §4.14 Q5; verified by absence in the source tree)*
- Does **not** read arbitrary host filesystem paths. It reads only its own classpath
  resources and the two operator-configured SSH paths (`karavan.private-key-path`,
  `karavan.known-hosts-path`), plus Vert.x temp directories for Git clones. *(maintainer, 2026-09 — §4.14 Q5)*
- Does **not** listen on any port other than the configured HTTP port. *(maintainer, 2026-09 — §4.14 Q5)*
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
| `platform.auth` | `session` | `session` uses Karavan's own bcrypt user store and cookie sessions. `oidc` delegates to Keycloak and takes roles from the access token. *(documented — `application.properties`, `CookieSessionAuthMechanism`)* | Both are supported. *(maintainer, 2026-09)* |
| `quarkus.oidc.tenant-enabled` | `false` | **Must be flipped to `true` when `platform.auth=oidc`.** The property file says so in a comment. If `platform.auth=oidc` is set without it, `CookieSessionAuthMechanism` returns null and OIDC is disabled — the resulting posture is undefined. *(documented — `application.properties` comment: "Important! Set `quarkus.oidc.tenant-enabled=true` for `platform.auth=oidc`")* | Operator responsibility; a deployment that sets one without the other is misconfigured, and reports against it are out of model. *(maintainer, 2026-09)* |
| `platform.password` | `K@r@v@n422` | Seeds the `admin` and `developer` accounts on first start. Intended to be set at install time through Kubernetes secrets or Docker environment variables, and changed afterwards through the UI. *(documented — `AuthService.loadDefaults`, `docs/WEB_DOCKER.md`, `docs/WEB_KUBERNETES.md`)* | **A dev/install convenience, not a supported production posture.** A report against the shipped default is `OUT-OF-MODEL: non-default-build`. *(maintainer, 2026-09)* |
| `quarkus.security.jaxrs.deny-unannotated-endpoints` | `true` | Deny-by-default on the JAX-RS surface: an endpoint with no security annotation is refused rather than exposed. Flipping it to `false` voids the §4.8 authorization property wholesale. *(documented — `application.properties`)* | Must stay `true`. *(maintainer, 2026-09)* |
| `quarkus.http.auth.permission.public.paths` | `/public/*,/static/*,/robots.txt,/favicon.ico`, GET only | The unauthenticated surface. Widening it moves the §4.4 boundary. *(documented)* | The listed surface is deliberate, pre-login SSO disclosure included. *(maintainer, 2026-09)* |
| `quarkus.kubernetes-client.trust-certs` | `true` | Disables TLS certificate verification against the Kubernetes API server. Suits minikube; means Karavan will not detect a MitM on the API-server connection. *(documented — `application.properties`)* | Operator responsibility. *(maintainer, 2026-09)* |
| `ingress.tls` (Helm) | `false` | Session cookies are marked `secure`, so with TLS off the browser will not send them — login effectively requires TLS or a plaintext-localhost origin. *(documented — `values.yaml`, `AuthResource`)* | Operator responsibility. *(maintainer, 2026-09)* |
| `karavan.devmode.createm2` | `false` | When true, adds a named Docker volume per project for the Maven repository. Cross-project cache sharing implications. *(documented — `DockerForKaravan`)* | Not security-relevant under §4.7 — all projects share one trust domain. *(maintainer, 2026-09)* |
| `configuration/build.sh` | ships with `-Djib.allowInsecureRegistries=true` | Permits pushing built images to a registry over plaintext HTTP. Suits the bundled `registry:2`. *(documented — `karavan-app/src/main/resources/configuration/docker/build.sh`)* | Operator responsibility. *(maintainer, 2026-09)* |
| `karavan.deployment.allowed-kinds` | `Deployment,Service,ConfigMap,Secret,Ingress` | Restricts which resource kinds a project's `kubernetes.yaml` may apply, and rejects pod specs asking for `hostNetwork`, `hostPID`, `hostIPC`, `hostPath` volumes, `hostPort`, `privileged`, `allowPrivilegeEscalation`, or added capabilities. Namespace is pinned to Karavan's own regardless of what the file says. Added post-4.22.0. *(documented — `KubernetesService.validateDeploymentResource`, `validatePodSpec`)* | Defence in depth, **not** a security boundary — see §4.9. Widen it only alongside the matching RBAC. *(maintainer, 2026-09)* |
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
of concurrent devmode containers, or request rate. *(maintainer, 2026-09 — §4.14 Q7)*

---

## 4.7 Adversary model

**The adversary in scope is the unauthenticated network peer** who can reach Karavan's
HTTP port. Their goal is to obtain an authenticated identity — because an authenticated
identity is, by design, equivalent to code execution on the host. *(maintainer, 2026-09 — §4.14 Q2)*

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
  *(maintainer, 2026-09 — §4.14 Q9)*

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
- **A compromised Git remote or image registry.** Both are trusted inputs. *(maintainer, 2026-09 —
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
**not** invalidate its session, **by design** — the single-use guarantee is scoped to the
whole-project route only, and a report that the per-file route reuses a session is
`BY-DESIGN: property-disclaimed`. *(maintainer, 2026-09 — corrects the first draft, which
proposed this was an oversight.)*

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

**13. Cookie-authenticated state-changing requests are CSRF-protected.** Every unsafe
method (anything but `GET`/`HEAD`/`OPTIONS`/`TRACE`) carrying a `sessionId` cookie must
also carry the session's token in an `X-CSRF-Token` header. This is the synchronizer-token
check — the header is compared against the token held server-side on the session, not
against the `csrf` cookie, so a token planted by an attacker controlling a sibling
subdomain does not satisfy it. Comparison is constant-time. Logout is deliberately **not**
exempt; only `ui/auth/login` is, having no session to bind to yet. *(documented —
`CsrfFilter`, added post-4.22.0 in `d211d71f`.)*
*Conditions:* `platform.auth=session` only. Bearer/API-key requests are exempt — a browser
never attaches those on its own — as are requests whose session belongs to a builder or
devmode container rather than a user.
*Violation symptom:* a cross-origin page causes a state change using only the victim's
ambient session cookie.
*Severity:* **security-critical.**

**14. Project ids and file names are validated before use as path segments.** Rejected if
empty, containing `..`, `/`, `\`, or NUL, or not matching `^[a-zA-Z0-9_\-.]+$`. Enforced
on file create, update, rename and copy. *(documented — `PathUtils.validateName`,
`ProjectFileResource`; added post-4.22.0 in `5e425249`.)*
*Conditions:* covers the `/ui/file` write paths.
*Violation symptom:* a project id or file name that escapes its parent directory on disk
or in the Git working copy.
*Severity:* **security-critical.**

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
  *(maintainer, 2026-09 — `grep` finds no consumer of the `allowedProjectIds` identity attribute;
  §4.14 Q4)*
- **Username path parameters are not checked against the caller.**
  `/ui/notification/user/{username}` and `/ui/logwatch/{type}/{name}/{username}` take a
  username from the path. *(maintainer, 2026-09 — §4.14 Q4)*

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

Post-4.22.0, the **Kubernetes deployment path alone** gained a validation pass: a project's
`kubernetes.yaml` may only carry the kinds in `karavan.deployment.allowed-kinds`, its pod
specs may not request `hostNetwork`, `hostPID`, `hostIPC`, `hostPath`, `hostPort`,
`privileged`, `allowPrivilegeEscalation` or added capabilities, and the namespace is pinned
to Karavan's own. *(documented — `KubernetesService.validateDeploymentResource`.)*
**This is defence in depth against a careless route author, not a security boundary**, and
it must not be read as one: it does not cover the builder pod path
(`KubernetesService.runBuildProject`), `configuration/build.sh`, or any part of the Docker
path, where a compose file still controls image, bind mounts, ports and the shell command.
A user who wants host access simply uses one of those instead. *(maintainer, 2026-09 —
§4.14 Q2 confirms the trust model this sits inside.)*

### No transport or platform hardening

- **Karavan does not terminate TLS.** The reference Helm chart defaults `ingress.tls` to
  `false`; the reference compose file publishes `8080` in the clear.
- **No rate limiting** on login or on any other endpoint beyond the per-account lockout.
- **No quota** on containers, builds, projects, or file sizes.
- **No audit log of security-relevant events.** `ActivityFilter` publishes presence and
  project-touch events to an event bus for the UI's "who is working on what" display; it
  is telemetry, not an audit trail. *(maintainer, 2026-09 — §4.14 Q12)*
- **No secret redaction in logs.** *(maintainer, 2026-09 — §4.14 Q12)*
- **No constant-time comparison** outside bcrypt's own verification and the CSRF token
  check. API-token lookup is a hash-map hit on a SHA-256 digest.

### False friends — things that look like security controls but are not

| Looks like | Actually is |
| --- | --- |
| **`component-blocklist.txt` (344 entries)** | A **UI curation list**, not a security control. It is served to the designer to hide components, it lives in the user-editable `configuration` project *(documented — `webui/src/services/ProjectService.ts`)*, and nothing in the backend or in `karavan-devmode` refuses to *run* a blocklisted component. Do not treat it as an allow-list enforcement point. |
| **`platform-admin` / `platform-developer` / `platform-user`** | A three-tier RBAC scheme that tiers **only** `/ui/access`. It is not a functional privilege ladder; see above. |
| **`Secure` / `HttpOnly` on the session cookie** | Cookie attributes, not TLS enforcement. Karavan will happily run without TLS; the browser then simply declines to send the cookie. |
| **The `platform-service-account` role** | Never appears in any `@RolesAllowed`. It is a label, not a restriction; a token satisfies `@Authenticated` everywhere. *(maintainer, 2026-09 — §4.14 Q4)* |
| **SHA-256 hashing of API tokens** | Storage protection against database disclosure. It is a fast unsalted digest, appropriate here only because the token is 32 bytes of `SecureRandom` — it would be inadequate for anything low-entropy. |
| **Git as "source of truth"** | An availability and history mechanism. It is not integrity verification: commits are not signed or verified, and whatever is in the repo is imported as trusted code. *(maintainer, 2026-09 — §4.14 Q3)* |

### Well-known attack classes Karavan does not defend against

- **Stored XSS** in the designer, if any project-file content is rendered as HTML. The
  designer's content is route-author input, so under the trust model this is
  self-inflicted; it becomes interesting only if it crosses between users, which — given
  the absence of project isolation — it would. *(maintainer, 2026-09 — §4.14 Q9)*
  (CSRF was on this list in the first draft. It is now defended — see §4.8 property 13.)
- **Supply-chain substitution of `karavan.devmode.image`** — the devmode image tag is an
  operator-set config value and is pulled and run without digest pinning.
- **SSRF via Camel components** inside a running route — Camel's model, not Karavan's.
- **Credential stuffing** across the shared `admin` account.

---

## 4.10 Operator responsibilities

This is a contract, not a tutorial. For Karavan's model to hold, the operator must:

1. **Set `platform.password` at install time** — through a Kubernetes secret or a Docker
   environment variable — and change it afterwards through the UI. The shipped default is
   an install convenience, not a supported production posture, so running on it is the
   operator's own risk rather than a Karavan defect. *(maintainer, 2026-09 — §4.14 Q1)*
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
  deployment. `platform.password` is the same: an install-time convenience that operators
  set via secret or environment variable and then change through the UI, so a report
  against the shipped default is `OUT-OF-MODEL: non-default-build`. *(maintainer, 2026-09)*
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
- **"Missing CSRF protection"** against a route that is safe (`GET`/`HEAD`/`OPTIONS`/
  `TRACE`), token-authenticated, or `ui/auth/login` — all three are deliberately exempt
  from `CsrfFilter`. §4.8 property 13.
- **"Path traversal in project id / file name"** on the `/ui/file` write paths —
  `PathUtils.validateName` rejects `..`, separators, NUL and anything outside
  `^[a-zA-Z0-9_\-.]+$` before the value is used. §4.8 property 14.
- **"Unrestricted Kubernetes resource application"** in `startDeployment` — kinds are
  allow-listed and host-level pod options rejected. This is *not* claimed as a boundary
  (§4.9), so a report that it is bypassable via the builder pod or the Docker path is
  `OUT-OF-MODEL: adversary-not-in-scope`, not a control bypass.
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
- **The `CsrfFilter` exemption set changes** — a new exempt path, or unsafe methods no
  longer requiring the token.
- **`PathUtils` validation is relaxed**, or a new write path bypasses it.
- **`karavan.deployment.allowed-kinds` is widened**, or the pod-spec restrictions in
  `validatePodSpec` are relaxed — and note §4.9 does not treat these as a boundary, so
  widening them is a posture change rather than a vulnerability.
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

Waves 1–3 were answered by @mgubaidullin on 2026-09-01 in apache/camel-karavan#1642 and
are folded into the body above; the resolution log is Appendix B. Two questions remain,
both about the document rather than about Karavan.

**Q13. Where should this document live, and how does it relate to the Camel security
model?** The Camel security model at `camel.apache.org/manual/security-model.html` scopes
itself to `apache/camel` artifacts and notes that sibling subprojects have their own
security surfaces; Karavan is not named. *Proposed:* this becomes Karavan's own model, is
linked from the Camel security page's subproject list, and inherits Camel's role
vocabulary without restating it. Karavan has no `SECURITY.md` — should one be added
pointing at `security@apache.org` and at this file, and should Karavan be added to the ASF
security site's `project-coordinates.json`? → lands in §4.1.

**Q14. Who owns revisions, and does the model ship with releases?** *Proposed:* the
Karavan committers own it; it is updated in the same PR as any change that trips a §4.12
trigger, and is tagged with each release so a report against 4.22.0 is triaged against the
4.22.0 model. This revision already spans two versions — it is bound to `main` after
4.22.0, and three of its properties do not exist in the 4.22.0 release — which is exactly
the drift the tagging policy is meant to prevent. → lands in §4.1, §4.12.

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

---

## Appendix B — resolution log

Answers from @mgubaidullin, 2026-09-01, on apache/camel-karavan#1642. Kept so that a
future reader can see which claims were ratified rather than assumed, and so that a
reporter who disputes a disposition can be pointed at the ruling behind it.

| # | Question | Outcome | Landed in |
| --- | --- | --- | --- |
| Q1 | Is the default `platform.password` a supported production posture? | **Confirmed as proposed** — install-time convenience, set via secret/env and changed through the UI. Reports against it are `OUT-OF-MODEL: non-default-build`. | §4.5a, §4.10, §4.11a |
| Q2 | Is any authenticated user fully trusted? | **Confirmed** — yes. | §4.2, §4.7, §4.9 |
| Q3 | Are the Git repository and image registry trusted inputs? | **Confirmed** — yes, fully trusted. | §4.3, §4.6, §4.7 |
| Q4 | Is API-token project scoping meant to be enforced? | **Confirmed** — forward-looking scaffolding for future features, not a current guarantee. | §4.9 |
| Q5 | Are the negative side-effect claims deliberate guarantees? | **Confirmed accurate, but not promised** — "that is just how it is today and we do not have any plans to change that". Recorded as description, not invariant. | §4.5 |
| Q6 | Which §4.5a defaults are supported posture? | **Confirmed** — insecure defaults are operator responsibility; reports against them are out of model. | §4.5a |
| Q7 | Where is the line on resource consumption? | **Confirmed** — DoS and resource exhaustion are out of model. | §4.3, §4.9 |
| Q8 | What is the intended unauthenticated surface? | **Confirmed** — pre-login disclosure of Keycloak/SSO config is by design. | §4.5a, §4.6 |
| Q9 | Is the browser an adversary channel, and is CSRF unvalidated? | **Superseded — fixed.** `CsrfFilter` (`d211d71f`) added synchronizer-token validation after 4.22.0. Promoted from a §4.9 false friend to §4.8 property 13. | §4.8, §4.9 |
| Q10 | Is opening an untrusted workspace in the VS Code extension supported? | **Confirmed** — malicious workspaces/repos are out of model. | §4.2.1, §4.4 |
| Q11 | Is the non-invalidating `/sources/{projectId}/{filename}` route an oversight? | **Corrected** — it is by design. The first draft's proposed answer was wrong. | §4.8 property 9 |
| Q12 | Is there meant to be an audit trail? | **Confirmed** — no; `ActivityFilter` is telemetry, and the absence of audit is by design. | §4.9 |
| Q13, Q14 | Document ownership and revision policy | **Open.** | §4.14 |

Two changes to the code landed alongside the answers and are described in the body:
`PathUtils` name validation (`5e425249`, §4.8 property 14) and the Kubernetes resource
allow-list plus pod-spec restrictions (§4.5a, §4.9). Neither existed in 4.22.0.
