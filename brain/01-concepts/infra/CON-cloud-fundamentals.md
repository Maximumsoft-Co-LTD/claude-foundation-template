---
type: concept
tags: [infra, cloud, AWS, GCP, Azure, IaaS, PaaS, SaaS]
related: [CON-sre-fundamentals, CON-scalability-patterns, CON-networking-basics]
updated: 2026-03-25
source: template
---

# Cloud Fundamentals

## Service Models

```
IaaS (Infrastructure as a Service)
  You manage: OS, Runtime, Middleware, App, Data
  Cloud manages: Virtualization, Servers, Storage, Networking
  Examples: AWS EC2, GCP Compute Engine, Azure VMs
  Use: Full control needed, custom OS configs

PaaS (Platform as a Service)
  You manage: App, Data
  Cloud manages: Everything else
  Examples: App Engine, Heroku, Azure App Service, Cloud Run
  Use: Focus on code, not servers

SaaS (Software as a Service)
  You manage: Data and configuration
  Cloud manages: Everything
  Examples: Gmail, Salesforce, Datadog, GitHub
  Use: Commodity tools you don't need to run yourself

FaaS (Functions as a Service / Serverless)
  You manage: Function code only
  Cloud manages: Server, scaling, runtime
  Examples: AWS Lambda, GCP Cloud Functions, Azure Functions
  Use: Event-driven, variable traffic, short-lived tasks
```

## Core AWS Services (Most Common)

| Category | Service | Use |
|----------|---------|-----|
| Compute | EC2 | Virtual machines |
| Compute | ECS/EKS | Container orchestration |
| Compute | Lambda | Serverless functions |
| Storage | S3 | Object storage (files, images, backups) |
| Database | RDS | Managed relational DB (Postgres, MySQL) |
| Database | DynamoDB | Managed NoSQL |
| Database | ElastiCache | Managed Redis/Memcached |
| Network | VPC | Isolated network |
| Network | ALB/NLB | Load balancers |
| Network | CloudFront | CDN |
| Network | Route 53 | DNS |
| Security | IAM | Identity and access management |
| Security | Secrets Manager | Secrets storage |
| Queue | SQS | Message queue |
| Queue | SNS | Pub/sub notifications |
| Monitoring | CloudWatch | Metrics, logs, alerts |

## Cloud Architecture Principles (AWS Well-Architected)

```
1. Operational Excellence
   → Automate operations, run and monitor systems

2. Security
   → Protect data, systems, and assets (least privilege, encryption)

3. Reliability
   → Recover from failures, handle demand changes
   → Multi-AZ (Availability Zones) for high availability

4. Performance Efficiency
   → Use resources efficiently, adapt to changing load

5. Cost Optimization
   → Avoid unnecessary costs, right-size resources

6. Sustainability
   → Minimize environmental impact
```

## Multi-Region vs Multi-AZ

```
Availability Zone (AZ): Physically separate data center within a region
  → Multi-AZ: protect against single data center failure
  → RDS Multi-AZ: automatic failover to standby

Region: Geographic area (e.g., ap-southeast-1 = Singapore)
  → Multi-Region: protect against regional disaster
  → More complex: data replication, latency, compliance

Typical production setup:
  1 Region (ap-southeast-1)
  3 AZs (ap-southeast-1a, 1b, 1c)
  App servers in all 3 AZs behind load balancer
  RDS primary in 1a, standby in 1b
```

## Cost Optimization

```
Right-sizing:
  Monitor actual CPU/memory usage
  Don't run t3.2xlarge when t3.medium handles load

Reserved Instances (commit 1-3 years = 30-60% discount)
  Use for: predictable baseline load

Spot Instances (up to 90% discount, can be interrupted)
  Use for: batch jobs, stateless workers, testing

Savings Plans:
  Commit to $ spend per hour, discount applies across services

Auto Scaling:
  Scale in during off-peak hours
  Don't leave prod-size resources running 24/7 if traffic drops at night
```

## Related

- [[CON-sre-fundamentals]] — SLI/SLO in cloud context
- [[CON-scalability-patterns]] — cloud enables horizontal scaling
- [[CON-networking-basics]] — VPC, subnets, security groups
- [[../devops/CON-containerization]] — containers run in cloud
- [[../../../00-MOC/MOC-Infrastructure]]
