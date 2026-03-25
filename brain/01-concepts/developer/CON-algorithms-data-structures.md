---
type: concept
tags: [developer, algorithms, data-structures, complexity, big-o]
related: [CON-solid-principles, CON-clean-code, CON-design-patterns, CON-sql-fundamentals]
updated: 2026-03-25
---

# Algorithms & Data Structures

## Big O Notation

Describes how an algorithm scales with input size (n). Captures worst-case behavior.

| Notation | Name | Example | Practical Meaning |
|----------|------|---------|-------------------|
| O(1) | Constant | Array access by index | Same time regardless of size |
| O(log n) | Logarithmic | Binary search | Cut problem in half each step |
| O(n) | Linear | Array iteration | Loop through all elements |
| O(n log n) | Linearithmic | Merge sort | Divide, sort, merge |
| O(n²) | Quadratic | Bubble sort, nested loops | Slow on large inputs |
| O(2^n) | Exponential | Recursive Fibonacci | Avoid when possible |
| O(n!) | Factorial | Permutations | Never acceptable for large n |

**Practical examples:**
- O(1): `arr[5]`, hash map lookup (average case)
- O(log n): binary search on 1M items = ~20 comparisons
- O(n): iterating array of 1M items
- O(n log n): sorting 1M items = ~20M operations
- O(n²): checking all pairs in 1000 items = 1M comparisons (too slow)

---

## Data Structures & Use Cases

### Linear: Array / List
- **Operations:** Index access O(1), Insert/Delete at end O(1) amortized, Insert/Delete at start O(n)
- **Use when:** Ordered collection, random access, cache-friendly
- **Trade-offs:** Fixed size (array), or dynamic reallocation cost (list)

### Stack (LIFO)
- **Operations:** Push O(1), Pop O(1), Peek O(1)
- **Use when:** Backtracking (undo/redo), expression parsing, function call stack
- **Implementation:** Array-based is simplest

### Queue (FIFO)
- **Operations:** Enqueue O(1), Dequeue O(1), Peek O(1)
- **Use when:** Task scheduling, BFS, message processing
- **Implementation:** Array with front/rear pointers, or linked list

### Deque (Double-ended Queue)
- **Operations:** All operations O(1) on both ends
- **Use when:** Sliding window problems, work stealing
- **Implementation:** Circular array or doubly linked list

### Hash Map / Hash Set
- **Operations:** Insert/Delete/Lookup O(1) average, O(n) worst case
- **Collision handling:** Chaining (linked lists) vs Open addressing (linear/quadratic probing)
- **Use when:** Fast lookup, unique tracking, frequency counting
- **Load factor:** keep < 0.75; resize when exceeded

### Linked List (Singly)
- **Operations:** Traverse O(n), Insert at head O(1), Insert after node O(1), Delete requires previous node
- **Use when:** Unknown size, frequent inserts/deletes, no random access needed
- **Trade-off:** O(n) to find position, cache-unfriendly

### Doubly Linked List
- **Operations:** Same as singly, but Delete O(1) if you have node reference
- **Use when:** LRU cache, undo/redo with bidirectional navigation
- **Cost:** Extra pointer per node

### Binary Search Tree (BST)
- **Operations:** Search/Insert/Delete O(log n) average, O(n) worst (unbalanced)
- **Property:** Left < Root < Right
- **Use when:** Ordered traversal, range queries
- **Balance:** Use AVL or Red-Black for guaranteed O(log n)

### Heap (Priority Queue)
- **Operations:** Insert O(log n), Delete min/max O(log n), Peek min/max O(1)
- **Property:** Min-heap: parent < children; Max-heap: parent > children
- **Use when:** Task scheduling (priority), Dijkstra's algorithm, Kth largest element
- **Implementation:** Array-based binary tree

### Graph
- **Adjacency List:** O(V + E) space, O(1) edge lookup, preferred for sparse graphs
  ```
  adj[u] = [v, w, x]  // u connects to v, w, x
  ```
- **Adjacency Matrix:** O(V²) space, O(1) edge lookup, preferred for dense graphs
  ```
  matrix[u][v] = 1 if edge exists
  ```
- **Use when:** Networks, dependencies, pathfinding
- **Variants:** Directed/Undirected, Weighted/Unweighted, Cyclic/Acyclic

---

## Essential Algorithms

### Sorting

| Algorithm | Best | Average | Worst | Space | Stable | Notes |
|-----------|------|---------|-------|-------|--------|-------|
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes | Divide & conquer, external sort friendly |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No | In-place, cache-friendly, prefer for arrays |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No | In-place, good for space-constrained |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Good for small/nearly-sorted |
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Avoid (educational only) |

**Choose by context:**
- Unknown data: Merge Sort (predictable, stable)
- Array, average case: Quick Sort (fast in practice)
- Space critical: Heap Sort or Quick Sort
- Nearly sorted: Insertion Sort
- Need stable: Merge Sort or Insertion Sort

### Searching

**Binary Search** O(log n)
- Requires sorted input
- Example: Find first occurrence of target in sorted array
  ```
  left=0, right=n-1
  while left <= right:
      mid = (left + right) // 2
      if arr[mid] == target: return mid
      elif arr[mid] < target: left = mid + 1
      else: right = mid - 1
  return -1
  ```

**Breadth-First Search (BFS)** O(V + E)
- Level-order traversal, shortest path in unweighted graph
- Use queue

**Depth-First Search (DFS)** O(V + E)
- Recursion or stack, all paths, topological sort
- Detect cycles, connected components

### Dynamic Programming

**Memoization** (top-down, recursive):
```
memo = {}
def fib(n):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n-1) + fib(n-2)
    return memo[n]
```

**Tabulation** (bottom-up, iterative):
```
dp = [0] * (n+1)
dp[0], dp[1] = 0, 1
for i in range(2, n+1):
    dp[i] = dp[i-1] + dp[i-2]
return dp[n]
```

**Use DP when:** Overlapping subproblems + optimal substructure (Fibonacci, shortest path, knapsack)

### Two Pointers

Reduce O(n²) nested loop to O(n):
- Sorted array, find pair that sum to target
- Reverse string in-place
- Remove duplicates

### Sliding Window

Fixed or variable window over array:
- Longest substring without repeating characters
- Maximum sum subarray of size k
- Minimum window substring

---

## Complexity Cheat Sheet

| Data Structure | Insert | Delete | Search | Access | Notes |
|---|---|---|---|---|---|
| Array | O(n) | O(n) | O(n) | O(1) | Random access, contiguous |
| Linked List | O(1)* | O(1)* | O(n) | O(n) | * at head or with reference |
| Hash Map | O(1) avg | O(1) avg | O(1) avg | — | O(n) worst (collisions) |
| Stack | O(1) | O(1) | O(n) | — | LIFO only |
| Queue | O(1) | O(1) | O(n) | — | FIFO only |
| BST | O(log n) avg | O(log n) avg | O(log n) avg | — | O(n) if unbalanced |
| Heap | O(log n) | O(log n)** | O(n) | O(1) | ** min/max only |

---

## When to Care

**Coding Interviews:** Memorize complexity, understand trade-offs, implement from scratch.

**Day-to-day Engineering:**
- Profile first (premature optimization is the root of all evil)
- Use language standard library (Vec, HashMap, BinaryHeap, etc.)
- Know the complexity of your operations (check docs)
- Only optimize hot paths identified by profiling
- Readability and maintainability often beat 10% speed gains

**Rule of thumb:** O(n log n) is the sweet spot for most problems. Avoid O(n²) on large datasets.
