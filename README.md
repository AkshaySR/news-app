# news-app

This repository contains the `mcp-server` (in `apps/mcp-server`) and a web frontend.

What I added:

- `Dockerfile` — multi-stage build for `apps/mcp-server`.
- `.github/workflows/gcloud-deploy.yml` — GitHub Actions to build and deploy to Cloud Run.

Quick local build (from repo root):

```bash
# build image
docker build -t news-app:local .

# run (server listens on 8080)
docker run -p 8080:8080 news-app:local
```

Deploy to Google Cloud (manual steps):

1. Create a GCP project and enable Cloud Run & Cloud Build APIs.

```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

2. Create a service account and grant `Cloud Run Admin`, `Storage Admin`, `Cloud Build Editor`.

```bash
gcloud iam service-accounts create gha-deployer --display-name "GH Actions Deployer"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member "serviceAccount:gha-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" --role "roles/run.admin"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member "serviceAccount:gha-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" --role "roles/cloudbuild.builds.builder"
```

3. Create and download a service account key JSON, add it to your GitHub repo secrets as `GCP_SA_KEY`.

4. Add `GCP_PROJECT` and `GCP_REGION` as GitHub secrets.

5. Push to `main` — the provided Actions workflow will build and deploy to Cloud Run.
