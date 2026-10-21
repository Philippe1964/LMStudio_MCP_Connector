---
name: ddd-tactical-patterns
description: >-
  Skill defining Tactical Domain-Driven Design (DDD) building blocks in Python 3.14+ and SQLAlchemy 2.0:
  Rich Entities, Aggregate Roots, Strongly-Typed Value Objects & Typed IDs, Domain Events,
  Specifications, Factories, Domain Services, and Repository Contracts.
---

# Domain-Driven Design — Tactical Building Blocks (`ddd-tactical-patterns`)

Whenever creating or modifying Domain models, Value Objects, Aggregates, Domain Services, Specifications, or Domain Events under `src/fdj/domain/` and orchestrating them in `src/fdj/application/`, you **MUST** follow these Tactical DDD patterns.

---

## 1. Anti-Anemic Domain Model Mandate (Tell, Don't Ask)

1. **Rich Domain Behavior over Getters/Setters**:
   - Anemic entities (data bags with public mutable fields and all logic in `*Service` classes) are **strictly forbidden**.
   - State changes **MUST** occur through intention-revealing business methods on the Entity/Aggregate Root that validate invariants before mutating state.
   - **Never** expose plain `set_*` methods or mutate attributes directly from the Application layer (`entity.status = "ARCHIVED"` is forbidden; use `entity.archive(reason=...)`).

2. **Immutable Collection Encapsulation**:
   - Internal one-to-many collections on an Aggregate Root **MUST** be encapsulated. Expose read-only views (`tuple[ChildEntity, ...]` or `list(self._items)`) so callers cannot `.append()` or `.clear()` bypassing Aggregate invariants.

---

## 2. Strongly-Typed Value Objects & Identity (`@dataclass(frozen=True, slots=True)`)

1. **Eliminate Primitive Obsession**:
   - Never pass raw `str`, `int`, or `float` for concepts with domain meaning or constraints (e.g. `EmailAddress`, `Timecode`, `Resolution`, `Percentage`, `Money`, `TerritoryCode`, `HardwareMetrics`).
   - Implement Value Objects as `@dataclass(frozen=True, slots=True)` with eager self-validation in `__post_init__` raising a specific subclass of `DomainError`.

2. **Strongly-Typed Entity Identifiers**:
   - Prefer strongly-typed ID Value Objects (`@dataclass(frozen=True, slots=True)`) or `NewType` wrappers (e.g. `AssetId`, `CustomerId`) so IDs from different Aggregates can never be accidentally swapped.

3. **Self-Contained Domain Operations on Value Objects**:
   - Put arithmetic, formatting, and comparison methods directly on the Value Object (e.g., `duration.add(other_duration)`, `money.allocate(ratios)`), returning a **new** immutable instance.

---

## 3. Aggregate Design Rules (Vernon's 4 Rules of Aggregates)

1. **Rule 1 — Model True Invariants in Consistency Boundaries**:
   - An Aggregate is a transactional consistency boundary. Only group Entities into a single Aggregate if an invariant **must** hold across them within the exact same atomic transaction.
2. **Rule 2 — Design Small Aggregates**:
   - Prefer small Aggregates (often just the Aggregate Root Entity + Value Objects). Large object graphs degrade SQLAlchemy performance and cause lock contention.
3. **Rule 3 — Reference Other Aggregates by Identity Only**:
   - Inside Aggregate `A`, hold `other_aggregate_id: OtherId`, **not** a direct reference to Aggregate Root `B`.
   - Only internal child Entities belonging exclusively to Aggregate Root `A` may be mapped via ORM `relationship()` and cascade-persisted (`cascade="all, delete-orphan"`).
4. **Rule 4 — Modify One Aggregate Per Transaction**:
   - Each write use case in the Application layer (`async with session.begin():`) should load and mutate a single Aggregate Root via its Repository. Cross-aggregate side effects are coordinated via **Domain Events**.

---

## 4. Domain Events (`DomainEvent` & Aggregate Event Recording)

1. **Immutable Past-Tense Facts**:
   - Domain Events represent something significant that **has already happened** in the domain (`AssetIngested`, `HealthDegradationDetected`, `OrderConfirmed`).
   - Implement every Domain Event as an immutable `@dataclass(frozen=True, slots=True, kw_only=True)` inheriting from `DomainEvent` (with `occurred_at: datetime` UTC and `event_id: UUID`).
2. **Recording Events on the Aggregate Root**:
   - Aggregate Roots record Domain Events internally during state-changing methods (`self._record_event(AssetArchived(...))`) and expose `pull_domain_events() -> list[DomainEvent]` so the Application layer Unit of Work / Use Case can dispatch them upon transaction commit.
   ```python
   @dataclass(frozen=True, slots=True, kw_only=True)
   class DomainEvent:
       """Base class for all immutable DDD Domain Events."""

       event_id: UUID = field(default_factory=uuid4)
       occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))
   ```

---

## 5. Specification Pattern (`Specification[T]`)

When business rules for querying, filtering, or validating eligibility grow complex or composable:
- Encapsulate the predicate in a **Specification** class inside `src/fdj/domain/<context>/specifications.py`.
- Specifications support boolean composition (`&`, `|`, `~`) via `is_satisfied_by(candidate: T) -> bool`:
  ```python
  class Specification[T](ABC):
      """Composable DDD Specification for business rule evaluation."""

      @abstractmethod
      def is_satisfied_by(self, candidate: T) -> bool:
          """Return True when candidate satisfies the business rule."""
  ```
- Use Specifications both in-memory (Domain Services, Aggregate validation) and as the specification contract passed to Repository query methods.

---

## 6. Domain Factories vs Constructors

- **Simple Construction**: Enforce invariants directly in `__init__` or `__post_init__`.
- **Complex Creation**: Use explicit named classmethod factories on the Aggregate Root (e.g., `MediaAsset.register_from_ingest(...)`) or a dedicated `<Aggregate>Factory` class in the Domain layer when assembling an Aggregate requires complex domain policies or multiple Value Objects.

---

## 7. Domain Services vs Application Services

| Aspect | `DomainService` (`domain/<context>/services.py`) | Application Service (`application/<context>/*_service.py`) |
| :--- | :--- | :--- |
| **Suffix** | `*DomainService` | `*Service` or `*UseCase` |
| **Responsibility** | Pure business logic spanning multiple Domain objects or computing domain policies (`HealthEvaluationDomainService`) | Use case orchestration, transaction management (`async with session.begin():`), calling Repositories, dispatching Domain Events, mapping DTOs |
| **Allowed Inputs/Outputs** | Domain Entities, Value Objects, Specifications | Pydantic `*RequestDto` and `*ResponseDto` |
| **I/O & Infrastructure** | Stateless pure domain logic (or calling pure Domain `Protocol` ports) | Coordinates Repositories, Unit of Work, security authorization |

---

## 8. Domain Exceptions Hierarchy

- Every business invariant violation in `src/fdj/domain/` **MUST** raise a specific exception inheriting from [`DomainError`](file:///e:/SourceCode/FDJ/src/fdj/domain/shared/base.py) (e.g., `InvalidHealthMetricError`, `AssetAlreadyArchivedError`, `InsufficientClearanceError`).
- Never raise `ValueError`, `RuntimeError`, or `fastapi.HTTPException` directly from Domain methods—keep domain errors expressive so the Presentation layer can deterministically map them to HTTP 400/404/409/422 responses.

