# Python Expert Architecture & Design Patterns

## 1. Project Layout (`src/` Layout)
Prefer the `src/` layout to prevent accidental imports of unpackaged local code during testing:
```text
project-root/
├── pyproject.toml
├── README.md
├── src/
│   └── package_name/
│       ├── __init__.py
│       ├── py.typed
│       ├── domain/       # Pure business logic, dataclasses, protocols
│       ├── services/     # Application use-cases and orchestration
│       └── adapters/     # DB, HTTP clients, CLI, external I/O
└── tests/
    ├── conftest.py
    ├── unit/
    └── integration/
```

## 2. Dependency Inversion with `typing.Protocol`
Avoid tight coupling to concrete I/O libraries. Define structural interfaces using `Protocol`:
```python
from typing import Protocol


class StorageAdapter(Protocol):
    async def save(self, key: str, payload: bytes) -> None: ...
    async def load(self, key: str) -> bytes | None: ...
```

## 3. Structured Logging & Observability
- Never use `print()` in production application code.
- Configure `logging` (or `structlog` / `loguru`) at the application entry point, and use module-level loggers (`logger = logging.getLogger(__name__)`).

## 4. Performance & Memory Guidelines
- Use generators (`yield`) and `itertools` for large data streams instead of materializing full lists in memory.
- Use `slots=True` on dataclasses instantiated in large numbers.
- Profile before optimizing using `cProfile`, `py-spy`, or `time.perf_counter()`.
