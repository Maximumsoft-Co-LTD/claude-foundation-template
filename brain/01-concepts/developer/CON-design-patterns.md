---
type: concept
tags: [developer, design-patterns, GoF, creational, structural, behavioral]
related: [CON-solid-principles, CON-clean-code, CON-refactoring]
updated: 2026-03-25
---

# Design Patterns (Gang of Four)

## What Are Design Patterns?

Reusable solutions to commonly occurring problems in software design. Not code — a **template** for how to solve a problem that can be adapted to many situations.

Organized into 3 categories by GoF (Gang of Four: Gamma, Helm, Johnson, Vlissides):

---

## Creational Patterns (Object Creation)

### Factory Method
```
Problem: Creating objects without specifying the exact class
Solution: Define interface for creating object; subclasses decide which class to instantiate

interface Logger { log(msg: string): void }
class FileLogger implements Logger { ... }
class ConsoleLogger implements Logger { ... }

function createLogger(type: 'file' | 'console'): Logger {
  if (type === 'file') return new FileLogger()
  return new ConsoleLogger()
}
```

### Builder
```
Problem: Constructing complex objects step by step
Solution: Separate construction from representation

new QueryBuilder()
  .table('users')
  .where('age', '>', 18)
  .orderBy('name')
  .limit(20)
  .build()  // → "SELECT * FROM users WHERE age > 18 ORDER BY name LIMIT 20"
```

### Singleton
```
Problem: Exactly one instance needed globally
Solution: Class ensures only one instance exists

class DatabaseConnection {
  private static instance: DatabaseConnection
  static getInstance() {
    if (!this.instance) this.instance = new DatabaseConnection()
    return this.instance
  }
}

⚠️ Use sparingly — makes testing hard (global state)
```

---

## Structural Patterns (Object Composition)

### Adapter
```
Problem: Incompatible interfaces need to work together
Solution: Wrapper that translates one interface to another

// Old payment system expects: { cardNumber, cvv, amount }
// New SDK provides: { card: { number, cvv }, value }

class PaymentAdapter {
  pay(oldFormat: OldFormat) {
    return newSDK.charge({
      card: { number: oldFormat.cardNumber, cvv: oldFormat.cvv },
      value: oldFormat.amount
    })
  }
}
```

### Decorator
```
Problem: Add behavior to objects without altering their class
Solution: Wrap object in decorator that adds behavior

interface Coffee { cost(): number; description(): string }
class SimpleCoffee implements Coffee { cost() { return 10 } }
class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  cost() { return this.coffee.cost() + 2 }
  description() { return this.coffee.description() + ', milk' }
}
// new MilkDecorator(new SimpleCoffee()).cost() → 12
```

### Facade
```
Problem: Complex subsystem is hard to use
Solution: Simplified interface over complex system

class HomeTheaterFacade {
  watchMovie(movie: string) {
    this.amplifier.on()
    this.amplifier.setVolume(5)
    this.projector.on()
    this.dvdPlayer.play(movie)
    // ... 10 more steps
  }
  // User calls ONE method, not 10
}
```

---

## Behavioral Patterns (Object Communication)

### Observer
```
Problem: When one object changes state, others need to know
Solution: Subject maintains list of observers, notifies on change

class EventEmitter {
  private listeners: Map<string, Function[]> = new Map()
  on(event: string, fn: Function) { ... }
  emit(event: string, data: any) { ... }
}

// Used in: DOM events, React state, message queues
```

### Strategy
```
Problem: Multiple algorithms for same task, choose at runtime
Solution: Define family of algorithms, make them interchangeable

interface SortStrategy { sort(data: number[]): number[] }
class QuickSort implements SortStrategy { ... }
class MergeSort implements SortStrategy { ... }

class Sorter {
  constructor(private strategy: SortStrategy) {}
  sort(data: number[]) { return this.strategy.sort(data) }
}
// Switch algorithm without changing client code
```

### Command
```
Problem: Encapsulate a request as an object (undo, queue, log)
Solution: Command objects with execute() and undo() methods

interface Command { execute(): void; undo(): void }
class MoveCommand implements Command {
  execute() { this.piece.moveTo(this.newPos) }
  undo() { this.piece.moveTo(this.oldPos) }
}

// History stack → undo/redo
// Job queue → deferred execution
```

### Template Method
```
Problem: Algorithm skeleton, subclasses fill in steps
Solution: Base class defines sequence; subclasses override specific steps

abstract class DataProcessor {
  process() {           // Template method — defines flow
    this.readData()     // Step 1 (can override)
    this.processData()  // Step 2 (must override)
    this.writeData()    // Step 3 (can override)
  }
  abstract processData(): void
}
```

---

## Pattern Selection Guide

| Situation | Pattern |
|-----------|---------|
| Need to create objects without specifying type | Factory / Abstract Factory |
| Building complex objects step by step | Builder |
| Only one instance needed | Singleton |
| Incompatible interfaces | Adapter |
| Add behavior without changing class | Decorator |
| Simplify complex subsystem | Facade |
| One-to-many dependency notification | Observer |
| Choose algorithm at runtime | Strategy |
| Encapsulate request, support undo | Command |

## Anti-patterns to Avoid

| Anti-pattern | Problem |
|-------------|---------|
| Over-engineering with patterns | Patterns add complexity — only when needed |
| Singleton everywhere | Creates hidden global state, kills testability |
| Pattern for pattern's sake | "This looks like a good place for a Visitor" → just use a function |

## Related

- [[CON-solid-principles]] — patterns implement SOLID
- [[CON-clean-code]] — patterns should still produce clean code
- [[CON-refactoring]] — refactor toward patterns
- [[../../00-MOC/MOC-Developer-Fundamentals]]
