---
type: concept
tags: [backend, grpc, protobuf, rpc, microservices, streaming]
related: [CON-api-design-principles, CON-graphql, CON-microservices-patterns]
updated: 2026-04-29
source: template
---

# gRPC

> A high-performance RPC framework: **Protobuf** for the contract, **HTTP/2** for transport,
> codegen for client/server in 10+ languages.

## When to Pick gRPC

| Pick gRPC when… | Pick REST/GraphQL when… |
|-----------------|------------------------|
| Internal service-to-service (low latency, high throughput) | Browser clients (no native HTTP/2 trailers — need gRPC-Web) |
| Strongly-typed contract that codegens for many languages | Public API for unknown clients (REST is universal) |
| Streaming: bidirectional or server-push | Heavy human exploration / curl debuggability |
| Polyglot stack (Go service ↔ Python service ↔ Rust service) | Simple CRUD with HTTP caching needs |

**Common pattern:** gRPC for internal microservices, REST/GraphQL at the edge.

## Protobuf — the Contract

```proto
// user.proto
syntax = "proto3";
package user.v1;

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc StreamUserUpdates(StreamUserUpdatesRequest) returns (stream UserEvent);
  rpc UploadAvatar(stream AvatarChunk) returns (UploadResult);
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message User {
  string id = 1;            // tag numbers are part of the wire format — never change them
  string name = 2;
  string email = 3;
  reserved 4, 5;            // reserve removed fields to prevent reuse
  int64 created_at = 6;
}

message GetUserRequest {
  string id = 1;
}
```

**Codegen → typed clients/servers** in Go, TS, Python, Java, etc. The `.proto` file IS the API documentation.

## The Four RPC Types

```
1. Unary           client req ─────▶ server   (single req, single resp)
                          ◀───── resp

2. Server Stream   client req ─────▶ server
                          ◀───── resp1
                          ◀───── resp2
                          ◀───── ...

3. Client Stream   client req1 ────▶ server
                          req2 ────▶
                          ...
                          ◀───── resp

4. Bidirectional   client req1 ────▶ server
                          ◀──── resp1
                          req2 ────▶
                          ◀──── resp2
```

**Use cases:**
- Server stream → live feed, server push, log tail
- Client stream → file upload in chunks, batch ingest
- Bidi → chat, gaming, real-time collaboration

## Schema Evolution Rules (the most-broken rule in gRPC)

**Tag numbers are forever.** Wire format is `(tag, type, value)`.

```proto
// ✅ Safe changes
message User {
  string id = 1;
  string name = 2;
  string email = 3;
  string phone = 4;       // adding a new field with a new tag is safe
}

// ❌ Breaks compatibility
message User {
  string id = 1;
  string full_name = 2;   // renamed `name` → `full_name`: OK (name is metadata)
                          // BUT: if you change the TYPE of tag 2, you break everyone
}

// ✅ Removing a field
message User {
  string id = 1;
  reserved 2;             // mark tag 2 as reserved so nobody reuses it
  reserved "name";        // also reserve the field name
  string email = 3;
}
```

Rule: **add fields, never repurpose tags, always reserve removed tags.**

## Interceptors / Middleware

Cross-cutting concerns like auth, logging, metrics, retries:

```go
// Server interceptor (Go)
func authInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
  md, _ := metadata.FromIncomingContext(ctx)
  token := md.Get("authorization")
  user, err := verify(token)
  if err != nil {
    return nil, status.Error(codes.Unauthenticated, "invalid token")
  }
  ctx = context.WithValue(ctx, "user", user)
  return handler(ctx, req)
}
```

## Errors: Use Status Codes, Not Exceptions

```go
// Server side
return nil, status.Error(codes.NotFound, "user not found")

// Client side
if err != nil {
  st, _ := status.FromError(err)
  switch st.Code() {
  case codes.NotFound:    // 404 equivalent
  case codes.Unauthenticated: // 401
  case codes.PermissionDenied: // 403
  case codes.ResourceExhausted: // 429
  case codes.DeadlineExceeded: // timeout
  }
}
```

Standard codes ([gRPC code → HTTP mapping](https://grpc.github.io/grpc/core/md_doc_statuscodes.html)) — don't invent your own.

## Deadlines and Cancellation (non-negotiable)

```go
// Always set a deadline. ALWAYS.
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()
resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: "123"})
```

Without deadlines, slow upstream services cascade failure across your fleet.
Deadlines propagate **across the full call chain** — set once at the edge, every downstream sees it.

## Performance Characteristics

| Aspect | gRPC | REST/JSON |
|--------|------|-----------|
| Wire size | Binary (smaller) | Text (larger) |
| Serialization | Codegen (fast) | Reflection (slower) |
| Connection | HTTP/2 multiplexing (1 conn → many streams) | HTTP/1.1: 1 request per conn (HTTP/2 helps but rare for REST) |
| Latency | µs–low ms | low ms |
| CPU | Lower | Higher |

**Reality check:** for low-traffic services, the difference is dwarfed by your DB/network. gRPC's win is at scale, in polyglot fleets, or with streaming.

## gRPC-Web (Browser Clients)

Browsers can't speak full gRPC (no HTTP/2 trailers from JS). Solutions:

- **gRPC-Web**: proxy at the edge translates browser requests to gRPC
- **Connect** (buf.build): one server, three protocols (gRPC, gRPC-Web, Connect)
- **tRPC** (TypeScript only): non-Protobuf alternative, simpler

## Operational Concerns

- **Load balancing**: gRPC uses long-lived HTTP/2 conns → L4 load balancers don't rebalance traffic. Use **client-side LB** or service mesh (Istio, Linkerd).
- **Health checking**: implement the standard `grpc.health.v1.Health` service.
- **Reflection**: enable `grpc.reflection` server in dev only — lets `grpcurl` introspect.
- **Observability**: OpenTelemetry has first-class gRPC instrumentation; trace context propagates via metadata.

## Anti-patterns

- ❌ Versioning by repurposing tag numbers (use `package user.v2;` for breaking changes)
- ❌ No deadlines (you WILL have a cascading outage)
- ❌ Streaming when unary works (streams keep state — don't pay that cost without need)
- ❌ Hand-writing JSON wrappers around gRPC (defeats the type system; if you need REST too, use grpc-gateway codegen)
- ❌ Using `Any` everywhere (you've recreated dynamic typing — defeats the contract)
- ❌ Putting `.proto` files in service repos (centralize in a `protos/` repo or use [Buf Schema Registry](https://buf.build))

## When NOT to Use gRPC

- Public-facing API consumed by third parties (REST is the lingua franca)
- Heavy use of HTTP caching (CDN, ETag) — gRPC is opaque to HTTP caches
- Teams without code generation in their build pipeline (gRPC w/o codegen is painful)
- Browser-first stacks where gRPC-Web infra is overkill (consider tRPC or REST)

## Related

- [[CON-api-design-principles]] — REST alternative
- [[CON-graphql]] — another typed-API choice
- [[../architecture/CON-microservices-patterns]] — service mesh, circuit breaker apply here
- [[CON-async-patterns]] — gRPC streams complement message queues
- [[../../../00-MOC/MOC-Backend]]
