import type { Pattern } from '../types.ts';
export const creational: Pattern[] = [
{
 id: 'factory-method', name: 'Factory Method', category: 'Creational',
 intent: 'Let subclasses choose the product used by a shared workflow.',
 alternatives: ['abstract-factory', 'builder', 'strategy'],
 contrasts: ['Abstract Factory supplies a family of related products; the requirement here is a subclass creation hook for one product.', 'Builder assembles a product in steps; no staged assembly is required here.', 'Strategy swaps behavior through composition; this design varies product creation through inheritance.'],
 scenarios: [
 {prompt: 'A logistics framework defines a fixed dispatch workflow. Road and sea subclasses must decide which transport object that workflow creates. Which pattern provides the creation hook?', explanation: 'The base workflow calls an overridable creation method; each subclass returns its own Transport implementation.'},
 {prompt: 'A document application has a reusable open-and-validate operation. SpreadsheetApp and TextApp should supply different document implementations without copying that operation. Which pattern fits?', explanation: 'An inherited operation can work with the Document interface while a factory method in each application subclass selects the concrete document.'},
 {prompt: 'A plugin framework needs exactly one parser product per plugin. The framework owns the parsing workflow, and plugin subclasses override how the parser is created. Which pattern is the most direct fit?', explanation: 'The explicit subclass override is the key. There is no family of related products to justify Abstract Factory.'}
 ],
 code: [
 {prompt: 'Which pattern connects ReportJob to CsvJob?', explanation: 'run() is shared, but makeWriter() is the creation hook overridden by CsvJob.', code: {
 typescript: `interface Writer { write(): string }
abstract class ReportJob {
  run() { return this.makeWriter().write(); }
  protected abstract makeWriter(): Writer;
}
class CsvJob extends ReportJob {
  protected makeWriter(): Writer {
    return { write: () => "CSV report" };
  }
}`,
 java: `interface Writer { String write(); }
abstract class ReportJob {
  String run() { return makeWriter().write(); }
  protected abstract Writer makeWriter();
}
class CsvJob extends ReportJob {
  protected Writer makeWriter() {
    return () -> "CSV report";
  }
}`}},
 {prompt: 'Which pattern lets the delivery workflow stay unchanged?', explanation: 'Delivery owns deliver(); LocalDelivery overrides the method that supplies its Courier product.', code: {
 typescript: `interface Courier { send(): void }
abstract class Delivery {
  deliver() { this.courier().send(); }
  protected abstract courier(): Courier;
}
class LocalDelivery extends Delivery {
  protected courier(): Courier {
    return { send: () => console.log("By bike") };
  }
}`,
 java: `interface Courier { void send(); }
abstract class Delivery {
  void deliver() { courier().send(); }
  protected abstract Courier courier();
}
class LocalDelivery extends Delivery {
  protected Courier courier() {
    return () -> System.out.println("By bike");
  }
}`}}
 ],
 refactor: {prompt: 'Third-party subclasses must choose a parser while keeping importData() inherited. Which pattern should replace the direct construction?', explanation: 'Extract new JsonParser() into an overridable createParser() method returning a parser interface.', code: {
 typescript: `class JsonParser { parse(s: string) { return JSON.parse(s); } }
class ImportJob {
  importData(source: string) {
    const parser = new JsonParser();
    return parser.parse(source);
  }
}`,
 java: `class JsonParser { Object parse(String s) { return s; } }
class ImportJob {
  Object importData(String source) {
    var parser = new JsonParser();
    return parser.parse(source);
  }
}`}}
},
{
 id: 'abstract-factory', name: 'Abstract Factory', category: 'Creational',
 intent: 'Create compatible families of related objects through one interface.',
 alternatives: ['factory-method', 'builder', 'bridge'],
 contrasts: ['Factory Method varies an individual product through a subclass hook; it does not by itself express a compatible product family.', 'Builder controls stepwise assembly of one result, rather than selecting a family of products.', 'Bridge separates two dimensions of an abstraction; the main concern here is creating matching products.'],
 scenarios: [
 {prompt: 'A desktop UI must create buttons, menus, and checkboxes that all belong to the same operating-system theme. How should the client obtain compatible widgets without knowing their concrete classes?', explanation: 'A theme factory exposes creation methods for each widget type, and each concrete factory supplies one compatible family.'},
 {prompt: 'A storage client needs a connection and a query compiler from the same database vendor. Switching vendors must replace both together. Which pattern expresses that constraint?', explanation: 'A database factory supplies both related products, preventing the client from independently selecting incompatible implementations.'},
 {prompt: 'A game chooses either a medieval or futuristic asset set at startup. Each set contains a character, weapon, and vehicle. The important constraint is consistency across these products, not building one object in steps. Which pattern fits?', explanation: 'The selection is a whole product family, making Abstract Factory more appropriate than Builder or an individual factory method.'}
 ],
 code: [
 {prompt: 'Which pattern is represented by the UiKit contract?', explanation: 'UiKit provides two related product types, and NightKit supplies one family.', code: {
 typescript: `interface Button { paint(): string }
interface Menu { items(): string[] }
interface UiKit { button(): Button; menu(): Menu }
class NightKit implements UiKit {
  button() { return { paint: () => "dark button" }; }
  menu() { return { items: () => ["dark item"] }; }
}`,
 java: `interface Button { String paint(); }
interface Menu { String[] items(); }
interface UiKit { Button button(); Menu menu(); }
class NightKit implements UiKit {
  public Button button() { return () -> "dark button"; }
  public Menu menu() { return () -> new String[]{"dark item"}; }
}`}},
 {prompt: 'Which pattern does Platform implement for the application?', explanation: 'Platform groups creation of two compatible services. SandboxPlatform is a concrete family provider.', code: {
 typescript: `interface Platform {
  billing(): { charge(): string };
  mail(): { send(): string };
}
class SandboxPlatform implements Platform {
  billing() { return { charge: () => "test charge" }; }
  mail() { return { send: () => "test mail" }; }
}`,
 java: `interface Billing { String charge(); }
interface Mail { String send(); }
interface Platform { Billing billing(); Mail mail(); }
class SandboxPlatform implements Platform {
  public Billing billing() { return () -> "test charge"; }
  public Mail mail() { return () -> "test mail"; }
}`}}
 ],
 refactor: {prompt: 'The connection and dialect must always come from the same vendor. Which pattern should replace these independent selections?', explanation: 'Use a vendor factory with connection() and dialect() so the chosen factory supplies both related objects.', code: {
 typescript: `function configure(connectionVendor: string, dialectVendor: string) {
  return {
    connection: connectionVendor === "A" ? "A connection" : "B connection",
    dialect: dialectVendor === "A" ? "A dialect" : "B dialect"
  };
}`,
 java: `class Setup {
  String[] configure(String connectionVendor, String dialectVendor) {
    return new String[]{
      connectionVendor.equals("A") ? "A connection" : "B connection",
      dialectVendor.equals("A") ? "A dialect" : "B dialect"
    };
  }
}`}}
},
{
 id: 'builder', name: 'Builder', category: 'Creational',
 intent: 'Assemble a complex result through explicit construction steps.',
 alternatives: ['abstract-factory', 'prototype', 'factory-method'],
 contrasts: ['Abstract Factory selects a product family; this problem concerns staged assembly of a single result.', 'Prototype copies an existing object; this requirement assembles a new result from chosen parts.', 'Factory Method supplies a product through a subclass hook, rather than exposing construction steps.'],
 scenarios: [
 {prompt: 'A report requires a title, optional charts, sections, and a footer. Construction should expose readable steps and validate the completed result. Which pattern fits?', explanation: 'A builder accumulates the report parts through named steps and returns the finished report.'},
 {prompt: 'A house configurator must construct many combinations of rooms, roof, and garage without dozens of constructor overloads. Which pattern makes the construction sequence explicit?', explanation: 'Named construction steps replace a long positional constructor and support different configurations.'},
 {prompt: 'A document export process performs heading, body, and footer steps. The same sequence should create either a text document or an HTML document. Which pattern focuses on these construction steps?', explanation: 'Different builders implement the same assembly steps, and a director can reuse their sequence to produce different representations.'}
 ],
 code: [
 {prompt: 'Which pattern is shown by MealPlan?', explanation: 'The fluent methods accumulate parts, and build() produces the completed value.', code: {
 typescript: `class MealPlan {
  private parts: string[] = [];
  main(value: string) { this.parts.push(value); return this; }
  side(value: string) { this.parts.push(value); return this; }
  build() { return [...this.parts]; }
}
const meal = new MealPlan().main("Rice").side("Beans").build();`,
 java: `import java.util.*;
class MealPlan {
  private final List<String> parts = new ArrayList<>();
  MealPlan main(String v) { parts.add(v); return this; }
  MealPlan side(String v) { parts.add(v); return this; }
  List<String> build() { return List.copyOf(parts); }
}
// new MealPlan().main("Rice").side("Beans").build();`}},
 {prompt: 'Which pattern organizes construction of this immutable request?', explanation: 'RequestDraft holds temporary construction state and produces a separate request value on build().', code: {
 typescript: `class RequestDraft {
  private path = "/";
  private headers: Record<string, string> = {};
  at(path: string) { this.path = path; return this; }
  header(k: string, v: string) { this.headers[k] = v; return this; }
  build() { return Object.freeze({ path: this.path, headers: { ...this.headers } }); }
}`,
 java: `import java.util.*;
record Request(String path, Map<String, String> headers) {}
class RequestDraft {
  private String path = "/";
  private final Map<String, String> headers = new HashMap<>();
  RequestDraft at(String p) { path = p; return this; }
  RequestDraft header(String k, String v) { headers.put(k, v); return this; }
  Request build() { return new Request(path, Map.copyOf(headers)); }
}`}}
 ],
 refactor: {prompt: 'Call sites confuse these optional parameters. The replacement should expose named assembly steps and create the final trip only after configuration. Which pattern fits?', explanation: 'A trip builder can expose destination(), withHotel(), and withInsurance() before build(), making the configuration explicit.', code: {
 typescript: `class Trip {
  constructor(public city: string, public hotel: boolean,
    public car: boolean, public insurance: boolean) {}
}
const trip = new Trip("Hanoi", true, false, true);`,
 java: `record Trip(String city, boolean hotel, boolean car, boolean insurance) {}
class Booking {
  Trip trip = new Trip("Hanoi", true, false, true);
}`}}
},
{
 id: 'prototype', name: 'Prototype', category: 'Creational',
 intent: 'Create objects by copying configured instances.',
 alternatives: ['builder', 'factory-method', 'flyweight'],
 contrasts: ['Builder assembles a new object in steps; this problem starts from an already configured instance.', 'Factory Method chooses a product using a subclass hook; the key operation here is copying an existing product.', 'Flyweight shares immutable state between objects; a prototype creates a distinct object that can be changed independently.'],
 scenarios: [
 {prompt: 'A diagram editor lets users duplicate a configured shape, including its colors and dimensions, without knowing its concrete class. Which pattern fits?', explanation: 'Each shape exposes a copying operation, preserving its configuration behind a common interface.'},
 {prompt: 'A game loads an expensive enemy configuration once. Each spawn needs its own mutable health and position but should begin with the loaded configuration. Which pattern creates the new enemies?', explanation: 'Clone the configured enemy and independently copy mutable fields that must not be shared between spawns.'},
 {prompt: 'A preset catalog returns independent editable copies of a selected preset. Changes to a copy must not change the catalog entry. Is the main mechanism copying, shared state, or staged construction?', explanation: 'Independent copies of preconfigured instances indicate Prototype, whereas Flyweight would intentionally share common immutable data.'}
 ],
 code: [
 {prompt: 'Which pattern is implemented by copy()?', explanation: 'copy() creates a new Note from the current instance and duplicates the mutable tags array.', code: {
 typescript: `class Note {
  constructor(public text: string, public tags: string[]) {}
  copy() { return new Note(this.text, [...this.tags]); }
}
const original = new Note("Draft", ["work"]);
const duplicate = original.copy();`,
 java: `import java.util.*;
class Note {
  String text; List<String> tags;
  Note(String t, List<String> tags) { text = t; this.tags = tags; }
  Note copy() { return new Note(text, new ArrayList<>(tags)); }
}`}},
 {prompt: 'Which pattern allows Palette to produce a configured stamp?', explanation: 'The palette stores a preconfigured instance and asks it for an independent copy.', code: {
 typescript: `class Stamp {
  constructor(public color: string, public size: number) {}
  copy() { return new Stamp(this.color, this.size); }
}
class Palette {
  constructor(private preset: Stamp) {}
  create() { return this.preset.copy(); }
}`,
 java: `class Stamp {
  String color; int size;
  Stamp(String c, int s) { color = c; size = s; }
  Stamp copy() { return new Stamp(color, size); }
}
class Palette {
  private final Stamp preset;
  Palette(Stamp preset) { this.preset = preset; }
  Stamp create() { return preset.copy(); }
}`}}
 ],
 refactor: {prompt: 'Callers should duplicate a configured object without depending on its concrete constructor. Which pattern moves the copying responsibility into the object?', explanation: 'Introduce a common copy() operation implemented by each concrete shape; callers no longer reconstruct the fields themselves.', code: {
 typescript: `class Circle {
  constructor(public radius: number, public color: string) {}
}
function duplicate(c: Circle) {
  return new Circle(c.radius, c.color);
}`,
 java: `record Circle(int radius, String color) {}
class Editor {
  Circle duplicate(Circle c) {
    return new Circle(c.radius(), c.color());
  }
}`}}
},
{
 id: 'singleton', name: 'Singleton', category: 'Creational',
 intent: 'Restrict construction to one instance and provide a shared access point.',
 alternatives: ['flyweight', 'abstract-factory', 'prototype'],
 contrasts: ['Flyweight maintains a pool of shared values, usually one per key; it does not enforce one instance of a service.', 'Abstract Factory creates related products and does not require its own instance to be globally unique.', 'Prototype creates additional copies, which contradicts the one-instance requirement.'],
 scenarios: [
 {prompt: 'Within one application runtime, a registry must prohibit direct construction and expose exactly one shared instance through a class-level accessor. Which pattern matches this explicit requirement?', explanation: 'Private construction plus a shared accessor are the distinguishing mechanics of Singleton. This guarantee does not extend across processes.'},
 {prompt: 'A small tool intentionally needs one process-local configuration object. All callers obtain it through Settings.instance(), and cannot construct another Settings. Which pattern is being requested?', explanation: 'The class controls its own sole instance and access point. Dependency injection may be preferable in larger systems, but this requirement describes Singleton.'},
 {prompt: 'A design requires one globally accessible coordinator object, not a pool of objects keyed by configuration. Which pattern enforces that specific lifetime constraint?', explanation: 'Singleton restricts a class to one instance; Flyweight instead shares multiple intrinsic-state objects as needed.'}
 ],
 code: [
 {prompt: 'Which pattern controls access to Registry?', explanation: 'The constructor is private, and a static accessor always returns the same stored instance.', code: {
 typescript: `class Registry {
  private static readonly shared = new Registry();
  private constructor() {}
  static instance() { return Registry.shared; }
}`,
 java: `final class Registry {
  private static final Registry SHARED = new Registry();
  private Registry() {}
  static Registry instance() { return SHARED; }
}`}},
 {prompt: 'Which pattern is implemented by RuntimeSettings?', explanation: 'Both versions defer instance creation until access and return the same object thereafter. The Java holder uses class initialization for safe publication.', code: {
 typescript: `class RuntimeSettings {
  private static value: RuntimeSettings | undefined;
  private constructor() {}
  static current() {
    return this.value ??= new RuntimeSettings();
  }
}`,
 java: `final class RuntimeSettings {
  private RuntimeSettings() {}
  private static class Holder {
    static final RuntimeSettings VALUE = new RuntimeSettings();
  }
  static RuntimeSettings current() { return Holder.VALUE; }
}`}}
 ],
 refactor: {prompt: 'Assume the explicit requirement is to prohibit multiple instances inside this runtime and provide class-level access. Which pattern changes the construction policy?', explanation: 'Make construction private and expose one stored instance. This is a local lifetime policy, not a distributed lock or a guarantee of thread-safe mutable methods.', code: {
 typescript: `class JobRegistry { jobs: string[] = []; }
const first = new JobRegistry();
const second = new JobRegistry();`,
 java: `import java.util.*;
class JobRegistry { List<String> jobs = new ArrayList<>(); }
class Startup {
  JobRegistry first = new JobRegistry();
  JobRegistry second = new JobRegistry();
}`}}
}
];
