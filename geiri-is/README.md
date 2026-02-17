Personal site (Geiri.is) with CV + blog + admin.

- Public: `/`, `/cv`, `/blog`, `/blog/[slug]`
- Admin (Entra role `admin`): `/admin/*`
- Data: Cosmos DB (posts + secrets)
- Stats: Application Insights (admin-only)
- Auto-publish: LinkedIn (admin connect + post-on-publish)

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Open http://localhost:3000

Note: in local development, admin API routes are allowed without SWA auth (so you can build without Entra configured yet). In Azure Static Web Apps, access is enforced via `staticwebapp.config.json`.

## Azure deployment

### 1) Provision Azure resources (Bicep)

The Bicep template is in `infra/main.bicep` and provisions:

- Azure Static Web Apps (Free)
- Cosmos DB for NoSQL (database + `posts` + `secrets` containers)
- Log Analytics + Application Insights

Example:

```bash
az login
az group create -n rg-geiri-is -l westeurope
az deployment group create -g rg-geiri-is -f infra/main.bicep \
	-p prefix=geiri staticWebAppName=geiri-is siteUrl=https://geiri.is
```

### 2) GitHub Actions deploy

The workflow is in `.github/workflows/azure-static-web-apps.yml` and deploys the app in `geiri-is/`.

In the Azure Portal for your Static Web App, create a deployment token and add it to your GitHub repo secrets:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

### 3) Entra ID auth + admin role

`staticwebapp.config.json` restricts these to role `admin`:

- `/admin/*`
- `/api/admin/*`

In Azure:

1) Create an Entra ID App Registration (single-tenant: `geiri.is`).
2) Create an app role named `admin` and assign it to your user.
3) In the Static Web App, configure the Microsoft Entra ID authentication provider to use that app registration.

### 4) Application Insights stats

The admin stats endpoint uses the Application Insights Query REST API.

You must create an Application Insights API key and add it as a Static Web App application setting:

- `APPINSIGHTS_APP_ID` (already set by Bicep)
- `APPINSIGHTS_API_KEY` (you add)

## Configuration

Copy `.env.local.example` to `.env.local` and fill what you have available.

### Cosmos DB

This app expects a Cosmos DB for NoSQL database with two containers:

- Container `posts`
	- Partition key path: `/pk`
	- Items have `pk = "post"`
- Container `secrets`
	- Partition key path: `/pk`
	- Items have `pk = "secret"`

Env vars:

- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE_ID` (default: `geiri-is`)
- `COSMOS_POSTS_CONTAINER_ID` (default: `posts`)
- `COSMOS_SECRETS_CONTAINER_ID` (default: `secrets`)

If Cosmos is not configured, the app uses a tiny in-memory data store so public blog pages still render.

### Azure Static Web Apps + Entra ID admin

`staticwebapp.config.json` restricts these to role `admin`:

- `/admin/*`
- `/api/admin/*`

In Azure:

1) Create an Entra ID App Registration (single-tenant: `geiri.is`).
2) Create an app role named `admin` and assign it to your user.
3) Configure Azure Static Web Apps authentication (Azure Active Directory) and map the `admin` role.

### Application Insights stats

Admin stats uses the Application Insights Query REST API.

Env vars:

- `APPINSIGHTS_APP_ID`
- `APPINSIGHTS_API_KEY`

### LinkedIn auto-post

When you publish a post in admin, the server attempts to publish a LinkedIn post (text + link).

Env vars:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI` (optional; defaults to `${SITE_URL}/api/admin/linkedin/callback`)
- `LINKEDIN_AUTO_POST` (set to `false` to disable)

You connect LinkedIn from `/admin`.

## Build

```bash
npm run build
```
