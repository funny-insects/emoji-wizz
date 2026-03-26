#!/usr/bin/env bash
# deploy.sh — Build Docker image, push to ECR, and trigger App Runner deployment.
#
# Usage:
#   ./scripts/deploy.sh --account-id 123456789012 [--region us-east-1]
#
# Required:
#   --account-id    AWS account ID (12 digits)
#
# Optional:
#   --region        AWS region (default: us-east-1)

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
REGION="us-east-1"
ACCOUNT_ID=""

APP_NAME="emoji-wizz"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --account-id) ACCOUNT_ID="$2"; shift 2 ;;
    --region)     REGION="$2";     shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "ERROR: --account-id is required." >&2
  exit 1
fi

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ECR_REPO_URI="${ECR_REGISTRY}/${APP_NAME}"

echo "==> emoji-wizz deploy"
echo "    Account  : ${ACCOUNT_ID}"
echo "    Region   : ${REGION}"
echo "    Registry : ${ECR_REGISTRY}"
echo ""

# ---------------------------------------------------------------------------
# 1. Git SHA
# ---------------------------------------------------------------------------
GIT_SHA=$(git rev-parse --short HEAD)
echo "==> [Git] Using SHA: ${GIT_SHA}"

# ---------------------------------------------------------------------------
# 2. Build Docker image
# ---------------------------------------------------------------------------
echo "==> [Docker] Building image ..."
docker build --platform linux/amd64 -t "${APP_NAME}" .
echo "    Build complete."

# ---------------------------------------------------------------------------
# 3. Authenticate with ECR
# ---------------------------------------------------------------------------
echo "==> [ECR] Authenticating ..."
aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
echo "    Authenticated."

# ---------------------------------------------------------------------------
# 4. Tag and push both SHA and latest
# ---------------------------------------------------------------------------
echo "==> [ECR] Tagging image as ${GIT_SHA} and latest ..."
docker tag "${APP_NAME}:latest" "${ECR_REPO_URI}:${GIT_SHA}"
docker tag "${APP_NAME}:latest" "${ECR_REPO_URI}:latest"

echo "==> [ECR] Pushing ${ECR_REPO_URI}:${GIT_SHA} ..."
docker push "${ECR_REPO_URI}:${GIT_SHA}"

echo "==> [ECR] Pushing ${ECR_REPO_URI}:latest ..."
docker push "${ECR_REPO_URI}:latest"

echo "    Push complete."

# ---------------------------------------------------------------------------
# 5. Trigger App Runner deployment
# ---------------------------------------------------------------------------
echo "==> [App Runner] Fetching service ARN ..."
SERVICE_ARN=$(aws apprunner list-services \
  --region "${REGION}" \
  --output text \
  --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'].ServiceArn | [0]")

if [[ -z "${SERVICE_ARN}" || "${SERVICE_ARN}" == "None" ]]; then
  echo "    WARNING: App Runner service '${APP_NAME}' not found. Skipping deployment trigger." >&2
else
  SERVICE_STATUS=$(aws apprunner describe-service \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" \
    --output text \
    --query 'Service.Status')
  echo "    Service ARN: ${SERVICE_ARN} (status: ${SERVICE_STATUS})"
  if [[ "${SERVICE_STATUS}" != "RUNNING" ]]; then
    echo "    WARNING: Service is not RUNNING (${SERVICE_STATUS}). Skipping deployment trigger." >&2
    echo "    Image was pushed successfully — run ./scripts/aws-setup.sh to recreate the service if needed." >&2
  else
  echo "==> [App Runner] Triggering deployment ..."
  OPERATION_ID=$(aws apprunner start-deployment \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" \
    --output text \
    --query 'OperationId')
  echo "    Deployment triggered. Operation ID: ${OPERATION_ID}"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "==> Deploy complete!"
echo ""
echo "    Image SHA tag    : ${ECR_REPO_URI}:${GIT_SHA}"
echo "    Image latest tag : ${ECR_REPO_URI}:latest"
