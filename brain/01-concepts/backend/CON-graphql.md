---
type: concept
tags: [backend, graphql, api, schema, federation]
related: [CON-api-design-principles, CON-grpc, CON-database-patterns]
updated: 2026-04-29
source: template
---

# GraphQL

> A query language and server runtime for APIs. Client asks for **exactly the fields it needs**;
> the server resolves a typed graph of data.

## When to Pick GraphQL Over REST

| Pick GraphQL when… | Stick with REST when… |
|--------------------|----------------------|
| Frontend needs many shapes of the same data (mobile vs web) | Simple CRUD, fixed clients |
| Aggregating multiple backend services (BFF) | Heavy file uploads / streaming |
| Avoiding over-fetch / under-fetch on the wire | Caching at HTTP layer is critical (CDN, ETag) |
| Strong typing + introspectable schema | Public-facing API for unknown clients |
| Iterating on UI without breaking API versions | Existing REST tooling/team mastery |

## Schema, Resolvers, Operations

```graphql
# Schema (the contract)
type User {
  id: ID!
  name: String!
  posts(limit: Int = 10): [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}

type Query {
  user(id: ID!): User
  feed(cursor: String, limit: Int = 20): FeedConnection!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
}

type Subscription {
  postAdded(authorId: ID!): Post!
}
```

```javascript
// Resolvers (how each field is fetched)
const resolvers = {
  Query: {
    user: (_, { id }, ctx) => ctx.loaders.user.load(id),
  },
  User: {
    // Per-field resolver runs only if the client asks for `posts`
    posts: (user, { limit }, ctx) => ctx.loaders.postsByUser.load({ userId: user.id, limit }),
  },
  Mutation: {
    createPost: async (_, { input }, ctx) => {
      requireAuth(ctx)
      return ctx.db.posts.insert({ ...input, authorId: ctx.user.id })
    },
  },
}
```

## The N+1 Problem (the #1 GraphQL footgun)

```graphql
query { users(limit: 100) { id name posts { id title } } }
```

Naive resolver: 1 query for users + 100 queries for each user's posts = **101 queries**.

**Fix: DataLoader (per-request batching + caching)**

```javascript
// DataLoader batches all .load() calls in the same tick into one DB call
const postsByUserLoader = new DataLoader(async (userIds) => {
  const rows = await db.posts.findMany({ where: { authorId: { in: userIds } } })
  // Return posts grouped in the SAME ORDER as userIds
  const byUser = groupBy(rows, 'authorId')
  return userIds.map((id) => byUser[id] ?? [])
})
```

## Pagination — Always Cursor-Based for GraphQL

The **Relay Connection spec** is the de-facto standard:

```graphql
type FeedConnection {
  edges: [FeedEdge!]!
  pageInfo: PageInfo!
}

type FeedEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

Why cursor over offset: stable under inserts, scales to large data, supports infinite scroll.

## Mutations: Return the Mutated Data

```graphql
type CreatePostPayload {
  post: Post!
  errors: [UserError!]!  # Domain-level errors, not HTTP errors
}
```

Always return the mutated object so the client can update its cache without a refetch.

## Errors: Two Layers

```javascript
// 1. Top-level errors (parsing, auth) → response.errors[]
// 2. Domain errors (validation, business rule) → in payload.errors[]
{
  data: {
    createPost: {
      post: null,
      errors: [{ field: "title", message: "Too short" }]
    }
  }
}
```

Don't throw exceptions for domain errors — they bypass partial-success semantics that GraphQL excels at.

## Performance & Security Hardening

| Threat / Cost | Mitigation |
|---------------|------------|
| Deeply nested query (DoS) | **Max depth limiting** (`graphql-depth-limit`) |
| Wide expensive query | **Query cost analysis** (assign cost per field, cap total) |
| Repeated parses on hot paths | **Persisted queries** — client sends hash, server resolves to whitelisted op |
| Schema introspection in prod | Disable introspection on public endpoints |
| N+1 (already covered) | DataLoader |
| Auth | Field-level checks in resolvers (not just at the gateway) |

## Federation (Microservices)

Apollo Federation / GraphQL Fusion lets multiple backend services contribute to **one supergraph**:

```graphql
# users-service
type User @key(fields: "id") {
  id: ID!
  name: String!
}

# posts-service
type User @key(fields: "id") {
  id: ID!
  posts: [Post!]!   # extends User from users-service
}
```

The gateway plans queries across services. Watch out for: cross-service N+1, ownership boundaries (each field must have ONE owning service), tracing.

## REST → GraphQL Migration Patterns

1. **BFF pattern**: GraphQL gateway in front of existing REST → unify shape, no backend rewrite
2. **Incremental schema**: start with read-only queries, add mutations after
3. **Strangler**: new features use GraphQL, old REST endpoints stay until deprecated

## Anti-patterns

- ❌ Returning `JSON` scalar everywhere (you've recreated REST, lost the type system)
- ❌ One mutation called `update` with 30 optional fields (use specific mutations: `updateProfile`, `changePassword`)
- ❌ Letting clients write arbitrary deep queries against a public endpoint without depth/cost limits
- ❌ Skipping DataLoader because "we'll fix performance later" (you won't, and the schema shape will rot around the bad queries)
- ❌ Reusing the same `Error` type across all mutations (you lose discriminability)

## When NOT to Use GraphQL

- Simple internal services with one consumer (REST or gRPC is less ceremony)
- Heavy binary payloads / file streaming (use HTTP multipart or gRPC streaming)
- HTTP caching is your performance strategy (GraphQL POSTs bypass most CDN caching)
- Team has no GraphQL experience and the deadline is short

## Related

- [[CON-api-design-principles]] — REST principles also inform GraphQL schema design
- [[CON-grpc]] — alternative for service-to-service
- [[CON-database-patterns]] — N+1 originates here
- [[CON-rate-limiting]] — combine with cost analysis
- [[../../../00-MOC/MOC-Backend]]
