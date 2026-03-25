---
type: concept
tags: [devops, IaC, Terraform, infrastructure, automation]
related: [CON-containerization, CON-cicd-pipeline, CON-gitops]
updated: 2026-03-25
---

# Infrastructure as Code (IaC)

## What Is IaC?

Managing infrastructure (servers, networks, databases) through **code and configuration files** instead of manual processes.

```
Without IaC:               With IaC:
  - Click AWS console      - Write Terraform/Pulumi code
  - Manually configure     - Run terraform apply
  - Can't reproduce        - Reproducible every time
  - No history             - Git history of all changes
  - "Snowflake servers"    - Identical environments
```

## Benefits

| Benefit | What It Means |
|---------|--------------|
| Reproducibility | Same code → identical dev/staging/prod |
| Version control | Infrastructure changes tracked in git |
| Automation | `terraform apply` replaces clicking |
| Documentation | Code IS the documentation |
| Disaster recovery | Rebuild from scratch in minutes |
| Testing | Plan before apply, validate changes |

## Terraform (Most Common)

```hcl
# main.tf — provision an AWS EC2 instance + RDS database

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" { default = "ap-southeast-1" }
variable "environment" { default = "production" }

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "${var.environment}-vpc" }
}

# Application server
resource "aws_instance" "app" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  vpc_security_group_ids = [aws_security_group.app.id]
  tags = { Name = "${var.environment}-app", Environment = var.environment }
}

# Database
resource "aws_db_instance" "postgres" {
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  db_name           = "myapp"
  # Password from Secrets Manager, not hardcoded!
  password = data.aws_secretsmanager_secret_version.db_pass.secret_string
  skip_final_snapshot = false
}
```

## Terraform Workflow

```bash
terraform init      # Download providers, setup backend
terraform plan      # Show what will change (ALWAYS review before apply)
terraform apply     # Make changes (prompts for confirmation)
terraform destroy   # Tear down (careful!)
terraform fmt       # Format code
terraform validate  # Check syntax
```

## Key Concepts

| Concept | Meaning |
|---------|---------|
| State | Tracks real infrastructure state (store in S3, not local) |
| Plan | Preview changes before applying |
| Apply | Execute the plan |
| Module | Reusable infrastructure component |
| Workspace | Multiple environments (dev/staging/prod) from same code |
| Provider | Plugin for each cloud (AWS, GCP, Azure) |

## Directory Structure

```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── vpc/
│   ├── app-server/
│   └── database/
└── shared/
    └── state-backend.tf
```

## IaC Best Practices

```
✅ Store state remotely (S3 + DynamoDB for locking)
✅ Never commit secrets (use Secrets Manager + data sources)
✅ Use modules for reusable components
✅ Tag all resources (environment, team, cost-center)
✅ terraform plan in CI, terraform apply after PR approval
✅ Pin provider versions (~> 5.0 not latest)
✅ Separate state per environment

❌ Manual changes via console (drift from IaC state)
❌ Storing secrets in .tf files
❌ One huge main.tf (split into logical files)
```

## Related

- [[CON-containerization]] — containers define app, IaC defines infra
- [[CON-cicd-pipeline]] — IaC changes run through CI/CD
- [[CON-gitops]] — IaC + Git = GitOps
- [[../../../00-MOC/MOC-DevOps]]
