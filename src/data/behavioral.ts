import type { Pattern } from '../types.ts';
export const behavioral: Pattern[] = [
{
 id: 'chain-of-responsibility', name: 'Chain of Responsibility', category: 'Behavioral',
 intent: 'Pass a request through ordered handlers that can process it or forward it.',
 alternatives: ['command', 'observer', 'mediator'],
 contrasts: ['Command packages a request as an object; it does not arrange candidate handlers in a forwarding chain.', 'Observer broadcasts events to subscribers; a chain controls ordered forwarding and can stop early.', 'Mediator centralizes coordination; a chain distributes decisions among linked handlers.'],
 scenarios: [
 {prompt: 'Support tickets go first to a bot, then an agent, then a specialist. Each level either resolves the ticket or forwards it to the next level. Which pattern fits?', explanation: 'Each handler independently decides whether to handle or forward the request, keeping the sender unaware of the final receiver.'},
 {prompt: 'An HTTP request passes through authentication, rate limiting, and validation. Any stage can reject it and prevent later stages from running. Stages must be reorderable. Which pattern fits?', explanation: 'The request moves along an ordered chain whose handlers may stop propagation.'},
 {prompt: 'A UI help request travels from a focused control to its parent containers until one can answer. It should stop at the first suitable handler rather than notify every container. Which pattern fits?', explanation: 'Conditional forwarding to the next candidate distinguishes this chain from an Observer broadcast.'}
 ],
 code: [
 {prompt: 'Which pattern routes a ticket to the next support level?', explanation: 'Support either handles the request within its limit or forwards it to next.', code: {
 typescript: `class Support {
  constructor(private limit: number, private next?: Support) {}
  resolve(level: number): string {
    if (level <= this.limit) return "Resolved";
    return this.next?.resolve(level) ?? "Unresolved";
  }
}`,
 java: `class Support {
  private final int limit; private final Support next;
  Support(int limit, Support next) { this.limit = limit; this.next = next; }
  String resolve(int level) {
    if (level <= limit) return "Resolved";
    return next == null ? "Unresolved" : next.resolve(level);
  }
}`}},
 {prompt: 'Which pattern allows a validation step to stop forwarding?', explanation: 'Gate forwards only when its own check succeeds, linking independently configurable handlers.', code: {
 typescript: `class Gate {
  constructor(private valid: (s: string) => boolean, private next?: Gate) {}
  accept(s: string): boolean {
    if (!this.valid(s)) return false;
    return this.next?.accept(s) ?? true;
  }
}`,
 java: `import java.util.function.Predicate;
class Gate {
  private final Predicate<String> valid; private final Gate next;
  Gate(Predicate<String> v, Gate n) { valid = v; next = n; }
  boolean accept(String s) {
    if (!valid.test(s)) return false;
    return next == null || next.accept(s);
  }
}`}}
 ],
 refactor: {prompt: 'Checks must become independent reorderable objects, each able to reject or forward the request. Which pattern should replace this fixed validation sequence?', explanation: 'Extract each check into a handler and link handlers in the desired order.', code: {
 typescript: `function accept(token: string, quota: number) {
  if (!token) return false;
  if (quota <= 0) return false;
  return true;
}`,
 java: `class Endpoint {
  boolean accept(String token, int quota) {
    if (token.isEmpty()) return false;
    if (quota <= 0) return false;
    return true;
  }
}`}}
},
{
 id: 'command', name: 'Command', category: 'Behavioral',
 intent: 'Represent an action as an object that can be queued, invoked, or recorded.',
 alternatives: ['strategy', 'memento', 'chain-of-responsibility'],
 contrasts: ['Strategy selects an algorithm for a task; Command represents a particular requested action and its parameters.', 'Memento stores state for restoration; Command packages an action, which may use snapshots when implementing undo.', 'Chain of Responsibility selects handlers by forwarding; a command encapsulates the operation itself.'],
 scenarios: [
 {prompt: 'Menu items, keyboard shortcuts, and toolbar buttons should trigger the same editor actions. Actions also need to be queued and recorded for macros. Which pattern fits?', explanation: 'Represent each request as a command object so different invokers can trigger or store it uniformly.'},
 {prompt: 'A job queue must store a receiver and the arguments for an operation, then execute it later through a common execute() interface. Which pattern fits?', explanation: 'Command turns the request and its parameters into a first-class object that can be scheduled.'},
 {prompt: 'An editor records operations such as InsertText and DeleteSelection, including their receivers and arguments. Some operations also implement undo(). Which pattern models these operations rather than just their saved state?', explanation: 'Commands represent actions. Memento may help save prior state, but does not represent the requested operations themselves.'}
 ],
 code: [
 {prompt: 'Which pattern packages a particular text insertion?', explanation: 'Insert holds both receiver and arguments, exposing the request through execute().', code: {
 typescript: `class Document { text = ""; }
interface Action { execute(): void }
class Insert implements Action {
  constructor(private doc: Document, private value: string) {}
  execute() { this.doc.text += this.value; }
}`,
 java: `class Document { String text = ""; }
interface Action { void execute(); }
class Insert implements Action {
  private final Document doc; private final String value;
  Insert(Document d, String v) { doc = d; value = v; }
  public void execute() { doc.text += value; }
}`}},
 {prompt: 'Which pattern decouples the queue from concrete operations?', explanation: 'The queue holds executable request objects without knowing which receiver or parameters each operation uses.', code: {
 typescript: `interface Task { execute(): void }
class JobQueue {
  private jobs: Task[] = [];
  add(job: Task) { this.jobs.push(job); }
  run() { this.jobs.splice(0).forEach(job => job.execute()); }
}`,
 java: `import java.util.*;
interface Task { void execute(); }
class JobQueue {
  private final Queue<Task> jobs = new ArrayDeque<>();
  void add(Task job) { jobs.add(job); }
  void run() { while (!jobs.isEmpty()) jobs.remove().execute(); }
}`}}
 ],
 refactor: {prompt: 'Toolbar actions must be reusable by shortcuts and stored as a replayable macro. Which pattern should extract each request into an executable object?', explanation: 'Create a command per action, capturing the receiver and arguments; invokers can execute or record the same objects.', code: {
 typescript: `class Editor { save() {} print() {} }
function click(name: string, editor: Editor) {
  if (name === "save") editor.save();
  if (name === "print") editor.print();
}`,
 java: `class Editor { void save() {} void print() {} }
class Toolbar {
  void click(String name, Editor editor) {
    if (name.equals("save")) editor.save();
    if (name.equals("print")) editor.print();
  }
}`}}
},
{
 id: 'iterator', name: 'Iterator', category: 'Behavioral',
 intent: 'Traverse a collection without exposing its internal representation.',
 alternatives: ['composite', 'visitor', 'memento'],
 contrasts: ['Composite defines uniform leaf/group behavior; Iterator provides a traversal protocol independent of storage.', 'Visitor adds type-specific operations to elements; Iterator is concerned with accessing elements in sequence.', 'Memento restores an object state; a traversal cursor records position for enumeration, not general rollback.'],
 scenarios: [
 {prompt: 'Clients need to traverse a playlist without knowing whether tracks are stored in an array, linked list, or paged source. Which pattern provides a stable traversal interface?', explanation: 'An iterator hides storage and exposes traversal operations such as next() and hasNext().'},
 {prompt: 'Two readers must traverse the same collection independently, each maintaining its own current position. Which pattern encapsulates that per-reader cursor?', explanation: 'Separate iterator objects keep independent traversal state while sharing the collection.'},
 {prompt: 'A tree should expose depth-first and breadth-first traversal objects. Clients simply request the next node; they are not adding type-specific operations to node classes. Which pattern fits?', explanation: 'The variability is traversal order and cursor state, making Iterator the direct fit.'}
 ],
 code: [
 {prompt: 'Which pattern is represented by Cursor?', explanation: 'Cursor encapsulates position and exposes sequential access without exposing array indexing to clients.', code: {
 typescript: `class Cursor<T> {
  private index = 0;
  constructor(private items: readonly T[]) {}
  hasNext() { return this.index < this.items.length; }
  next() {
    if (!this.hasNext()) throw new Error("Exhausted");
    return this.items[this.index++];
  }
}`,
 java: `import java.util.*;
class Cursor<T> {
  private int index; private final List<T> items;
  Cursor(List<T> items) { this.items = items; }
  boolean hasNext() { return index < items.size(); }
  T next() {
    if (!hasNext()) throw new NoSuchElementException();
    return items.get(index++);
  }
}`}},
 {prompt: 'Which pattern does Shelf expose through its traversal method?', explanation: 'Each call supplies a fresh traversal object, hiding the shelf representation behind the language iteration protocol.', code: {
 typescript: `class Shelf implements Iterable<string> {
  constructor(private titles: string[]) {}
  *[Symbol.iterator]() {
    for (const title of this.titles) yield title;
  }
}`,
 java: `import java.util.*;
class Shelf implements Iterable<String> {
  private final List<String> titles;
  Shelf(List<String> titles) { this.titles = List.copyOf(titles); }
  public Iterator<String> iterator() { return titles.iterator(); }
}`}}
 ],
 refactor: {prompt: 'Storage will change to a paginated source. Clients should use next()/hasNext() without seeing indexes or pages. Which pattern supplies this abstraction?', explanation: 'Move traversal state and storage-specific advancement into an iterator.', code: {
 typescript: `class Playlist { tracks = ["A", "B"]; }
function play(p: Playlist) {
  for (let i = 0; i < p.tracks.length; i++) console.log(p.tracks[i]);
}`,
 java: `class Playlist { String[] tracks = {"A", "B"}; }
class Player {
  void play(Playlist p) {
    for (int i = 0; i < p.tracks.length; i++) System.out.println(p.tracks[i]);
  }
}`}}
},
{
 id: 'mediator', name: 'Mediator', category: 'Behavioral',
 intent: 'Centralize collaboration rules so components do not depend directly on peers.',
 alternatives: ['observer', 'facade', 'chain-of-responsibility'],
 contrasts: ['Observer distributes notifications to subscribers; Mediator owns the rules coordinating multiple components.', 'Facade simplifies external access; a mediator actively governs communication among participating components.', 'Chain of Responsibility forwards through ordered handlers; a mediator centrally decides how peers respond.'],
 scenarios: [
 {prompt: 'A dialog has checkboxes, fields, and buttons with many dependencies. Widgets should notify a dialog coordinator instead of directly enabling and disabling one another. Which pattern fits?', explanation: 'The mediator contains collaboration rules and removes direct widget-to-widget dependencies.'},
 {prompt: 'Aircraft send requests to a control tower that coordinates runway access. Planes do not negotiate directly with every other plane. Which pattern models this coordination?', explanation: 'The tower acts as a mediator owning the interaction rules among participants.'},
 {prompt: 'A form coordinator receives field-change events and decides which other controls to enable based on business rules. It is more than a generic broadcast mechanism. Which pattern describes its role?', explanation: 'Although events may transport notifications, the coordinator role is Mediator because it owns cross-component decisions.'}
 ],
 code: [
 {prompt: 'Which pattern keeps Field from depending on Button?', explanation: 'Field communicates only with Dialog; Dialog owns the rule that changes Button.', code: {
 typescript: `class Button { enabled = false; }
class Dialog {
  constructor(private button: Button) {}
  changed(value: string) { this.button.enabled = value.length > 0; }
}
class Field {
  constructor(private dialog: Dialog) {}
  input(value: string) { this.dialog.changed(value); }
}`,
 java: `class Button { boolean enabled; }
class Dialog {
  private final Button button;
  Dialog(Button b) { button = b; }
  void changed(String value) { button.enabled = !value.isEmpty(); }
}
class Field {
  private final Dialog dialog;
  Field(Dialog d) { dialog = d; }
  void input(String value) { dialog.changed(value); }
}`}},
 {prompt: 'Which pattern centralizes coordination between a sensor and an alarm?', explanation: 'ControlRoom receives the participant event and applies the rule for the other participant, rather than Sensor referencing Alarm.', code: {
 typescript: `class Alarm { ringing = false; }
class ControlRoom {
  constructor(private alarm: Alarm) {}
  temperatureChanged(n: number) { this.alarm.ringing = n > 50; }
}
class Sensor {
  constructor(private room: ControlRoom) {}
  report(n: number) { this.room.temperatureChanged(n); }
}`,
 java: `class Alarm { boolean ringing; }
class ControlRoom {
  private final Alarm alarm;
  ControlRoom(Alarm a) { alarm = a; }
  void temperatureChanged(int n) { alarm.ringing = n > 50; }
}
class Sensor {
  private final ControlRoom room;
  Sensor(ControlRoom r) { room = r; }
  void report(int n) { room.temperatureChanged(n); }
}`}}
 ],
 refactor: {prompt: 'Many controls now manipulate each other directly. Which pattern moves these cross-control rules into one coordinator that controls notify?', explanation: 'A mediator accepts events from controls and performs the appropriate changes on other controls.', code: {
 typescript: `class Submit { enabled = false; }
class Warning { visible = true; }
class Field {
  changed(value: string, submit: Submit, warning: Warning) {
    submit.enabled = value.length > 0;
    warning.visible = value.length === 0;
  }
}`,
 java: `class Submit { boolean enabled; }
class Warning { boolean visible = true; }
class Field {
  void changed(String value, Submit submit, Warning warning) {
    submit.enabled = !value.isEmpty();
    warning.visible = value.isEmpty();
  }
}`}}
},
{
 id: 'memento', name: 'Memento', category: 'Behavioral',
 intent: 'Capture and restore an object state without exposing its internals to the caretaker.',
 alternatives: ['command', 'prototype', 'state'],
 contrasts: ['Command represents an operation; Memento represents saved state that an operation can restore.', 'Prototype creates another object from an instance; Memento records state for restoring the originator.', 'State changes behavior by delegating to state objects; Memento captures prior data for rollback.'],
 scenarios: [
 {prompt: 'An editor must support checkpoints. A history manager stores opaque snapshots but should not inspect the editor private fields. Which pattern fits?', explanation: 'The editor creates and restores mementos; the caretaker stores them without understanding their contents.'},
 {prompt: 'A game needs a reversible checkpoint of player position and inventory. The checkpoint manager should not know how those fields are represented. Which pattern fits?', explanation: 'The originator encapsulates snapshot creation and restoration, preserving its internal representation.'},
 {prompt: 'A transaction needs to restore an object to a prior state without replaying an inverse operation. The stored object is a snapshot, not an action. Which pattern is the direct fit?', explanation: 'Memento saves state for restoration; Command would describe the operation that caused the change.'}
 ],
 code: [
 {prompt: 'Which pattern is represented by Editor.save() and restore()?', explanation: 'The opaque snapshot hides the saved data from the history caretaker; only the originator restores it.', code: {
 typescript: `class Editor {
  private text = "";
  private saved = new WeakMap<object, string>();
  write(s: string) { this.text = s; }
  save(): object {
    const token = {}; this.saved.set(token, this.text); return token;
  }
  restore(token: object) {
    if (this.saved.has(token)) this.text = this.saved.get(token)!;
  }
}`,
 java: `class Editor {
  private String text = "";
  static final class Snapshot {
    private final String text;
    private Snapshot(String t) { text = t; }
  }
  void write(String s) { text = s; }
  Snapshot save() { return new Snapshot(text); }
  void restore(Snapshot s) { text = s.text; }
}`}},
 {prompt: 'Which pattern allows a caretaker to save and restore an opaque checkpoint?', explanation: 'Checkpoint captures the originator state while the caretaker only holds a token. The Java snapshot hides its contents in a nested private field.', code: {
 typescript: `class Player {
  private x = 0;
  private snapshots = new WeakMap<object, number>();
  move(x: number) { this.x = x; }
  checkpoint() {
    const token = {}; this.snapshots.set(token, this.x); return token;
  }
  restore(token: object) {
    if (this.snapshots.has(token)) this.x = this.snapshots.get(token)!;
  }
}`,
 java: `class Player {
  private int x;
  static final class Checkpoint {
    private final int x;
    private Checkpoint(int x) { this.x = x; }
  }
  void move(int x) { this.x = x; }
  Checkpoint checkpoint() { return new Checkpoint(x); }
  void restore(Checkpoint c) { x = c.x; }
}`}}
 ],
 refactor: {prompt: 'History should no longer read or write the editor fields directly. Which pattern lets the editor supply opaque snapshots and restore itself?', explanation: 'Move capture and restore into Editor and let History keep mementos instead of copying internal fields.', code: {
 typescript: `class Editor { text = ""; cursor = 0; }
function backup(e: Editor) {
  return { text: e.text, cursor: e.cursor };
}
function restore(e: Editor, s: { text: string; cursor: number }) {
  e.text = s.text; e.cursor = s.cursor;
}`,
 java: `class Editor { String text = ""; int cursor; }
record Backup(String text, int cursor) {}
class History {
  Backup save(Editor e) { return new Backup(e.text, e.cursor); }
  void restore(Editor e, Backup b) { e.text = b.text(); e.cursor = b.cursor(); }
}`}}
},
{
 id: 'observer', name: 'Observer', category: 'Behavioral',
 intent: 'Notify a dynamic set of subscribers when a publisher changes.',
 alternatives: ['mediator', 'chain-of-responsibility', 'command'],
 contrasts: ['Mediator owns collaboration rules; Observer defines a subscription relationship without requiring centralized business coordination.', 'Chain of Responsibility can stop after a handler; Observer notifies all registered subscribers independently.', 'Command packages an action to invoke; Observer maintains subscriptions and distributes change notifications.'],
 scenarios: [
 {prompt: 'A stock price feed must notify charts, alerts, and logs. These listeners can subscribe or unsubscribe at runtime, and the feed must not know their concrete classes. Which pattern fits?', explanation: 'The publisher maintains subscribers through a common notification contract.'},
 {prompt: 'Several dashboard widgets should refresh when a shared model changes. New widgets must be added without editing the model notification logic. Which pattern fits?', explanation: 'Widgets subscribe to the model; the model broadcasts changes to its registered observers.'},
 {prompt: 'A publisher sends an event to every subscribed listener. No listener decides whether the next listener receives it, and the publisher does not coordinate their business rules. Which pattern fits?', explanation: 'Independent fan-out to subscribers is Observer, rather than a forwarding chain or a rule-owning mediator.'}
 ],
 code: [
 {prompt: 'Which pattern is implemented by Feed?', explanation: 'Feed manages subscriptions and broadcasts values to every registered listener.', code: {
 typescript: `class Feed {
  private listeners = new Set<(n: number) => void>();
  subscribe(fn: (n: number) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  publish(n: number) { this.listeners.forEach(fn => fn(n)); }
}`,
 java: `import java.util.*;
import java.util.function.IntConsumer;
class Feed {
  private final Set<IntConsumer> listeners = new LinkedHashSet<>();
  Runnable subscribe(IntConsumer fn) {
    listeners.add(fn); return () -> listeners.remove(fn);
  }
  void publish(int n) { listeners.forEach(fn -> fn.accept(n)); }
}`}},
 {prompt: 'Which pattern keeps the model independent of its views?', explanation: 'Views register callbacks, and the model notifies them without depending on concrete view types.', code: {
 typescript: `class Model {
  private views: Array<(s: string) => void> = [];
  observe(view: (s: string) => void) { this.views.push(view); }
  update(value: string) { this.views.forEach(view => view(value)); }
}`,
 java: `import java.util.*;
import java.util.function.Consumer;
class Model {
  private final List<Consumer<String>> views = new ArrayList<>();
  void observe(Consumer<String> view) { views.add(view); }
  void update(String value) { views.forEach(view -> view.accept(value)); }
}`}}
 ],
 refactor: {prompt: 'New listeners should subscribe without changing PriceFeed, and existing listeners should be removable. Which pattern replaces these fixed dependencies?', explanation: 'Replace concrete notification calls with a subscriber collection and a common callback contract.', code: {
 typescript: `class PriceFeed {
  update(n: number) {
    console.log("Update chart", n);
    console.log("Send alert", n);
    console.log("Write log", n);
  }
}`,
 java: `class PriceFeed {
  void update(int n) {
    System.out.println("Update chart " + n);
    System.out.println("Send alert " + n);
    System.out.println("Write log " + n);
  }
}`}}
},
{
 id: 'state', name: 'State', category: 'Behavioral',
 intent: 'Delegate behavior to the current lifecycle state and model transitions explicitly.',
 alternatives: ['strategy', 'memento', 'template-method'],
 contrasts: ['Strategy selects interchangeable algorithms; State represents lifecycle modes and their transitions.', 'Memento saves prior data for restoration; State objects determine current behavior.', 'Template Method varies steps through inheritance in a fixed algorithm; State changes the active delegate as the lifecycle evolves.'],
 scenarios: [
 {prompt: 'An order responds differently to pay(), ship(), and cancel() depending on whether it is Draft, Paid, or Shipped. Operations can transition it between these modes. Which pattern fits?', explanation: 'Each state owns mode-specific behavior and transitions, reducing scattered lifecycle conditionals.'},
 {prompt: 'A media player reacts differently to pressing Play when stopped, playing, or paused. Actions may switch the current mode. Which pattern models this?', explanation: 'The same event is handled by the current state, which can move the context to another state.'},
 {prompt: 'A connection moves from Connecting to Connected to Closed as events occur. The active object decides legal operations and transitions; it is not a caller-selected algorithm. Which pattern fits?', explanation: 'Lifecycle-dependent behavior and transitions distinguish State from Strategy.'}
 ],
 code: [
 {prompt: 'Which pattern controls Door behavior?', explanation: 'Door delegates to the current Mode, and each concrete mode transitions the Door to another mode.', code: {
 typescript: `interface Mode { press(d: Door): void }
class Door {
  mode: Mode = new Closed();
  press() { this.mode.press(this); }
}
class Closed implements Mode { press(d: Door) { d.mode = new Open(); } }
class Open implements Mode { press(d: Door) { d.mode = new Closed(); } }`,
 java: `interface Mode { void press(Door d); }
class Door {
  Mode mode = new Closed();
  void press() { mode.press(this); }
}
class Closed implements Mode { public void press(Door d) { d.mode = new Open(); } }
class Open implements Mode { public void press(Door d) { d.mode = new Closed(); } }`}},
 {prompt: 'Which pattern models the invoice lifecycle?', explanation: 'Draft allows payment and transitions to Paid; Paid handles the same event differently.', code: {
 typescript: `interface Phase { pay(i: Invoice): string }
class Invoice {
  phase: Phase = new Draft();
  pay() { return this.phase.pay(this); }
}
class Draft implements Phase {
  pay(i: Invoice) { i.phase = new Paid(); return "Payment recorded"; }
}
class Paid implements Phase { pay() { return "Already paid"; } }`,
 java: `interface Phase { String pay(Invoice i); }
class Invoice {
  Phase phase = new Draft();
  String pay() { return phase.pay(this); }
}
class Draft implements Phase {
  public String pay(Invoice i) { i.phase = new Paid(); return "Payment recorded"; }
}
class Paid implements Phase {
  public String pay(Invoice i) { return "Already paid"; }
}`}}
 ],
 refactor: {prompt: 'Many operations repeat these lifecycle checks. Each mode should own legal behavior and transitions. Which pattern should replace the conditionals?', explanation: 'Introduce state objects and delegate the event to the active state instead of branching on a status string throughout the class.', code: {
 typescript: `class Connection {
  status = "connecting";
  event(e: string) {
    if (this.status === "connecting" && e === "ready") this.status = "connected";
    else if (this.status === "connected" && e === "close") this.status = "closed";
  }
}`,
 java: `class Connection {
  String status = "connecting";
  void event(String e) {
    if (status.equals("connecting") && e.equals("ready")) status = "connected";
    else if (status.equals("connected") && e.equals("close")) status = "closed";
  }
}`}}
},
{
 id: 'strategy', name: 'Strategy', category: 'Behavioral',
 intent: 'Choose interchangeable algorithms through composition.',
 alternatives: ['state', 'template-method', 'command'],
 contrasts: ['State represents lifecycle modes and transitions; these algorithms are selected as alternative ways to perform the same task.', 'Template Method fixes an algorithm skeleton using inheritance; Strategy swaps a composed algorithm object.', 'Command represents a particular request with its receiver and arguments; Strategy is a reusable policy for computing a result.'],
 scenarios: [
 {prompt: 'A checkout must calculate shipping by air, road, or pickup. The caller chooses a pricing algorithm at runtime, and adding one should not change checkout. Which pattern fits?', explanation: 'Shipping policies implement a common calculation interface and are injected into checkout.'},
 {prompt: 'A navigation app lets the user choose walking, driving, or cycling route calculation. Each algorithm can be developed independently. Which pattern fits?', explanation: 'The route planner delegates to the currently selected routing strategy.'},
 {prompt: 'A compression service receives a user-selected algorithm object. Algorithms do not transition to one another or represent a lifecycle. Which pattern best describes this design?', explanation: 'Independent interchangeable algorithms selected by a client indicate Strategy rather than State.'}
 ],
 code: [
 {prompt: 'Which pattern lets Checkout use interchangeable pricing policies?', explanation: 'Checkout delegates calculation to the supplied policy, which can vary independently.', code: {
 typescript: `interface Pricing { total(base: number): number }
class Regular implements Pricing { total(n: number) { return n; } }
class Member implements Pricing { total(n: number) { return n * 0.9; } }
class Checkout {
  constructor(private pricing: Pricing) {}
  bill(n: number) { return this.pricing.total(n); }
}`,
 java: `interface Pricing { double total(double base); }
class Regular implements Pricing { public double total(double n) { return n; } }
class Member implements Pricing { public double total(double n) { return n * 0.9; } }
class Checkout {
  private final Pricing pricing;
  Checkout(Pricing p) { pricing = p; }
  double bill(double n) { return pricing.total(n); }
}`}},
 {prompt: 'Which pattern is represented by the replaceable route function?', explanation: 'Planner composes an interchangeable route algorithm. A function can serve as a strategy without a separate concrete class.', code: {
 typescript: `type Route = (from: string, to: string) => string;
class Planner {
  constructor(private route: Route) {}
  use(route: Route) { this.route = route; }
  plan(a: string, b: string) { return this.route(a, b); }
}`,
 java: `import java.util.function.BiFunction;
class Planner {
  private BiFunction<String, String, String> route;
  Planner(BiFunction<String, String, String> r) { route = r; }
  void use(BiFunction<String, String, String> r) { route = r; }
  String plan(String a, String b) { return route.apply(a, b); }
}`}}
 ],
 refactor: {prompt: 'Clients must select interchangeable shipping calculations at runtime. Which pattern should replace this growing algorithm switch through composition?', explanation: 'Extract each shipping calculation behind one interface and pass the selected implementation to the calculator.', code: {
 typescript: `function shipping(mode: string, weight: number) {
  if (mode === "air") return weight * 8;
  if (mode === "road") return weight * 3;
  return 0;
}`,
 java: `class Shipping {
  double cost(String mode, double weight) {
    if (mode.equals("air")) return weight * 8;
    if (mode.equals("road")) return weight * 3;
    return 0;
  }
}`}}
},
{
 id: 'template-method', name: 'Template Method', category: 'Behavioral',
 intent: 'Fix an algorithm skeleton while letting subclasses customize selected steps.',
 alternatives: ['strategy', 'factory-method', 'builder'],
 contrasts: ['Strategy swaps a composed algorithm; Template Method varies inherited steps in a fixed skeleton.', 'Factory Method specifically varies product creation; the variation here is processing steps, not a creation hook.', 'Builder assembles a result from construction steps; Template Method defines the inherited control flow of an algorithm.'],
 scenarios: [
 {prompt: 'All data importers must read, parse, validate, and save in that order. Subclasses customize parsing and validation, while the base class owns the sequence. Which pattern fits?', explanation: 'A template method defines the skeleton and invokes overridable steps.'},
 {prompt: 'A test framework always runs setup, test body, and cleanup. Test subclasses supply the body and optional setup hooks. Which pattern defines this workflow?', explanation: 'The inherited template fixes the execution sequence while hooks allow controlled variation.'},
 {prompt: 'An algorithm must be customized through subclass overrides of selected steps. Clients do not inject an interchangeable algorithm object. Which pattern is the direct fit?', explanation: 'Inheritance-based customization of a fixed skeleton distinguishes Template Method from Strategy.'}
 ],
 code: [
 {prompt: 'Which pattern is implemented by Importer.run()?', explanation: 'run() fixes the order and calls the parse() step supplied by subclasses.', code: {
 typescript: `abstract class Importer {
  run(raw: string) {
    const result = this.parse(raw);
    return result.trim();
  }
  protected abstract parse(raw: string): string;
}
class UpperImporter extends Importer {
  protected parse(raw: string) { return raw.toUpperCase(); }
}`,
 java: `abstract class Importer {
  final String run(String raw) {
    String result = parse(raw);
    return result.trim();
  }
  protected abstract String parse(String raw);
}
class UpperImporter extends Importer {
  protected String parse(String raw) { return raw.toUpperCase(); }
}`}},
 {prompt: 'Which pattern fixes the test lifecycle while allowing subclass hooks?', explanation: 'execute() is the skeleton; setup(), body(), and cleanup() are customizable steps. finally preserves cleanup when body fails.', code: {
 typescript: `abstract class TestCase {
  execute() {
    this.setup();
    try { this.body(); } finally { this.cleanup(); }
  }
  protected setup() {}
  protected abstract body(): void;
  protected cleanup() {}
}`,
 java: `abstract class TestCase {
  final void execute() {
    setup();
    try { body(); } finally { cleanup(); }
  }
  protected void setup() {}
  protected abstract void body();
  protected void cleanup() {}
}`}}
 ],
 refactor: {prompt: 'The outer sequence must stay shared, with only the transform step overridden by subclasses. Which pattern removes this duplication?', explanation: 'Move trim-transform-wrap into a base method and introduce a protected transform hook.', code: {
 typescript: `class UpperJob {
  run(s: string) { return "[" + s.trim().toUpperCase() + "]"; }
}
class LowerJob {
  run(s: string) { return "[" + s.trim().toLowerCase() + "]"; }
}`,
 java: `class UpperJob {
  String run(String s) { return "[" + s.trim().toUpperCase() + "]"; }
}
class LowerJob {
  String run(String s) { return "[" + s.trim().toLowerCase() + "]"; }
}`}}
},
{
 id: 'visitor', name: 'Visitor', category: 'Behavioral',
 intent: 'Add type-specific operations to a stable element hierarchy through external visitors.',
 alternatives: ['iterator', 'strategy', 'composite'],
 contrasts: ['Iterator controls traversal; Visitor performs a distinct operation for each concrete element type.', 'Strategy swaps an algorithm behind one interface; Visitor dispatches an operation based on concrete element types through accept/visit.', 'Composite organizes a tree; Visitor adds external operations over its element types and can be used with Composite.'],
 scenarios: [
 {prompt: 'A stable syntax tree has Number, Add, and Call nodes. You frequently add operations such as formatting, type checking, and metrics without adding a method for each operation to every node. Which pattern fits?', explanation: 'Nodes accept a visitor, and each new operation supplies visit methods for the stable node types.'},
 {prompt: 'An insurance model has a stable set of building types. New reporting and risk operations need type-specific behavior but should live outside the building classes. Which pattern fits?', explanation: 'External visitors group each operation across all building types, using dispatch from the element to the appropriate visit method.'},
 {prompt: 'You must add new operations over a fixed set of element classes. Each element calls a type-specific visit method in accept(). The goal is operation extension, not choosing traversal order. Which pattern fits?', explanation: 'The accept/visit collaboration is Visitor. It makes new operations easy, with the trade-off that new element types require visitor changes.'}
 ],
 code: [
 {prompt: 'Which pattern separates operations from the element classes?', explanation: 'Each element accepts an Ops object and dispatches to its concrete-type operation.', code: {
 typescript: `interface Ops { book(b: Book): string; film(f: Film): string }
class Book { accept(o: Ops) { return o.book(this); } }
class Film { accept(o: Ops) { return o.film(this); } }
class Label implements Ops {
  book(_b: Book) { return "Book label"; }
  film(_f: Film) { return "Film label"; }
}`,
 java: `interface Ops { String book(Book b); String film(Film f); }
class Book { String accept(Ops o) { return o.book(this); } }
class Film { String accept(Ops o) { return o.film(this); } }
class Label implements Ops {
  public String book(Book b) { return "Book label"; }
  public String film(Film f) { return "Film label"; }
}`}},
 {prompt: 'Which pattern allows a new operation without adding area() to each shape?', explanation: 'Shapes expose accept(), and Area contains the type-specific computation for every shape type.', code: {
 typescript: `interface Measure { circle(c: Circle): number; square(s: Square): number }
class Circle { radius = 2; accept(m: Measure) { return m.circle(this); } }
class Square { side = 3; accept(m: Measure) { return m.square(this); } }
class Area implements Measure {
  circle(c: Circle) { return Math.PI * c.radius ** 2; }
  square(s: Square) { return s.side ** 2; }
}`,
 java: `interface Measure { double circle(Circle c); double square(Square s); }
class Circle { double radius = 2; double accept(Measure m) { return m.circle(this); } }
class Square { double side = 3; double accept(Measure m) { return m.square(this); } }
class Area implements Measure {
  public double circle(Circle c) { return Math.PI * c.radius * c.radius; }
  public double square(Square s) { return s.side * s.side; }
}`}}
 ],
 refactor: {prompt: 'Element types are stable but new operations keep adding type switches. You can add accept() once to each element. Which pattern groups each new operation outside those classes?', explanation: 'Introduce a visitor contract with one method per element type, and make elements dispatch to it through accept().', code: {
 typescript: `class Book { pages = 100; }
class Film { minutes = 90; }
function label(item: Book | Film) {
  if (item instanceof Book) return item.pages + " pages";
  return item.minutes + " minutes";
}`,
 java: `class Book { int pages = 100; }
class Film { int minutes = 90; }
class Report {
  String label(Object item) {
    if (item instanceof Book b) return b.pages + " pages";
    return ((Film) item).minutes + " minutes";
  }
}`}}
}
];
