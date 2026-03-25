#!/usr/bin/env bash
# aws-teardown.sh — Remove all AWS resources created by aws-setup.sh.
#
# Usage:
#   ./scripts/aws-teardown.sh --account-id 123456789012 [--region us-east-1]
#
# Required:
#   --account-id    AWS account ID (12 digits)
#
# Optional:
#   --region        AWS region (default: us-east-1)
#
# Resources are deleted in reverse order of creation.
# Each step gracefully handles resources that don't exist.

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
REGION="us-east-1"
ACCOUNT_ID=""

APP_NAME="emoji-wizz"
APPRUNNER_ROLE_NAME="${APP_NAME}-apprunner-ecr-role"
GHA_ROLE_NAME="${APP_NAME}-github-actions-role"
OIDC_PROVIDER_URL="token.actions.githubusercontent.com"

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

OIDC_PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER_URL}"

echo "==> emoji-wizz AWS teardown"
echo "    Account : ${ACCOUNT_ID}"
echo "    Region  : ${REGION}"
echo ""
echo "WARNING: This will permanently delete all emoji-wizz AWS resources."
read -r -p "Continue? [y/N] " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi
echo ""

# ---------------------------------------------------------------------------
# 1. App Runner service
# ---------------------------------------------------------------------------
echo "==> [App Runner] Deleting service '${APP_NAME}' ..."
SERVICE_ARN=$(aws apprunner list-services \
  --region "${REGION}" \
  --output text \
  --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'].ServiceArn | [0]" 2>/dev/null || true)

if [[ -z "${SERVICE_ARN}" || "${SERVICE_ARN}" == "None" ]]; then
  echo "    Service not found, skipping."
else
  aws apprunner delete-service \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" \
    --output text --query 'Service.Status' || true
  echo "    Deletion initiated: ${SERVICE_ARN}"
  echo "    Waiting for deletion to complete ..."
  aws apprunner wait service-deleted \
    --service-arn "${SERVICE_ARN}" \
    --region "${REGION}" 2>/dev/null || true
  echo "    Done."
fi

# ---------------------------------------------------------------------------
# 2. GitHub Actions IAM role
# ---------------------------------------------------------------------------
echo "==> [IAM] Deleting GitHub Actions role '${GHA_ROLE_NAME}' ..."
if aws iam get-role --role-name "${GHA_ROLE_NAME}" \
    --output text --query 'Role.RoleName' 2>/dev/null | grep -q "${GHA_ROLE_NAME}"; then
  # Delete inline policies first
  INLINE_POLICIES=$(aws iam list-role-policies \
    --role-name "${GHA_ROLE_NAME}" \
    --output text --query 'PolicyNames' 2>/dev/null || true)
  for policy in ${INLINE_POLICIES}; do
    echo "    Removing inline policy: ${policy}"
    aws iam delete-role-policy \
      --role-name "${GHA_ROLE_NAME}" \
      --policy-name "${policy}" || true
  done
  # Detach managed policies
  MANAGED_POLICIES=$(aws iam list-attached-role-policies \
    --role-name "${GHA_ROLE_NAME}" \
    --output text --query 'AttachedPolicies[*].PolicyArn' 2>/dev/null || true)
  for arn in ${MANAGED_POLICIES}; do
    echo "    Detaching managed policy: ${arn}"
    aws iam detach-role-policy \
      --role-name "${GHA_ROLE_NAME}" \
      --policy-arn "${arn}" || true
  done
  aws iam delete-role --role-name "${GHA_ROLE_NAME}"
  echo "    Deleted."
else
  echo "    Role not found, skipping."
fi

# ---------------------------------------------------------------------------
# 3. App Runner ECR access role
# ---------------------------------------------------------------------------
echo "==> [IAM] Deleting App Runner ECR access role '${APPRUNNER_ROLE_NAME}' ..."
if aws iam get-role --role-name "${APPRUNNER_ROLE_NAME}" \
    --output text --query 'Role.RoleName' 2>/dev/null | grep -q "${APPRUNNER_ROLE_NAME}"; then
  # Detach managed policies
  MANAGED_POLICIES=$(aws iam list-attached-role-policies \
    --role-name "${APPRUNNER_ROLE_NAME}" \
    --output text --query 'AttachedPolicies[*].PolicyArn' 2>/dev/null || true)
  for arn in ${MANAGED_POLICIES}; do
    echo "    Detaching managed policy: ${arn}"
    aws iam detach-role-policy \
      --role-name "${APPRUNNER_ROLE_NAME}" \
      --policy-arn "${arn}" || true
  done
  aws iam delete-role --role-name "${APPRUNNER_ROLE_NAME}"
  echo "    Deleted."
else
  echo "    Role not found, skipping."
fi

# ---------------------------------------------------------------------------
# 4. OIDC provider (only if no other roles reference it)
# ---------------------------------------------------------------------------
echo "==> [IAM] Checking OIDC provider usage ..."
OTHER_ROLES=$(aws iam list-roles \
  --output text \
  --query "Roles[?contains(AssumeRolePolicyDocument, '${OIDC_PROVIDER_URL}')].RoleName" \
  2>/dev/null | tr '\t' '\n' | grep -v "${GHA_ROLE_NAME}" | grep -v "^$" || true)

if [[ -n "${OTHER_ROLES}" ]]; then
  echo "    OIDC provider still referenced by other roles, skipping deletion:"
  echo "${OTHER_ROLES}" | sed 's/^/      /'
else
  echo "==> [IAM] Deleting OIDC provider for '${OIDC_PROVIDER_URL}' ..."
  if aws iam get-open-id-connect-provider \
      --open-id-connect-provider-arn "${OIDC_PROVIDER_ARN}" \
      --output text --query 'Url' 2>/dev/null | grep -q "${OIDC_PROVIDER_URL}"; then
    aws iam delete-open-id-connect-provider \
      --open-id-connect-provider-arn "${OIDC_PROVIDER_ARN}"
    echo "    Deleted."
  else
    echo "    OIDC provider not found, skipping."
  fi
fi

# ---------------------------------------------------------------------------
# 5. ECR repository (force-delete all images)
# ---------------------------------------------------------------------------
echo "==> [ECR] Deleting repository '${APP_NAME}' (and all images) ..."
if aws ecr describe-repositories \
    --repository-names "${APP_NAME}" \
    --region "${REGION}" \
    --output text --query 'repositories[0].repositoryName' 2>/dev/null | grep -q "${APP_NAME}"; then
  aws ecr delete-repository \
    --repository-name "${APP_NAME}" \
    --region "${REGION}" \
    --force \
    --output text --query 'repository.repositoryUri'
  echo "    Deleted."
else
  echo "    Repository not found, skipping."
fi

echo ""
echo "==> Teardown complete. All emoji-wizz AWS resources removed."
