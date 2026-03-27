---
type: concept
tags: [devops, kubernetes, containers, orchestration, helm]
related: [CON-containerization, CON-cicd-pipeline, CON-deployment-strategies, CON-infrastructure-as-code]
updated: 2026-03-25
source: template
---

# Container Orchestration

## Problem Statement

Running containers manually across multiple machines is error-prone and doesn't scale:

- **Scheduling:** Where do I run each container? Which machine has capacity?
- **Health checking:** If a container crashes, who restarts it?
- **Scaling:** How do I scale from 1 instance to 100 under load?
- **Rolling updates:** How do I deploy a new version without downtime?
- **Networking:** How do containers discover and communicate with each other?
- **Storage:** How do containers access persistent data?
- **Secrets management:** How do I securely pass database passwords to containers?

**Container orchestration** solves these problems with automated deployment, scheduling, scaling, and lifecycle management.

## Kubernetes (K8s)

Kubernetes is the industry-standard container orchestration platform. Core concepts:

### **Pod** (Smallest Deployable Unit)
A Pod wraps one or more containers (usually one). Containers in a Pod share:
- Network namespace (same IP address, localhost port sharing)
- Storage volumes
- Container runtime configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    ports:
    - containerPort: 80
```

### **Node**
A physical or virtual machine running Kubernetes. Each Node runs:
- **Kubelet:** Agent that manages Pods on the node
- **Container runtime:** Docker, containerd, or similar
- **kube-proxy:** Manages networking rules

### **Deployment** (Declarative Pod Management)
Defines a desired state for Pods (number of replicas, image, resources). Kubernetes continuously reconciles actual state to desired state.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3  # Always run 3 instances
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: myapp:1.0
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### **Service** (Internal Load Balancing & Discovery)
Exposes Pods internally or externally. Services provide:
- Stable DNS name (`web-app.default.svc.cluster.local`)
- Internal load balancing across Pod replicas
- Traffic routing rules

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  type: ClusterIP  # Internal only
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
```

### **Ingress** (External Traffic)
Routes external HTTP/HTTPS traffic to internal Services. Acts like a reverse proxy.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
spec:
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 80
```

### **ConfigMap** (Non-Secret Configuration)
Stores configuration as key-value pairs. Mounted as files or environment variables.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_HOST: postgres.default.svc.cluster.local
  LOG_LEVEL: info
```

### **Secret** (Sensitive Data)
Stores secrets (base64-encoded by default; can be encrypted at rest).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: dXNlcm5hbWU=  # base64-encoded
  password: cGFzc3dvcmQ=  # base64-encoded
```

## kubectl (Command-Line Tool)

Essential kubectl commands:

```bash
# View resources
kubectl get pods                    # List all Pods
kubectl get deployments             # List Deployments
kubectl get services               # List Services
kubectl describe pod web-app-xyz   # Detailed info

# Deploy
kubectl apply -f deployment.yaml   # Create/update resources
kubectl set image deployment/web-app web=myapp:2.0  # Update image

# Debug
kubectl logs pod-name              # View Pod logs
kubectl exec -it pod-name -- bash  # Shell into Pod
kubectl port-forward svc/web-app 8080:80  # Local port forwarding

# Scaling
kubectl scale deployment web-app --replicas=5  # Manual scaling

# Delete
kubectl delete pod web-app-xyz     # Delete Pod
kubectl delete deployment web-app  # Delete Deployment
```

## Helm (Package Manager)

Helm packages Kubernetes manifests into reusable **Charts**. Instead of writing 50 YAML files, use a chart:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-postgres bitnami/postgresql --set auth.password=secret
```

Helm provides:
- Templating (reduce repetition across environments)
- Versioning and rollback
- Dependency management

## Scaling Strategies

### **Horizontal Pod Autoscaler (HPA)**
Automatically scales the number of Pod replicas based on metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Effect:** If CPU usage exceeds 70%, Kubernetes adds more replicas (up to 10). When usage drops, it scales down to at least 2.

### **Vertical Pod Autoscaler (VPA)**
Recommends or automatically adjusts CPU/memory requests and limits.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"  # Auto-adjust resources
```

## Rolling Updates (Zero-Downtime Deployments)

Deployment controllers implement rolling updates automatically:

```bash
kubectl set image deployment/web-app web=myapp:2.0
```

Process:
1. Spin up 1 replica of the new version
2. Wait for it to pass health checks
3. Remove 1 replica of the old version
4. Repeat until all replicas updated

If health checks fail, automatically **rollback** to the previous version.

## Namespaces (Environment Isolation)

Kubernetes clusters can have multiple **namespaces** for logical separation:

```bash
kubectl create namespace production
kubectl create namespace staging
kubectl apply -f deployment.yaml -n staging
```

Benefits:
- Isolate teams or projects
- Apply resource quotas per namespace
- Separate environment configurations (dev vs. prod)
- Avoid naming conflicts

## Architecture Summary

```
Cluster (1 or more Nodes)
├── Node 1
│   ├── Kubelet + Container Runtime
│   ├── Pod (web-app-1)
│   │   └── Container (nginx)
│   ├── Pod (web-app-2)
│   │   └── Container (nginx)
│   └── kube-proxy
├── Node 2
│   ├── Kubelet + Container Runtime
│   ├── Pod (db-1)
│   │   └── Container (postgres)
│   └── kube-proxy
└── Control Plane
    ├── API Server
    ├── Scheduler (places Pods on Nodes)
    ├── Controller Manager (reconciles state)
    └── etcd (cluster database)

External
├── Service (web-app) → Cluster IP routing
├── Ingress (myapp.com) → External traffic → Service
├── ConfigMap (app-config)
└── Secret (db-credentials)
```

## Common Patterns

### **Multi-Environment Deployment**
Use separate namespaces or clusters; Helm values override environment-specific config.

```bash
helm install my-app ./chart -n prod -f values-prod.yaml
helm install my-app ./chart -n staging -f values-staging.yaml
```

### **Blue-Green Deployments**
Run two versions in parallel; switch traffic after validation.

```yaml
# Blue (current)
kubectl apply -f deployment-v1.yaml

# Green (new)
kubectl apply -f deployment-v2.yaml

# Switch Service selector to v2 after testing
kubectl patch service web-app -p '{"spec":{"selector":{"version":"v2"}}}'
```

### **Canary Deployments**
Gradually shift traffic from old to new version (often with tools like [[CON-gitops|ArgoCD]] or Flagger).

## See Also

- [[CON-containerization]] — Docker, container images, registries
- [[CON-cicd-pipeline]] — Automated testing and deployment
- [[CON-deployment-strategies]] — Blue-green, canary, rolling updates
- [[CON-infrastructure-as-code]] — Declarative infrastructure management
