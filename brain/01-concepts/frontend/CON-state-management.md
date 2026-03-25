---
type: concept
tags: [frontend, state, react-query, zustand, redux, form-state]
related: [CON-component-architecture, CON-api-integration]
updated: 2026-03-25
---

# State Management

## State Decision Tree

```
Is this data from the server/API?
  → Server State: React Query / SWR / TanStack Query

Is this form data?
  → Form State: React Hook Form / Formik

Is this shared across many unrelated components?
  → Global UI State: Zustand / Redux / Jotai / Context

Is this only used by one component (or a small tree)?
  → Local State: useState / useReducer
```

## Server State (React Query / SWR)

```tsx
// ✅ Server state — use React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,  // 5 min
})

// ✅ Mutation
const mutation = useMutation({
  mutationFn: (data) => updateUser(userId, data),
  onSuccess: () => queryClient.invalidateQueries(['users']),
})

// ❌ Anti-pattern — manual useEffect for fetching
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers)
}, [])  // ← race conditions, no caching, no loading state
```

## Global State (Zustand — Recommended for New Projects)

```tsx
// store.ts
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

// Component
const { user, logout } = useStore()
```

## Form State (React Hook Form)

```tsx
const { register, handleSubmit, formState: { errors } } = useForm()

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email', { required: true, pattern: /^\S+@\S+$/ })} />
  {errors.email && <span>Valid email required</span>}
  <button type="submit">Submit</button>
</form>
```

## State Anti-patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| Everything in Redux | Overhead for simple UI state | Local state for UI |
| Fetch in useEffect | Race conditions, no caching | React Query |
| Prop drilling (>3 levels) | Hard to maintain | Context or Zustand |
| State duplication | Sync bugs | Single source of truth |
| Stale closures in useEffect | Wrong values | Proper deps array |

## When to Use Context

Good for: Theme, language, auth user (infrequently changed)
Bad for: Frequently updating data (causes re-renders everywhere)

```tsx
// ✅ Context for stable data
const ThemeContext = createContext('light')

// ❌ Context for high-frequency updates
// (use Zustand or Redux instead to prevent performance issues)
```

## Related

- [[CON-component-architecture]] — where state lives in component hierarchy
- [[CON-api-integration]] — server state fetching
- [[CON-performance-frontend]] — state causes re-renders
- [[../../../00-MOC/MOC-Frontend]]
