# Decision Log

Records the architecture-level decisions on platform-kit: what was decided, why, and what we gave up.
Newest decisions go at the bottom.

**What belongs here:** choosing or replacing a tool or platform (e.g. Argo CD vs Flux), changes to
the architecture, and approaches that cut across the system (e.g. how secrets are handled).
**What doesn't:** config tweaks, variable or version changes, small library swaps, and
housekeeping. Those go in commit messages. A decision is never deleted; if it changes, mark it
**Superseded** and link to the replacement.

**Status values:** Proposed · Accepted · Superseded · Rejected

> Note: D-001 to D-006 were recorded retrospectively from the initial commit (2026-10-09).
> Their rationale is reconstructed and should be confirmed or corrected by the author.

| ID | Decision | Status |
|----|----------|--------|
| D-001 | Scope: a CLI plus templates for scaffolding services | Accepted |
| D-002 | Support Node.js and Python services, Node.js first | Accepted |
| D-003 | Kubernetes as the runtime target | Accepted |
| D-004 | Terraform for infrastructure | Accepted |
| D-005 | GitOps deployment with Argo CD | Accepted |
| D-006 | Build the CLI in Node.js, published via npm | Accepted |
| D-007 | AWS (EKS) first, with other cloud providers later | Accepted |
| D-008 | Open decisions not yet made | Proposed |

---

## D-001: Scope is a CLI plus templates for scaffolding services

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** platform-kit is a command-line tool that generates new services from templates,
so each new service starts from the same structure, deployment config and infrastructure setup.

**Why.**
- New services otherwise get set up by copying an old repo, which carries over drift and mistakes.
- Templates turn "how we build services" into one reviewed, versioned source.
- A CLI can be used locally and in CI, with no hosted portal to run.

**Trade-offs.**
- A generator only helps on day one. Services drift from the templates afterwards, and
  there's no built-in way to push template updates to services that already exist.
- Every template change has to be tested across each supported language.
- Rejected alternatives: a hosted developer portal such as Backstage (too heavy to run at
  this stage); a template repo with no CLI (no parameters and no validation).

---

## D-002: Support Node.js and Python services, Node.js first

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** Node.js comes first, built as two templates at the same time: JavaScript
(`templates/nodejs-service`) and TypeScript (`templates/nodejs-typescript-service`). Python follows
once the Node.js path works end to end (scaffold → CI → GitOps → running on the cluster).

**Why.**
- These two cover most web/API and data/ML workloads.
- Many teams standardise on TypeScript for new Node.js services, but plain JavaScript keeps the
  barrier low. Offering both lets the person scaffolding choose.
- Building JavaScript and TypeScript together tests the template structure early. TypeScript
  adds a build step (compile, then run `dist/`) that the Dockerfile and CI stages must handle,
  so differences between templates appear before Python does.
- Building one language end to end first proves the whole pipeline before effort is split
  across two.
- Planning for Python from the start keeps the template structure language-neutral. The
  language-specific parts (app code, Dockerfile, CI build steps) stay separate from the
  shared parts (Kubernetes manifests, Terraform module, monitoring).

**Trade-offs.**
- Until Python lands, nothing fully checks that the template structure is language-neutral.
  Some Node.js assumptions may need reworking.
- Three templates (JavaScript, TypeScript, Python) mean three sets of Dockerfiles, CI steps and
  dependencies to maintain. JavaScript and TypeScript duplicate a lot, so shared parts should be
  factored out rather than copied.
- The CLI needs a way to pick a template (e.g. a `--template` flag or a prompt).
- Other languages (Go, Java) are out of scope until the template structure is stable.

---

## D-003: Kubernetes as the runtime target

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** Generated services are containerised and deployed to Kubernetes.

**Why.**
- Kubernetes works the same way across cloud providers and locally (kind, minikube, k3d).
- Health checks, scaling, config and secrets work the same way for every service.
- Argo CD (D-005) needs a Kubernetes target.

**Trade-offs.**
- It takes real effort to run and to learn. That's too much for very small services that
  would be fine on a PaaS or serverless platform.
- Every template has to ship a Dockerfile and Kubernetes manifests that we maintain.
- Rejected alternatives: serverless (runtime differs per cloud and is hard to standardise);
  plain VMs (more manual operations work).

---

## D-004: Terraform for infrastructure

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** Clusters, networking and cloud resources are defined in Terraform.

**Why.**
- Infrastructure is declared in code and can be reviewed in PRs. `plan` shows changes before
  they are applied.
- One tool can manage more than one cloud provider.
- It's widely known, with a large ecosystem of modules and providers.

**Trade-offs.**
- We have to manage the state file: a remote backend, locking, and limited access to it.
- HashiCorp's BSL licence change is worth watching. OpenTofu is a drop-in alternative if
  that becomes a problem.
- Rejected alternatives: Pulumi (real programming languages, but a smaller community and
  harder to review); cloud-specific tools such as CloudFormation (lock us into one provider).

---

## D-005: GitOps deployment with Argo CD

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** Git holds the desired state of each deployment. Argo CD runs in the cluster,
watches the repo and applies changes to the cluster.

**Why.**
- Every deployment is a Git commit, so there's a full history and a rollback is a revert.
- CI doesn't need cluster credentials. Argo CD pulls changes in rather than CI pushing them.
- Argo CD detects drift and can correct it, and its UI shows deployment status.

**Trade-offs.**
- Argo CD is one more component to install, upgrade and secure in every cluster.
- Secrets can't sit in Git as plain text. This needs Sealed Secrets, SOPS or External Secrets
  (not decided yet, see D-008).
- Releases move one step further from the code: CI builds an image, then a commit updates the
  manifests.
- Rejected alternatives: Flux (similar, but has no built-in UI); `kubectl`/Helm applied from CI
  (simpler, but needs cluster credentials in CI and has no drift detection).

---

## D-006: Build the CLI in Node.js, published via npm

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** The CLI is a Node.js package, installed with `npm`/`npx`.

**Why.**
- `npx platform-kit` runs it without a separate install step.
- Node.js has mature libraries for CLIs, prompts and templating.
- Developers working on the Node.js templates already have Node installed.

**Trade-offs.**
- Python-only teams need Node.js installed to use the CLI.
- A single compiled binary (for example in Go) would have no runtime dependency at all, but
  the CLI would then be in a different language from either set of templates.
- Tests for the Python templates will probably run with pytest. That means two test
  toolchains in the repo.

---

## D-007: AWS (EKS) first, with other cloud providers later

- **Date:** 2026-10-09
- **Status:** Accepted

**Decision.** The first target is AWS: EKS for the cluster, ECR for images, VPC and IAM
through Terraform. Other cloud providers (e.g. GKE on GCP, AKS on Azure) will be added later.

**Why.**
- AWS is where the existing experience is, so the first version can focus on the platform
  rather than on learning a cloud.
- EKS is the most common managed Kubernetes in job descriptions for platform roles.
- Shipping one cloud end to end before adding others avoids abstracting too early.

**How this keeps multi-cloud possible.**
- Terraform is split into a cloud-specific layer (network, cluster, registry, IAM) and the
  layers above it. A new provider means a new cloud layer, not a rewrite.
- Everything from the cluster up (Argo CD, Kubernetes manifests, autoscaling, probes) is
  standard Kubernetes and should work unchanged on any provider.
- Service templates avoid AWS-only services where a portable option exists.

**Trade-offs.**
- Some AWS-specific pieces (IRSA/Pod Identity for IAM, ALB ingress controller, ECR auth) will
  each need an equivalent per provider. That cost is deferred, not avoided.
- Keeping templates portable rules out some convenient AWS-native shortcuts.
- Rejected alternative: building multi-cloud from day one, which would slow the first working
  version and risk designing the abstraction before knowing what really differs.

---

## D-008: Open decisions not yet made

These need decisions. Each gets its own entry once it's made:

| Area | Options under consideration |
|------|-----------------------------|
| Kubernetes manifest packaging | Helm charts vs Kustomize overlays |
| Secrets in GitOps | Sealed Secrets, SOPS, External Secrets Operator |
| Terraform state backend | S3 + DynamoDB, Terraform Cloud |
| Second cloud provider | GCP (GKE), Azure (AKS) |
| CI/CD platform | GitHub Actions, GitLab CI |
| Monitoring stack | Prometheus + Grafana, CloudWatch, Datadog |
| CLI implementation | Language for the CLI itself (currently JavaScript) and framework (e.g. `oclif` vs `commander`) |

---

## Template for new entries

```markdown
## D-XXX: <Title>

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded by D-YYY | Rejected

**Context.** What problem or constraint led to this decision?

**Decision.** What we chose.

**Why.** The reasons.

**Trade-offs.** What we gave up, the risks, and the alternatives we rejected.
```
