# ehitusOS

## Teable Integration

This repository includes a working copy of [Teable](https://github.com/teableio/teable) - a powerful database application with a spreadsheet-like interface.

### Quick Start

To run Teable:

```bash
cd teable
docker compose up -d
```

Access Teable at: http://127.0.0.1:3000

### What is Teable?

Teable is a no-code database platform that combines the simplicity of a spreadsheet with the power of a database. It features:
- Real-time collaboration
- Multiple views (Grid, Form, Kanban, Gallery, Calendar)
- Rich data types and formulas
- API access
- Self-hosted deployment

For more information, see the [teable/README.md](teable/README.md) file or visit [teable.ai](https://teable.ai).

### Configuration

Before starting, you can customize the configuration in `teable/.env`:
- Database credentials
- Redis password
- Timezone
- Public origin URL

**Note:** Make sure to change the default passwords in production!