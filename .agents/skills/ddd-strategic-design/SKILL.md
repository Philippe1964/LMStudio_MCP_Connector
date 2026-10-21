---
name: ddd-strategic-design
description: >-
  Skill defining Strategic Domain-Driven Design (DDD) rules for FDJ: Ubiquitous Language,
  Subdomains (Core, Supporting, Generic), Bounded Contexts, Context Mapping patterns (Shared Kernel,
  Customer-Supplier, Anti-Corruption Layer / ACL, Open Host Service, Published Language), and strict
  cross-context boundary enforcement in Python 3.14+.
---

# Domain-Driven Design — Strategic Design & Context Mapping (`ddd-strategic-design`)

Whenever designing new business modules, decomposing domains, integrating external systems, or structuring packages under `src/fdj/domain/`, `src/fdj/application/`, and `src/fdj/infrastructure/`, you **MUST** apply these Strategic DDD rules.

---

## 1. Ubiquitous Language (Langage Ubiquitaire)

1. **Zero Technical Jargon in the Domain**:
   - Classes, methods, attributes, events, and exceptions inside `src/fdj/domain/<context>/` **MUST** exclusively use the business domain's Ubiquitous Language.
   - Forbidden names in Domain models: `Manager`, `Helper`, `Util`, `Processor`, `Data`, `Record`, `Row`, `Dto`, `Payload`, `Table`.
   - Prefer expressive business verbs for state transitions: e.g., `order.confirm()`, `subscription.renew(until=...)`, `media_asset.archive(reason=...)` instead of `set_status("CONFIRMED")`.
2. **Language Consistency Across Layers**:
   - Prefer English for all domain identifiers; fall back to French domain terms only when an English translation would distort a specific regulatory or business meaning.
   - Maintain a glossary in module docstrings when introducing non-obvious domain concepts.

---

## 2. Subdomain Classification (Core, Supporting, Generic)

Before creating a Bounded Context sub-package, classify the business capability:

| Subdomain Type | Definition | Architectural Investment |
| :--- | :--- | :--- |
| **Core Domain** | High competitive advantage, complex business invariants & policies | Rich Aggregate Roots, Value Objects, Domain Events, Specifications, Domain Services, 100% unit test coverage in isolation. |
| **Supporting Subdomain** | Custom to the business but supports the Core Domain | Clean Entities, Value Objects, and Repositories; keep Aggregates simple. |
| **Generic Subdomain** | Off-the-shelf problem (auth,observability, generic notifications) | Isolate behind a Domain `Protocol` (Port) and delegate to Infrastructure adapters (`src/fdj/infrastructure/`). |

---

## 3. Bounded Contexts & Package Boundaries

1. **Explicit Sub-Package Per Bounded Context**:
   - Every Bounded Context **MUST** live in its own dedicated sub-package across the layers:
     - `src/fdj/domain/<bounded_context>/`
     - `src/fdj/application/<bounded_context>/`
     - `src/fdj/presentation/<bounded_context>/`
     - `src/fdj/infrastructure/<adapter_type>/<bounded_context>/`
   - Hierarchical sub-domains are supported when a domain splits into distinct sub-contexts (e.g. `domain/catalog/rights`, `domain/catalog/transcoding`).

2. **Strict Context Isolation (No Cross-Context Entity Leakage)**:
   - A Bounded Context `A` (`domain.context_a`) **MUST NEVER** import an Entity, Aggregate Root, or Repository from another Bounded Context `B` (`domain.context_b`) or reference it via an ORM relationship (`relationship()`).
   - **Cross-Context References by ID Only**: When an Aggregate in Context `A` needs to reference an concept from Context `B`, it **MUST** hold a strongly-typed Value Object identifier (e.g. `OwnerId`, `CustomerId`, `AssetId`), never the foreign Aggregate object itself.

---

## 4. Shared Kernel (`domain/shared/`)

- `src/fdj/domain/shared/` is the **Shared Kernel**.
- **Rule of Minimalism**: Only foundational DDD building blocks (`BaseEntity`, `AggregateRoot`, `DomainEvent`, `Specification`, `DomainError`, `EntityNotFoundError`, and truly universal Value Objects like `Money` or `EmailAddress` if shared identically) belong in `domain/shared/`.
- Never dump context-specific business logic into `domain/shared/` to bypass Bounded Context boundaries.

---

## 5. Context Mapping & Anti-Corruption Layer (ACL)

When two Bounded Contexts or an external legacy/third-party API interact, explicitly choose and implement one of the following Context Mapping patterns:

### A. Anti-Corruption Layer (ACL) — Mandatory for External / Legacy Systems
- External APIs, third-party SDKs, and legacy databases **MUST NEVER** leak their schemas or concepts into `domain/` or `application/`.
- Define a **Domain Port (`Protocol`)** in `src/fdj/domain/<context>/ports.py` or `repositories.py` expressed purely in your Bounded Context's Ubiquitous Language.
- Implement the **ACL Adapter + Translator** in `src/fdj/infrastructure/<type>/<context>/`:
  ```python
  # Domain Layer (Port in Ubiquitous Language)
  class RightsVerificationPort(Protocol):
      async def verify_broadcast_clearance(
          self, asset_id: AssetId, territory: TerritoryCode
      ) -> ClearanceDecision: ...


  # Infrastructure Layer (ACL Adapter translating external API -> Domain Value Object)
  class ExternalDrmRightsAclAdapter(RightsVerificationPort):
      async def verify_broadcast_clearance(
          self, asset_id: AssetId, territory: TerritoryCode
      ) -> ClearanceDecision:
          raw_payload = await self._http_client.get(...)
          return self._translator.to_clearance_decision(raw_payload)
  ```

### B. Event-Driven Context Integration (Published Language)
- When Bounded Context `A` needs to react to state changes in Bounded Context `B`, decouple them via **Domain Events** or **Application Integration Events** rather than synchronous cross-context repository calls inside a single transaction.
- Rule: **One Aggregate Root (and one Bounded Context) per database transaction** whenever possible; coordinate cross-context workflows in the Application layer or via Domain Event handlers.

### C. Open Host Service (OHS)
- The `presentation` + `application` layers expose a clean **Open Host Service** via versioned FastAPI routers and strict Pydantic `*RequestDto` / `*ResponseDto` contracts (Published Language), shielding external consumers from internal Domain Aggregate changes.

---

## 6. Strategic DDD Verification Checklist
- [ ] Does every class/method in `domain/<context>/` reflect the Ubiquitous Language without technical suffixes (`Dto`, `Dao`, `Row`, `Helper`)?
- [ ] Are Bounded Contexts isolated in distinct sub-packages with zero direct ORM `relationship()` across contexts?
- [ ] Are external systems isolated behind an Anti-Corruption Layer (ACL) in `infrastructure/` implementing a `domain` `Protocol`?
- [ ] Is `domain/shared/` strictly limited to generic DDD building blocks?

