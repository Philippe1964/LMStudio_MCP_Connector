---
name: python-layer-architecture
description: >-
  Skill defining the architectural layers and design guidelines for ITT&F's Python/FastAPI applications.
  This skill must be used for the creation of the components of the presentation, application, domain
  and infrastructure layers of Python applications. It concerns components such as routers, services,
  domain entities, repositories, and infrastructure adapters.
---

## Development Instructions
As a code assistant, when you generate or modify Python code, you must adhere to the following layer separation:

### 1. Presentation layer
- **Role:** Manage incoming requests and responses to the application (e.g. HTTP).
- **Rules:**
  - The components must **not contain business logic**.
  - The components must delegate processing to the Application layer.
  - Routers must be defined using the framework's routing mechanism (e.g. `APIRouter` in FastAPI).
  - DTOs (Data Transfer Objects) should be used instead of directly exposing domain entities.
  - Input data for each endpoint must use the DTOs defined in the Application layer.
  - Output data for each endpoint must use the DTOs defined in the Application layer, and each endpoint must declare its ResponseDto as the framework's response model (e.g. `response_model` in FastAPI).
  - The Presentation layer is the only layer that raises HTTP-level errors (e.g. `HTTPException` in FastAPI). Errors raised by the Application or Domain layers must be caught here and mapped to appropriate status codes. Framework exception types must never leak into lower layers.
  - The Python root package of this layer must be `<application_base_package>.presentation`.
  - All modules of this layer must be created inside a sub-package of the root package of this layer. If this package is not specified, propose a sub-package whose name matches the module being created.
  - This layer depends on the Application layer (and transitively on the Domain layer).

### 2. Application layer
- **Role:** Contains the code logic of the application use cases and orchestrates calls to different operations when necessary.
- **Rules:**
  - Must coordinate access to data via the Repository interfaces defined in the Domain layer.
  - Manages transaction boundaries. Python has no declarative transaction annotation, so every use case that performs writes must explicitly open the transaction and commit or roll it back through a session context manager (e.g. `async with session.begin():`) or a unit-of-work object. Transaction boundaries are always opened at this layer, never in the Presentation or Domain layer.
  - Application service classes must be clearly identifiable as orchestrators of use cases.
  - Methods that perform write operations must be explicitly marked or documented as transactional. If there is ambiguity regarding the role of such a method, the AI will request confirmation from the developer.
  - Complex business rules involving several domain types are implemented here if they cannot be expressed within the Domain layer alone.
  - If a process in this layer has a counterpart in the Domain layer for the reasons explained in the Domain layer rules, the process must call the Domain layer and only perform the DTO transformation required by the return type.
  - This is the layer where the DTOs exposed by the Presentation layer are defined.
  - DTOs that cross the HTTP boundary must be Pydantic models (`pydantic.BaseModel`) so the framework can validate request payloads and serialise responses.
  - Consider using Pydantic's `ConfigDict(from_attributes=True)` to facilitate the instantiation of DTOs directly from Domain entities.
  - The types of parameters and return values for public operations of components in this layer are DTOs.
  - Public methods callable by routers must accept a single input parameter whose type is named using the method name with the suffix `RequestDto`.
  - The return type of these public methods must be a class whose name is the method name with the suffix `ResponseDto`.
  - The transformation of domain entities into DTOs must use dedicated mapper classes or functions.
  - The Python root package of this layer must be `<application_base_package>.application`.
  - All modules of this layer must be created inside a sub-package of the root package of this layer. If this package is not specified, propose a sub-package whose name matches the module being created.
  - This layer cannot call the Presentation layer.
  - Functional domains must be grouped into sub-packages (e.g. `client_access`, `reporting`).

### 3. Domain layer
- **Role:** Objects in this layer represent the business domain objects of the application as Domain-Driven Design describes.
- **Rules:**
  - **Ubiquitous Language:** Class, attribute, and method names must reflect the business vocabulary. Prefer English; fall back to French only when an English term would harm clarity.
  - Entities represent the core business objects. Each entity must have a unique identifier (`id` property). Unless explicitly requested, this `id` must be managed by the persistence layer (e.g. auto-incremented integer or UUID).
  - **Integrity of construction:** Entities, Value Objects, and Aggregates must always be constructed in a valid state. Use `__init__`, class methods, or factory functions to enforce invariants at creation time.
  - **No direct attribute mutation:** Do not expose plain setters. State changes must go through business methods that enforce domain rules.
  - **Immutable collection properties:** When a property is a list or set, return a copy (e.g. `return list(self._items)`) to prevent external mutation of internal state.
  - **Aggregate access:** Aggregates must only be accessed and modified through their root Entity.
  - If business logic involves only data known to a single entity (through its own properties or those of related objects), it must be implemented as a method on that entity class. The goal is to avoid anemic domain models.
  - Business processes involving more than one domain object must be isolated in a separate class referred to as a "Domain Service". This class must be named after the main business class of the process or a dedicated business term, and must carry the suffix `DomainService`.
  - For every persistent entity, an interface (abstract base class or `Protocol`) named `<EntityName>Repository` must be defined in this layer. Its implementation must reside in the Infrastructure layer.
  - Our approach of DDD (Domain Driven Design) allows ORM mapping (e.g. SQLAlchemy declarative classes with `Mapped`/`mapped_column`) to be placed directly on Domain entities. We do not recommend a separation between DDD entities and their persistence models.
  - Value Objects must be immutable (use `@dataclass(frozen=True)` or equivalent) and must encapsulate all validation logic for the data they represent.
  - **Bounded Contexts:** Decompose the domain into Bounded Contexts and reflect functional boundaries using sub-packages (e.g. `<application_base_package>.domain.marine.sailing`, `<application_base_package>.domain.marine.submarine`).
  - The Python root package of this layer must be `<application_base_package>.domain`.
  - All modules of this layer must be created inside a sub-package of the root package of this layer. If this package is not specified, propose a sub-package whose name matches the module being created.
  - This layer is independent of all other layers and must have no dependencies towards the Presentation, Application, or Infrastructure layers.

### 4. Infrastructure layer
- **Role:** Implement the Repository interfaces defined in the Domain layer and contain any other component enabling communication with external applications or services.
- **Rules:**
  - Repository implementations must take the name of the repository interface with an `Impl` suffix (e.g. `ClientRepositoryImpl`).
  - Each repository implementation uses the ORM session (e.g. SQLAlchemy `Session` or `AsyncSession`) directly. Where a dedicated data-access object is introduced, it must be named with the entity name and the suffix `Dao`.
  - External service adapters (messaging, mail, audit, etc.) must be grouped by functional type within sub-packages (e.g. `persistence`, `mail`, `audit`), then by functional domain.
  - The Python root package of this layer must be `<application_base_package>.infrastructure`.
  - This layer depends on the Domain layer. It must never depend on the Application layer or the Presentation layer.

## Testing strategy
- Use `pytest` (with `pytest-asyncio` for asynchronous code) as the test framework. Test modules must be named `test_<module>.py` and mirror the package structure under a `tests/` directory.
- **Presentation layer:** Write unit tests for API contracts and adapters. Use the framework's test client (e.g. `TestClient` in FastAPI/Starlette) for integration tests on routers.
- **Domain layer:** Test business rules in isolation using mocks or stubs. Never use real Infrastructure implementations in Domain tests.
- **Infrastructure layer:** Test complex adapters and repositories. Mock external services; test actual persistence logic against an in-memory or test database (e.g. in-memory SQLite).
- **Application layer (acceptance tests):** Test use cases end-to-end using mocks for all Infrastructure dependencies.
- Balance Domain unit tests and Application acceptance tests. Avoid covering the same code path with both types of test.
- For each class or module that you create or update, generate or update the corresponding test module.

## Global rules
- At the end of the generation, verify that the code you have added or updated complies with this python-layer-architecture skill.
- Target Python 3.12 or newer and follow PEP 8: `snake_case` for modules, functions, and variables; `PascalCase` for classes.
- All public functions, methods, and attributes must carry full type annotations (PEP 484, with PEP 604 unions such as `X | None`).
- When the application uses asynchronous I/O (the default for FastAPI with SQLAlchemy 2.0), use `async def` consistently across layers: async endpoints, async repository interface methods, and `AsyncSession` for persistence.
- All configuration (database URLs, security keys, external service endpoints) must be externalised via environment variables or a settings object (e.g. `BaseSettings` from the `pydantic-settings` package). No configuration values must be hard-coded.

# Global constraints to apply
- **Bypass prohibition:** A router must **never** call a Repository directly nor a class of the Domain layer.
- **Control inversion:** Use the framework's dependency-injection mechanism (e.g. `Depends` in FastAPI) at the Presentation layer to inject Application services. Use plain constructor injection within the Application and Domain layers to remain framework-agnostic.
- **Security - authentication (OWASP A01 Broken Access Control):** JWT validation must be enforced at the Presentation layer before delegating to the Application layer. Invalid or missing tokens must be rejected immediately.
- **Security - authorisation (OWASP A01 Broken Access Control):** The Application layer is responsible for enforcing authorisation rules on use cases.
- **Injection protection (OWASP A03):** Use Value Objects to encapsulate and validate input data. Use parameterised queries (e.g. via an ORM or `sqlalchemy` bound parameters); never concatenate user input into SQL strings.
- **XSS protection (OWASP A03):** Apply Context-Aware Output Encoding when transforming data between contexts. Sanitise or escape output that may contain user-supplied content before it is rendered (e.g. when a `Comment` domain object is serialised to HTML).

