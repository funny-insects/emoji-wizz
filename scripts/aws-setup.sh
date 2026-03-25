#!/usr/bin/env bash
# aws-setup.sh — Provision all AWS resources for emoji-wizz deployment.
#
# Usage:
#   ./scripts/aws-setup.sh --account-id 123456789012 [--region us-east-1] [--github-repo owner/repo]
#
# Required:
#   --account-id    AWS account ID (12 digits)
#
# Optional:
#   --region        AWS region (default: us-east-1)
#   --github-repo   GitHub repo in owner/repo format (default: funny-insects/emoji-wizz)
#
# This script is idempotent — safe to re-run if resources already exist.

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
REGION="us-east-1"
ACCOUNT_ID=""
GITHUB_REPO="funny-insects/emoji-wizz"

APP_NAME="emoji-wizz"
APPRUNNER_ROLE_NAME="${APP_NAME}-apprunner-ecr-role"
GHA_ROLE_NAME="${APP_NAME}-github-actions-role"
OIDC_PROVIDER_URL="token.actions.githubusercontent.com"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --account-id)  ACCOUNT_ID="$2";  shift 2 ;;
    --region)      REGION="$2";      shift 2 ;;
    --github-repo) GITHUB_REPO="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "ERROR: --account-id is required." >&2
  exit 1
fi

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ECR_REPO_URI="${ECR_REGISTRY}/${APP_NAME}"
OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER_URL}"

echo "==> emoji-wizz AWS setup"
echo "    Account : ${ACCOUNT_ID}"
echo "    Region  : ${REGION}"
echo "    Repo    : ${GITHUB_REPO}"
echo ""

# ---------------------------------------------------------------------------
# 1. ECR — private repository
# ---------------------------------------------------------------------------
echo "==> [ECR] Creating repository '${APP_NAME}' ..."
if aws ecr describe-repositories \
    --repository-names "${APP_NAME}" \
    --region "${REGION}" \
    --output text \
    --query 'repositories[0].repositoryName' 2>/dev/null | grep -q "${APP_NAME}"; then
  echo "    Repository already exists, skipping."
else
  aws ecr create-repository \
    --repository-name "${APP_NAME}" \
    --region "${REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --image-tag-mutability MUTABLE \
    --output text \
    --query 'repository.repositoryUri'
  echo "    Created."
fi

echo "==> [ECR] Applying lifecycle policy (keep last 10 images) ..."
aws ecr put-lifecycle-policy \
  --repository-name "${APP_NAME}" \
  --region "${REGION}" \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 10 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": { "type": "expire" }
      }
    ]
  }' \
  --output text > /dev/null
echo "    Lifecycle policy applied."

# ---------------------------------------------------------------------------
# 2. IAM — App Runner ECR access role
# ---------------------------------------------------------------------------
echo "==> [IAM] Creating App Runner ECR access role '${APPRUNNER_ROLE_NAME}' ..."
if aws iam get-role --role-name "${APPRUNNER_ROLE_NAME}" \
    --output text --query 'Role.RoleName' 2>/dev/null | grep -q "${APPRUNNER_ROLE_NAME}"; then
  echo "    Role already exists, skipping."
else
  aws iam create-role \
    --role-name "${APPRUNNER_ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "build.apprunner.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
    --output text --query 'Role.Arn'
  echo "    Created."
fi

echo "==> [IAM] Attaching AWSAppRunnerServicePolicyForECRAccess ..."
aws iam attach-role-policy \
  --role-name "${APPRUNNER_ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess" \
  2>/dev/null || echo "    Policy already attached."
echo "    Done."

APPRUNNER_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${APPRUNNER_ROLE_NAME}"

# ---------------------------------------------------------------------------
# 3. IAM — GitHub Actions OIDC provider + role
# ---------------------------------------------------------------------------
echo "==> [IAM] Creating GitHub Actions OIDC provider ..."
if aws iam list-open-id-connect-providers \
    --output text --query 'OpenIDConnectProviderList[*].Arn' 2>/dev/null \
    | grep -q "${OIDC_PROVIDER_URL}"; then
  echo "    OIDC provider already exists, skipping."
else
  # Thumbprint for token.actions.githubusercontent.com (stable, published by GitHub)
  THUMBPRINT="6938fd4d98bab03faadb97b34396831e3780aea1"
  aws iam create-open-id-connect-provider \
    --url "https://${OIDC_PROVIDER_URL}" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "${THUMBPRINT}" \
    --output text --query 'OpenIDConnectProviderArn'
  echo "    Created."
fi

echo "==> [IAM] Creating GitHub Actions role '${GHA_ROLE_NAME}' ..."
if aws iam get-role --role-name "${GHA_ROLE_NAME}" \
    --output text --query 'Role.RoleName' 2>/dev/null | grep -q "${GHA_ROLE_NAME}"; then
  echo "    Role already exists, skipping."
else
  aws iam create-role \
    --role-name "${GHA_ROLE_NAME}" \
    --assume-role-policy-document "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [
        {
          \"Effect\": \"Allow\",
          \"Principal\": {
            \"Federated\": \"${OIDC_PROVIDER_ARN}\"
          },
          \"Action\": \"sts:AssumeRoleWithWebIdentity\",
          \"Condition\": {
            \"StringEquals\": {
              \"${OIDC_PROVIDER_URL}:aud\": \"sts.amazonaws.com\"
            },
            \"StringLike\": {
              \"${OIDC_PROVIDER_URL}:sub\": \"repo:${GITHUB_REPO}:*\"
            }
          }
        }
      ]
    }" \
    --output text --query 'Role.Arn'
  echo "    Created."
fi

echo "==> [IAM] Attaching inline policy to GitHub Actions role ..."
aws iam put-role-policy \
  --role-name "${GHA_ROLE_NAME}" \
  --policy-name "${APP_NAME}-gha-deploy-policy" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"ECRAuth\",
        \"Effect\": \"Allow\",
        \"Action\": \"ecr:GetAuthorizationToken\",
        \"Resource\": \"*\"
      },
      {
        \"Sid\": \"ECRPush\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"ecr:BatchCheckLayerAvailability\",
          \"ecr:CompleteLayerUpload\",
          \"ecr:InitiateLayerUpload\",
          \"ecr:PutImage\",
          \"ecr:UploadLayerPart\",
          \"ecr:BatchGetImage\",
          \"ecr:GetDownloadUrlForLayer\"
        ],
        \"Resource\": \"arn:aws:ecr:${REGION}:${ACCOUNT_ID}:repository/${APP_NAME}\"
      },
      {
        \"Sid\": \"AppRunnerDeploy\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"apprunner:StartDeployment\",
          \"apprunner:ListServices\",
          \"apprunner:DescribeService\"
        ],
        \"Resource\": \"arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:service/${APP_NAME}/*\"
      }
    ]
  }"
echo "    Done."

GHA_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${GHA_ROLE_NAME}"

# ---------------------------------------------------------------------------
# 4. App Runner — service
# ---------------------------------------------------------------------------
echo "==> [App Runner] Checking for existing service '${APP_NAME}' ..."
EXISTING_SERVICE_ARN=$(aws apprunner list-services \
  --region "${REGION}" \
  --output text \
  --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'].ServiceArn | [0]" 2>/dev/null || true)

if [[ -n "${EXISTING_SERVICE_ARN}" && "${EXISTING_SERVICE_ARN}" != "None" ]]; then
  echo "    Service already exists: ${EXISTING_SERVICE_ARN}"
  SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "${EXISTING_SERVICE_ARN}" \
    --region "${REGION}" \
    --output text \
    --query 'Service.ServiceUrl')
else
  echo "==> [App Runner] Creating service '${APP_NAME}' ..."
  # Use a placeholder image tag; the deploy script will push the real image.
  # App Runner requires the image to exist before creating the service.
  # If this is a first-run, push an initial image before running this script,
  # or update the image URI after the first deploy.
  IMAGE_URI="${ECR_REPO_URI}:latest"

  SERVICE_ARN=$(aws apprunner create-service \
    --service-name "${APP_NAME}" \
    --region "${REGION}" \
    --source-configuration "{
      \"AuthenticationConfiguration\": {
        \"AccessRoleArn\": \"${APPRUNNER_ROLE_ARN}\"
      },
      \"AutoDeploymentsEnabled\": false,
      \"ImageRepository\": {
        \"ImageIdentifier\": \"${IMAGE_URI}\",
        \"ImageConfiguration\": {
          \"Port\": \"8080\",
          \"RuntimeEnvironmentVariables\": {}
        },
        \"ImageRepositoryType\": \"ECR\"
      }
    }" \
    --instance-configuration '{
      "Cpu": "0.25 vCPU",
      "Memory": "0.5 GB"
    }' \
    --health-check-configuration '{
      "Protocol": "HTTP",
      "Path": "/",
      "Interval": 10,
      "Timeout": 5,
      "HealthyThreshold": 1,
      "UnhealthyThreshold": 5
    }' \
    --auto-scaling-configuration-arn "arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:autoscalingconfiguration/DefaultConfiguration" \
    --output text \
    --query 'Service.ServiceArn')
  echo "    Service created: ${SERVICE_ARN}"
  echo "    Waiting for service to become RUNNING (this may take 2-3 minutes) ..."
  aws apprunner wait service-running \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" || true
  SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" \
    --output text \
    --query 'Service.ServiceUrl')
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "==> Setup complete!"
echo ""
echo "    ECR repository  : ${ECR_REPO_URI}"
echo "    App Runner role : ${APPRUNNER_ROLE_ARN}"
echo "    GHA OIDC role   : ${GHA_ROLE_ARN}"
echo "    App Runner URL  : https://${SERVICE_URL}"
echo ""
echo "GitHub repository secrets/variables to configure:"
echo "    Secret  AWS_ROLE_ARN   = ${GHA_ROLE_ARN}"
echo "    Var     AWS_ACCOUNT_ID = ${ACCOUNT_ID}"
echo "    Var     AWS_REGION     = ${REGION}"
