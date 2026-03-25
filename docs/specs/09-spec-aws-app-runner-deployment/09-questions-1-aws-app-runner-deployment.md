# 09 Questions Round 1 - AWS App Runner Deployment

Please answer each question below (select one or more options, or add your own notes). Feel free to add additional context under any question.

## 1. Deployment Approach

Your project already has both a `Dockerfile` (nginx-based) and an `apprunner.yaml` (Node.js `npx serve`-based). Which approach do you want to use for App Runner?

- [x] (A) **Image-based (Dockerfile + ECR)**: Build Docker image, push to ECR, App Runner pulls from ECR. Uses the existing nginx-based Dockerfile for optimal static file serving.
- [ ] (B) **Source-based (apprunner.yaml)**: App Runner builds directly from your GitHub repo using the `apprunner.yaml` config. Simpler setup, but uses `npx serve` instead of nginx.
- [ ] (C) **Source-based but switch to nginx**: Update apprunner.yaml to use a Docker-based build instead of Node runtime
- [ ] (D) Other (describe)

## 2. CI/CD Pipeline

How should deployments be triggered?

- [x] (A) **Auto-deploy on push to main**: Every merge to `main` automatically deploys to App Runner
- [ ] (B) **Manual trigger only**: Deploy via a manual GitHub Actions workflow dispatch
- [ ] (C) **Both**: Auto-deploy on main + manual trigger for ad-hoc deploys
- [ ] (D) **App Runner auto-deploy from GitHub**: Use App Runner's built-in GitHub integration (no GitHub Actions needed for deploy)
- [ ] (E) Other (describe)

## 3. Environment & Staging

Do you need multiple environments (e.g., staging + production)?

- [x] (A) **Production only**: Single App Runner service, deploy directly
- [ ] (B) **Staging + Production**: Two separate App Runner services, deploy to staging first, promote to production manually
- [ ] (C) **Preview environments**: Spin up temporary App Runner services for PRs
- [ ] (D) Other (describe)

## 4. Custom Domain & HTTPS

Do you need a custom domain for this deployment?

- [x] (A) **No custom domain**: Use the default App Runner URL (e.g., `https://xxxxx.us-east-1.awsapprunner.com`)
- [ ] (B) **Custom domain**: Configure a custom domain with HTTPS (e.g., `emoji-wizz.example.com`)
- [ ] (C) **Custom domain later**: Start with default URL, plan for custom domain in the future
- [ ] (D) Other (describe)

## 5. Infrastructure as Code

How do you want to manage the AWS resources?

- [ ] (A) **AWS CLI / Console manually**: Create App Runner service and related resources via CLI commands or AWS Console
- [ ] (B) **AWS CDK (TypeScript)**: Define infrastructure in TypeScript using AWS CDK, fits the project's TypeScript stack
- [ ] (C) **Terraform**: Use Terraform for infrastructure provisioning
- [ ] (D) **CloudFormation**: Use raw CloudFormation YAML/JSON templates
- [x] (E) Other (describe)
      Write shell scripts that create the resources with AWS CLI

## 6. AWS Account & Permissions

What is your current AWS setup?

- [x] (A) **Fresh AWS account**: No existing infrastructure, need to set up everything from scratch
- [ ] (B) **Existing AWS account with some infrastructure**: Have an account with some services already running
- [ ] (C) **Existing App Runner experience**: Already have App Runner services running and familiar with the setup
- [ ] (D) Other (describe)

Notes (e.g., AWS region preference, existing IAM roles, etc.):

## 7. Monitoring & Observability

What level of monitoring do you need at launch?

- [x] (A) **Basic**: App Runner's built-in health checks and CloudWatch metrics only
- [ ] (B) **Standard**: Health checks + CloudWatch alarms for errors/latency + basic dashboard
- [ ] (C) **Advanced**: Full observability with custom metrics, logging, tracing, and alerting
- [ ] (D) Other (describe)

## 8. Cost & Scaling

What are your expected traffic patterns and budget considerations?

- [x] (A) **Low traffic / hobby project**: Minimal scaling, cost-optimized (App Runner can scale to zero)
- [ ] (B) **Moderate traffic**: Some consistent traffic, basic auto-scaling
- [ ] (C) **High traffic**: Significant load expected, need to configure scaling policies carefully
- [ ] (D) Other (describe)

Notes (e.g., expected monthly budget, peak traffic times, etc.):
