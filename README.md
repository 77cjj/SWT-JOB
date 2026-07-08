# SWT-JOB

SWT-JOB is organized as a monorepo with separate frontend and backend projects.

## Structure

- `SWT-JOB-Frontend/`: Next.js frontend deployed by Vercel.
- `SWT-JOB-Backend/`: Spring Boot backend intended to run on ECS.
- `scripts/`: Local development and deployment helper scripts.
- `middleware.dockerfile`: Local middleware image definition.

## Deployment

Vercel is configured to use `SWT-JOB-Frontend` as the project root directory.
The backend should be deployed separately on ECS and exposed through an HTTPS API domain.

Production frontend environment variables should include:

```env
NEXT_PUBLIC_RAGENT_API_BASE_URL=https://api.example.com/api/ragent
NEXT_PUBLIC_RAGENT_BYPASS_AUTH=false
NEXT_PUBLIC_RAGENT_ALLOW_LOGIN_PAGE=true
```

Local secret files, build output, dependencies, raw source documents, and nested Git backups are intentionally ignored.
