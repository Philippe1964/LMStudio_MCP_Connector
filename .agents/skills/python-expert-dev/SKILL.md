---
name: python-expert-dev
description: >-
  Comprehensive runbook and best practices for expert Python 3.14+ development.
  Use this skill when scaffolding a new Python project, configuring pyproject.toml,
  writing production-grade Python architecture, setting up uv/ruff/mypy/pytest workflows,
  debugging performance, or reviewing Python code quality.
---

# Python Expert Developer Skill

Use this skill to build, structure, test, and maintain modern Python (3.14+) projects following industry best practices.

## 1. Scaffolding a Modern Python Project (`uv`)

When initializing or setting up a project in the workspace:

1. **Initialize with `uv`**:
   ```powershell
   uv init --python 3.14
   ```
   *(Or use `uv init --package <name> --python 3.14` for a `src/` layout package).*

2. **Add Core Development Dependencies**:
   ```powershell
   uv add --dev ruff mypy pytest pytest-cov pytest-asyncio
   ```

3. **Standard `pyproject.toml` Configuration**:
   Reference [pyproject-template.toml](./resources/pyproject-template.toml) to configure `ruff`, `mypy` (strict mode), and `pytest` cleanly in one file.

---

## 2. Modern Python 3.12–3.14+ Idioms

Always leverage modern Python features instead of legacy constructs:

- **PEP 695 Type Parameter Syntax**:
  ```python
  # Modern (3.12+)
  type JSONVal = str | int | float | bool | None | list[JSONVal] | dict[str, JSONVal]


  class Repository[T]:
      def get(self, id: str) -> T | None: ...
  ```
- **Dataclasses with Slots**:
  ```python
  from dataclasses import dataclass


  @dataclass(slots=True, frozen=True, kw_only=True)
  class UserConfig:
      user_id: str
      max_retries: int = 3
  ```
- **Structural Pattern Matching (`match` / `case`)**:
  Use `match` statements for parsing complex structures, ASTs, or state transitions cleanly.
- **Asyncio TaskGroups & `@asynccontextmanager` Typing (Python 3.13/3.14+)**:
  Always annotate `@asynccontextmanager` functions with `-> AsyncGenerator[T]` (and `@contextmanager` with `-> Generator[T]`), never `-> AsyncIterator[T]` (which is deprecated in Python 3.13+ typeshed/Pylance):
  ```python
  import asyncio
  from collections.abc import AsyncGenerator
  from contextlib import asynccontextmanager


  @asynccontextmanager
  async def lifespan() -> AsyncGenerator[None]:
      yield


  async def fetch_all(urls: list[str]) -> list[str]:
      async with asyncio.TaskGroup() as tg:
          tasks = [tg.create_task(fetch(u)) for u in urls]
      return [t.result() for t in tasks]
  ```

---

## 3. Quality Assurance & Verification Workflow

Run this verification pipeline after writing or modifying code:

1. **Format & Lint (`ruff`)**:
   ```powershell
   uv run ruff check --fix .
   uv run ruff format .
   ```
2. **Static Type Checking (`mypy`)**:
   ```powershell
   uv run mypy .
   ```
3. **Unit & Integration Tests (`pytest`)**:
   ```powershell
   uv run pytest -v --cov
   ```

---

## 4. Deep-Dive References & Templates

- **Project Config Template**: [pyproject-template.toml](./resources/pyproject-template.toml)
- **Architecture & Patterns**: [architecture-guide.md](./references/architecture-guide.md)
