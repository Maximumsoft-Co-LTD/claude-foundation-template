---
type: concept
tags: [frontend, API, fetching, React-Query, error-handling, loading-states]
related: [CON-state-management, CON-component-architecture]
updated: 2026-03-25
source: template
---

# API Integration (Frontend)

## The Problem with Manual Fetching

```typescript
// ❌ Anti-pattern — manual useEffect fetching
useEffect(() => {
  setLoading(true)
  fetch('/api/users')
    .then(r => r.json())
    .then(setUsers)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])

Problems:
- Race conditions (fast navigation → multiple requests, wrong one resolves last)
- No caching (refetch on every mount)
- No deduplication (multiple components trigger same request)
- No background refresh
- Manual loading/error state management
```

## React Query (Recommended)

```typescript
// ✅ React Query — declarative, handles everything
const { data: users, isLoading, error, refetch } = useQuery({
  queryKey: ['users'],          // Cache key
  queryFn: () => api.getUsers(),
  staleTime: 5 * 60 * 1000,   // Consider fresh for 5 min
  retry: 2,                    // Retry failed requests 2x
})

if (isLoading) return <Skeleton />
if (error) return <ErrorMessage error={error} onRetry={refetch} />
return <UserList users={users} />
```

## API Client Pattern

Centralize API calls — never call `fetch` directly in components:

```typescript
// api/users.ts — single place for all user-related API calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL

export const usersApi = {
  getAll: () => fetchJson<User[]>(`${API_BASE}/users`),
  getById: (id: string) => fetchJson<User>(`${API_BASE}/users/${id}`),
  create: (data: CreateUserInput) =>
    fetchJson<User>(`${API_BASE}/users`, { method: 'POST', body: data }),
  update: (id: string, data: Partial<User>) =>
    fetchJson<User>(`${API_BASE}/users/${id}`, { method: 'PATCH', body: data }),
}

// Shared fetch wrapper with error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new ApiError(error.code, error.message, res.status)
  }

  return res.json()
}
```

## Mutations (Create/Update/Delete)

```typescript
const createUser = useMutation({
  mutationFn: (data: CreateUserInput) => usersApi.create(data),
  onSuccess: (newUser) => {
    // Invalidate related queries → refetch
    queryClient.invalidateQueries({ queryKey: ['users'] })
    toast.success('User created!')
    router.push(`/users/${newUser.id}`)
  },
  onError: (error: ApiError) => {
    toast.error(error.message)
  },
})

// In component
<button
  onClick={() => createUser.mutate(formData)}
  disabled={createUser.isPending}
>
  {createUser.isPending ? 'Creating...' : 'Create User'}
</button>
```

## Optimistic Updates

Show result immediately, rollback if server fails:

```typescript
const toggleLike = useMutation({
  mutationFn: (postId: string) => postsApi.toggleLike(postId),
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ['posts', postId] })
    const previous = queryClient.getQueryData(['posts', postId])

    // Optimistically update
    queryClient.setQueryData(['posts', postId], (old: Post) => ({
      ...old,
      liked: !old.liked,
      likeCount: old.liked ? old.likeCount - 1 : old.likeCount + 1
    }))

    return { previous }  // For rollback
  },
  onError: (err, postId, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts', postId], context?.previous)
  },
})
```

## Error States UI Pattern

Every data-fetching component needs all 4 states:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersApi.getById(userId),
  })

  // Loading state
  if (isLoading) {
    return <UserProfileSkeleton />
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message="Failed to load user profile"
        onRetry={refetch}
      />
    )
  }

  // Empty state
  if (!data) {
    return <EmptyState message="User not found" />
  }

  // Success state (happy path)
  return <UserCard user={data} />
}
```

## Pagination

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 1 }) => usersApi.getAll({ page: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
})

// Flatten pages
const users = data?.pages.flatMap(page => page.data) ?? []
```

## Related

- [[CON-state-management]] — server state belongs in React Query
- [[CON-component-architecture]] — loading/error/empty states in every component
- [[../backend/CON-api-design-principles]] — what the API returns
- [[../../../00-MOC/MOC-Frontend]]
