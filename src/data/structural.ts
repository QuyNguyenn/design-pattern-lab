import type { Pattern } from '../types.ts';
export const structural: Pattern[] = [
  {
    id: 'adapter',
    name: 'Adapter',
    category: 'Structural',
    intent: 'Translate an existing interface into the interface a client expects.',
    alternatives: ['decorator', 'proxy', 'facade'],
    contrasts: [
      'Decorator preserves a component contract while adding behavior; this requirement changes the interface or data representation.',
      'Proxy preserves the service interface to control access; the central requirement here is compatibility.',
      'Facade offers a simpler entry point to a subsystem; Adapter specifically satisfies an existing client contract.',
    ],
    scenarios: [
      {
        prompt:
          'Your checkout expects charge(cents), but a legacy payment library exposes payDollars(amount). You cannot edit either API. Which pattern connects them?',
        explanation:
          'A wrapper implements charge(), converts cents to dollars, and calls the legacy API.',
      },
      {
        prompt:
          'An analytics client expects rows with camelCase fields. A vendor SDK returns snake_case fields and must remain unchanged. Which pattern translates its output into the expected contract?',
        explanation:
          'An adapter maps the vendor representation to the client representation at the integration boundary.',
      },
      {
        prompt:
          'A wrapper exposes your existing CelsiusSensor interface over a device that only reports Fahrenheit. It translates both the method name and unit. Which pattern best describes its purpose?',
        explanation:
          'The wrapper solves an interface mismatch. Unlike Decorator, it is not simply adding behavior to an already compatible component.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern does SensorPort implement?',
        explanation: 'SensorPort satisfies degreesC() by translating a legacy Fahrenheit reading.',
        code: {
          typescript: `class OldSensor {
  readF() {
    return 77;
  }
}

interface Sensor {
  degreesC(): number;
}

class SensorPort implements Sensor {
  constructor(private device: OldSensor) {}

  degreesC() {
    return ((this.device.readF() - 32) * 5) / 9;
  }
}`,
          java: `class OldSensor {
    double readF() {
        return 77;
    }
}

interface Sensor {
    double degreesC();
}

class SensorPort implements Sensor {
    private final OldSensor device;

    SensorPort(OldSensor d) {
        device = d;
    }
    public double degreesC() {
        return (device.readF() - 32) * 5 / 9;
    }
}`,
        },
      },
      {
        prompt: 'Which pattern makes the vendor usable through Payments?',
        explanation:
          'CheckoutPort implements the desired contract while translating its argument for VendorPay.',
        code: {
          typescript: `interface Payments {
  charge(cents: number): void;
}

class VendorPay {
  payDollars(n: number) {
    console.log(n);
  }
}

class CheckoutPort implements Payments {
  constructor(private vendor: VendorPay) {}

  charge(cents: number) {
    this.vendor.payDollars(cents / 100);
  }
}`,
          java: `interface Payments {
    void charge(int cents);
}

class VendorPay {
    void payDollars(double n) {
        System.out.println(n);
    }
}

class CheckoutPort implements Payments {
    private final VendorPay vendor;

    CheckoutPort(VendorPay v) {
        vendor = v;
    }
    public void charge(int cents) {
        vendor.payDollars(cents / 100.0);
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Every caller repeats this conversion. You need a wrapper implementing charge(cents), while the vendor API remains unchanged. Which pattern fits?',
      explanation:
        'Move the interface and unit conversion into an adapter so checkout code only knows its own payment contract.',
      code: {
        typescript: `class Vendor {
  payDollars(n: number) {
    console.log(n);
  }
}

function buy(vendor: Vendor, cents: number) {
  vendor.payDollars(cents / 100);
}`,
        java: `class Vendor {
    void payDollars(double n) {
        System.out.println(n);
    }
}

class Checkout {
    void buy(Vendor vendor, int cents) {
        vendor.payDollars(cents / 100.0);
    }
}`,
      },
    },
  },
  {
    id: 'bridge',
    name: 'Bridge',
    category: 'Structural',
    intent: 'Separate an abstraction from its implementation so both can vary independently.',
    alternatives: ['adapter', 'strategy', 'decorator'],
    contrasts: [
      'Adapter retrofits compatibility with an existing interface; Bridge deliberately separates independently growing dimensions.',
      'Strategy selects an algorithm for a task; the central problem here is two independently extensible class hierarchies.',
      'Decorator layers optional responsibilities on one component contract; it does not model two independent dimensions.',
    ],
    scenarios: [
      {
        prompt:
          'A drawing app has Circle and Rectangle, each rendered by SVG or Canvas. More shapes and rendering backends are coming. Which pattern avoids a separate class for every shape/backend combination?',
        explanation:
          'Shapes hold a renderer interface. Shapes and renderers can then grow independently instead of producing a Cartesian product of subclasses.',
      },
      {
        prompt:
          'Basic and advanced remote controls must work with televisions and radios. New remote features and new device types should be developed independently. Which pattern fits?',
        explanation:
          'The remote abstraction delegates device operations to a separate device hierarchy.',
      },
      {
        prompt:
          'A reporting library is being designed with two extensible dimensions: report types and output backends. There is no legacy interface mismatch; the goal is independent evolution of both hierarchies. Which pattern is most precise?',
        explanation:
          'Bridge is an intentional separation of abstraction and implementation, rather than a compatibility wrapper added afterward.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern separates Shape from Renderer?',
        explanation:
          'Circle belongs to the shape hierarchy and delegates rendering to an independently supplied Renderer.',
        code: {
          typescript: `interface Renderer {
  circle(r: number): void;
}

abstract class Shape {
  constructor(protected renderer: Renderer) {}
  abstract draw(): void;
}

class Circle extends Shape {
  draw() {
    this.renderer.circle(10);
  }
}`,
          java: `interface Renderer {
    void circle(int r);
}

abstract class Shape {
    protected final Renderer renderer;

    Shape(Renderer r) {
        renderer = r;
    }
    abstract void draw();
}

class Circle extends Shape {
    Circle(Renderer r) {
        super(r);
    }
    void draw() {
        renderer.circle(10);
    }
}`,
        },
      },
      {
        prompt: 'Which pattern allows new remote types and device types independently?',
        explanation:
          'Remote and QuietRemote use the Device interface without inheriting from a specific device implementation.',
        code: {
          typescript: `interface Device {
  volume(n: number): void;
}

class Remote {
  constructor(protected device: Device) {}

  setVolume(n: number) {
    this.device.volume(n);
  }
}

class QuietRemote extends Remote {
  mute() {
    this.device.volume(0);
  }
}`,
          java: `interface Device {
    void volume(int n);
}

class Remote {
    protected final Device device;

    Remote(Device d) {
        device = d;
    }
    void setVolume(int n) {
        device.volume(n);
    }
}

class QuietRemote extends Remote {
    QuietRemote(Device d) {
        super(d);
    }
    void mute() {
        device.volume(0);
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Both shape types and rendering backends keep growing. Which pattern replaces this combination-based hierarchy with two independent dimensions?',
      explanation:
        'Keep Circle and Square as abstractions and inject a Renderer implementation for SVG or Canvas.',
      code: {
        typescript: `class SvgCircle {}

class CanvasCircle {}

class SvgSquare {}

class CanvasSquare {}
// Adding a backend currently needs one class per shape.`,
        java: `class SvgCircle {}

class CanvasCircle {}

class SvgSquare {}

class CanvasSquare {}
// Adding a backend currently needs one class per shape.`,
      },
    },
  },
  {
    id: 'composite',
    name: 'Composite',
    category: 'Structural',
    intent: 'Treat individual objects and nested groups uniformly through one contract.',
    alternatives: ['decorator', 'iterator', 'flyweight'],
    contrasts: [
      'Decorator wraps one component to add responsibilities; Composite manages a collection of child components as a tree.',
      'Iterator provides traversal access; it does not establish a common operation for leaves and groups.',
      'Flyweight shares repeated intrinsic state to save memory; the requirement here is uniform tree composition.',
    ],
    scenarios: [
      {
        prompt:
          'A shopping cart contains products and nested boxes. Both must support price(), and a box sums its contents recursively. Which pattern fits?',
        explanation:
          'Products are leaves and boxes are composites sharing the same price operation.',
      },
      {
        prompt:
          'A graphics editor allows shapes to be grouped, then groups to be nested. Calling move() on any selected item should work for a shape or an entire group. Which pattern supports this?',
        explanation:
          'A common graphic interface lets groups forward the operation recursively to their children.',
      },
      {
        prompt:
          'A permission tree needs the same evaluate() call on a single rule and on a group containing many rules or groups. The key requirement is uniform treatment, not merely walking the tree. Which pattern fits?',
        explanation:
          'Composite makes the group itself conform to the leaf contract. An Iterator could traverse this structure but would not define its uniform behavior.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern lets Box and Product share price()?',
        explanation:
          'Box is a component containing other components and aggregates their prices recursively.',
        code: {
          typescript: `interface Item {
  price(): number;
}

class Product implements Item {
  price() {
    return 12;
  }
}

class Box implements Item {
  constructor(private children: Item[]) {}

  price(): number {
    return this.children.reduce((n, c) => n + c.price(), 0);
  }
}`,
          java: `import java.util.*;

interface Item {
    int price();
}

class Product implements Item {
    public int price() {
        return 12;
    }
}

class Box implements Item {
    private final List<Item> children;

    Box(List<Item> c) {
        children = c;
    }
    public int price() {
        return children.stream().mapToInt(Item::price).sum();
    }
}`,
        },
      },
      {
        prompt: 'Which pattern is represented by Group?',
        explanation:
          'A Group implements the same Graphic operation as its children and delegates to every child.',
        code: {
          typescript: `interface Graphic {
  move(dx: number): void;
}

class Dot implements Graphic {
  x = 0;

  move(dx: number) {
    this.x += dx;
  }
}

class Group implements Graphic {
  constructor(private children: Graphic[]) {}

  move(dx: number) {
    this.children.forEach((c) => c.move(dx));
  }
}`,
          java: `import java.util.*;

interface Graphic {
    void move(int dx);
}

class Dot implements Graphic {
    int x;
    public void move(int dx) {
        x += dx;
    }
}

class Group implements Graphic {
    private final List<Graphic> children;

    Group(List<Graphic> c) {
        children = c;
    }
    public void move(int dx) {
        children.forEach(c -> c.move(dx));
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Nesting can grow to any depth. Which pattern should let the client call size() on files and folders without these type checks?',
      explanation:
        'Introduce a common Entry contract. File returns its own size; Folder sums child Entry sizes recursively.',
      code: {
        typescript: `type FileEntry = { bytes: number };

type FolderEntry = { files: FileEntry[] };

function size(e: FileEntry | FolderEntry) {
  return 'bytes' in e ? e.bytes : e.files.reduce((s, f) => s + f.bytes, 0);
}`,
        java: `import java.util.*;

record FileEntry(int bytes) {}

record FolderEntry(List<FileEntry> files) {}

class Disk {
    int size(Object e) {
        if (e instanceof FileEntry f) return f.bytes();
        return ((FolderEntry) e).files().stream().mapToInt(FileEntry::bytes).sum();
    }
}`,
      },
    },
  },
  {
    id: 'decorator',
    name: 'Decorator',
    category: 'Structural',
    intent: 'Add optional behavior by nesting wrappers with the same component contract.',
    alternatives: ['adapter', 'proxy', 'composite'],
    contrasts: [
      'Adapter changes an incompatible interface; the wrappers here preserve the existing component contract.',
      'Proxy controls access or lifecycle; the main intent here is composing additional responsibilities.',
      'Composite manages a tree of multiple children; these wrappers each surround one component.',
    ],
    scenarios: [
      {
        prompt:
          'A text stream may need compression, encryption, both, or neither. These responsibilities should be combined at runtime through the same stream interface. Which pattern fits?',
        explanation:
          'Each wrapper adds one responsibility and delegates to another stream, allowing configurable nesting.',
      },
      {
        prompt:
          'A notification service can add a signature and then an audit footer. Features must be stackable without a subclass for every combination. Which pattern supports this?',
        explanation:
          'Decorators preserve the notification contract while enriching the behavior before or after delegation.',
      },
      {
        prompt:
          'A wrapper adds a configurable border around a UI component, and another adds a shadow. Both can be stacked in different combinations. The goal is visual enrichment, not access control. Which pattern fits?',
        explanation:
          'Composable added responsibilities are the intent of Decorator, even though its wrapper structure can resemble Proxy.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern adds a border while preserving View?',
        explanation:
          'Border is itself a View and wraps another View to add markup around its result.',
        code: {
          typescript: `interface View {
  render(): string;
}

class Label implements View {
  render() {
    return 'Hello';
  }
}

class Border implements View {
  constructor(private inner: View) {}

  render() {
    return '[' + this.inner.render() + ']';
  }
}`,
          java: `interface View {
    String render();
}

class Label implements View {
    public String render() {
        return "Hello";
    }
}

class Border implements View {
    private final View inner;

    Border(View v) {
        inner = v;
    }
    public String render() {
        return "[" + inner.render() + "]";
    }
}`,
        },
      },
      {
        prompt: 'Which pattern lets add-ons be stacked around a drink?',
        explanation:
          'OatMilk implements Drink and adds to another Drink, so another add-on can wrap it again.',
        code: {
          typescript: `interface Drink {
  cost(): number;
}

class Coffee implements Drink {
  cost() {
    return 3;
  }
}

class OatMilk implements Drink {
  constructor(private inner: Drink) {}

  cost() {
    return this.inner.cost() + 1;
  }
}

const order = new OatMilk(new Coffee());`,
          java: `interface Drink {
    int cost();
}

class Coffee implements Drink {
    public int cost() {
        return 3;
    }
}

class OatMilk implements Drink {
    private final Drink inner;

    OatMilk(Drink d) {
        inner = d;
    }
    public int cost() {
        return inner.cost() + 1;
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'More independently selectable visual effects are coming. Which pattern replaces subclasses for every combination with stackable wrappers?',
      explanation:
        'Implement each effect as a View wrapper and compose the desired layers around a base view.',
      code: {
        typescript: `class TextView {}

class BorderedTextView extends TextView {}

class ShadowedTextView extends TextView {}

class BorderedShadowedTextView extends TextView {}`,
        java: `class TextView {}

class BorderedTextView extends TextView {}

class ShadowedTextView extends TextView {}

class BorderedShadowedTextView extends TextView {}`,
      },
    },
  },
  {
    id: 'facade',
    name: 'Facade',
    category: 'Structural',
    intent: 'Expose a convenient entry point to a complex subsystem.',
    alternatives: ['adapter', 'mediator', 'proxy'],
    contrasts: [
      'Adapter conforms to a specific existing client interface; the goal here is a new convenient subsystem entry point.',
      'Mediator coordinates interactions among peers that know about it; a facade provides a client-facing entry point over subsystem services.',
      'Proxy substitutes for one service under the same interface; a facade can introduce a simpler API across multiple services.',
    ],
    scenarios: [
      {
        prompt:
          'Starting video playback requires configuring a decoder, audio engine, and screen in order. Most clients just want play(file). Which pattern provides this entry point?',
        explanation:
          'A facade encapsulates the common subsystem sequence behind a small client-facing API.',
      },
      {
        prompt:
          'An application uses a complex shipping SDK for labels, customs forms, and pickup scheduling. You want one shipOrder() operation for the common workflow while keeping the SDK available for advanced use. Which pattern fits?',
        explanation:
          'The facade simplifies the common task without requiring changes to the underlying subsystem.',
      },
      {
        prompt:
          'A home-theater controller exposes watchMovie() over lighting, projector, and audio APIs. Those devices do not communicate through the controller or know it exists. Which pattern best describes the controller?',
        explanation:
          'This is a simplified subsystem entry point. A Mediator would organize communication among collaborating components.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern does Studio provide to its clients?',
        explanation:
          'Studio hides a sequence of calls to several subsystem objects behind start().',
        code: {
          typescript: `class Studio {
  constructor(
    private lights: { dim(): void },
    private sound: { on(): void },
    private screen: { play(): void },
  ) {}

  start() {
    this.lights.dim();
    this.sound.on();
    this.screen.play();
  }
}`,
          java: `interface Lights {
    void dim();
}

interface Sound {
    void on();
}

interface Screen {
    void play();
}

class Studio {
    private final Lights lights;
    private final Sound sound;
    private final Screen screen;

    Studio(Lights l, Sound s, Screen p) {
        lights = l;
        sound = s;
        screen = p;
    }
    void start() {
        lights.dim();
        sound.on();
        screen.play();
    }
}`,
        },
      },
      {
        prompt: 'Which pattern simplifies the release subsystem?',
        explanation: 'Release supplies one convenient operation over build and publish services.',
        code: {
          typescript: `class Release {
  constructor(
    private compiler: { build(): string },
    private store: { publish(artifact: string): void },
  ) {}

  ship() {
    this.store.publish(this.compiler.build());
  }
}`,
          java: `interface Compiler {
    String build();
}

interface Store {
    void publish(String artifact);
}

class Release {
    private final Compiler compiler;
    private final Store store;

    Release(Compiler c, Store s) {
        compiler = c;
        store = s;
    }
    void ship() {
        store.publish(compiler.build());
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Many clients repeat this subsystem sequence. They need a single startMeeting() API and do not need direct access to its steps. Which pattern fits?',
      explanation:
        'A meeting facade can encapsulate the microphone, camera, and connection setup in one operation.',
      code: {
        typescript: `function join(
  mic: { enable(): void },
  camera: { enable(): void },
  connection: { open(): void },
) {
  mic.enable();
  camera.enable();
  connection.open();
}`,
        java: `interface Switch {
    void enable();
}

interface Connection {
    void open();
}

class Client {
    void join(Switch mic, Switch camera, Connection connection) {
        mic.enable();
        camera.enable();
        connection.open();
    }
}`,
      },
    },
  },
  {
    id: 'flyweight',
    name: 'Flyweight',
    category: 'Structural',
    intent: 'Share immutable intrinsic state while keeping per-occurrence state outside it.',
    alternatives: ['singleton', 'prototype', 'proxy'],
    contrasts: [
      'Singleton enforces one instance of a class; Flyweight may share many instances, one for each intrinsic-state key.',
      'Prototype creates independent copies; this requirement saves memory by sharing common state.',
      'Proxy controls access to a service; this design separates shared data from per-occurrence data.',
    ],
    scenarios: [
      {
        prompt:
          'A forest contains a million trees. Species, texture, and mesh repeat, while coordinates differ. Which pattern shares the repeated data and keeps coordinates in each tree occurrence?',
        explanation:
          'Shared tree types hold intrinsic state; lightweight occurrences hold extrinsic coordinates.',
      },
      {
        prompt:
          'A text editor stores many glyph occurrences. Font and glyph outlines repeat, but positions differ. Which pattern reduces repeated outline storage?',
        explanation:
          'Cache glyphs by intrinsic properties and pass each occurrence position separately.',
      },
      {
        prompt:
          'A particle system caches immutable styles by color and texture. Each particle keeps its own velocity and position. There are many shared styles, not one global style. Which pattern fits?',
        explanation:
          'Multiple pooled intrinsic-state values with separate occurrence state indicate Flyweight rather than Singleton.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern is shown by the style pool and Tree?',
        explanation:
          'style() reuses immutable intrinsic state, while each Tree stores its own coordinates.',
        code: {
          typescript: `type Style = Readonly<{ species: string }>;

const styles = new Map<string, Style>();

function style(species: string): Style {
  if (!styles.has(species)) styles.set(species, Object.freeze({ species }));
  return styles.get(species)!;
}

class Tree {
  constructor(
    public x: number,
    public y: number,
    public style: Style,
  ) {}
}`,
          java: `import java.util.*;

record Style(String species) {}

class Styles {
    private final Map<String, Style> pool = new HashMap<>();
    Style get(String species) {
        return pool.computeIfAbsent(species, Style::new);
    }
}

record Tree(int x, int y, Style style) {}`,
        },
      },
      {
        prompt: 'Which pattern separates glyph identity from screen position?',
        explanation:
          'Repeated glyph values are pooled; GlyphPosition carries extrinsic coordinates.',
        code: {
          typescript: `const glyphs = new Map<string, Readonly<{ symbol: string }>>();

function glyph(symbol: string) {
  if (!glyphs.has(symbol)) glyphs.set(symbol, Object.freeze({ symbol }));
  return glyphs.get(symbol)!;
}

const line = [0, 10, 20].map((x) => ({ x, glyph: glyph('a') }));`,
          java: `import java.util.*;

record Glyph(String symbol) {}

record GlyphPosition(int x, Glyph glyph) {}

class FontCache {
    private final Map<String, Glyph> pool = new HashMap<>();
    Glyph get(String s) {
        return pool.computeIfAbsent(s, Glyph::new);
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Millions of instances repeat the same immutable texture data. Positions differ. Which pattern should pool the texture by species while retaining per-tree coordinates?',
      explanation:
        'Extract intrinsic texture data into shared tree-type objects and leave x/y on each occurrence.',
      code: {
        typescript: `class Tree {
  texture: Uint8Array;

  constructor(
    public x: number,
    public y: number,
  ) {
    this.texture = new Uint8Array(100_000);
  }
}`,
        java: `class Tree {
    final byte[] texture = new byte[100_000];
    final int x, y;

    Tree(int x, int y) {
        this.x = x;
        this.y = y;
    }
}`,
      },
    },
  },
  {
    id: 'proxy',
    name: 'Proxy',
    category: 'Structural',
    intent: 'Provide a substitute with the same service contract to control access.',
    alternatives: ['decorator', 'adapter', 'facade'],
    contrasts: [
      'Decorator primarily composes extra responsibilities; the stated purpose here is controlled access or lazy service creation.',
      'Adapter translates an interface; a proxy preserves the service contract.',
      'Facade introduces a convenient API over a subsystem; a proxy stands in for a particular service.',
    ],
    scenarios: [
      {
        prompt:
          'An image viewer should expose the normal Image interface but load a large image only on its first draw(). Which pattern supplies the stand-in?',
        explanation:
          'A virtual proxy defers creation of the expensive real image until it is needed.',
      },
      {
        prompt:
          'A document service must check permissions before forwarding read() to the real service, while clients continue using the same interface. Which pattern fits?',
        explanation: 'A protection proxy controls whether a request reaches the real service.',
      },
      {
        prompt:
          'A local object implements the same interface as a remote catalog and forwards calls over the network. Its purpose is to stand in for the remote service, not translate the client contract. Which pattern fits?',
        explanation:
          'The local stand-in is a remote proxy. Its location/access role distinguishes it from an interface adapter.',
      },
    ],
    code: [
      {
        prompt: 'Which pattern does LazyImage implement?',
        explanation: 'It preserves ImageView and defers creating the real image until draw().',
        code: {
          typescript: `interface ImageView {
  draw(): string;
}

class DiskImage implements ImageView {
  draw() {
    return 'pixels';
  }
}

class LazyImage implements ImageView {
  private real?: DiskImage;

  draw() {
    return (this.real ??= new DiskImage()).draw();
  }
}`,
          java: `interface ImageView {
    String draw();
}

class DiskImage implements ImageView {
    public String draw() {
        return "pixels";
    }
}

class LazyImage implements ImageView {
    private DiskImage real;
    public String draw() {
        if (real == null) real = new DiskImage();
        return real.draw();
    }
}`,
        },
      },
      {
        prompt: 'Which pattern controls access to Vault?',
        explanation:
          'GuardedVault implements the same contract and decides whether to forward a read request.',
        code: {
          typescript: `interface Vault {
  read(): string;
}

class GuardedVault implements Vault {
  constructor(
    private real: Vault,
    private allowed: () => boolean,
  ) {}

  read() {
    if (!this.allowed()) throw new Error('Denied');
    return this.real.read();
  }
}`,
          java: `import java.util.function.BooleanSupplier;

interface Vault {
    String read();
}

class GuardedVault implements Vault {
    private final Vault real;
    private final BooleanSupplier allowed;

    GuardedVault(Vault r, BooleanSupplier a) {
        real = r;
        allowed = a;
    }
    public String read() {
        if (!allowed.getAsBoolean()) throw new SecurityException("Denied");
        return real.read();
    }
}`,
        },
      },
    ],
    refactor: {
      prompt:
        'Authorization is repeated at every call site. Which pattern should enforce access through a replacement exposing the same Store.read() contract?',
      explanation:
        'Place the permission check in a protection proxy that implements Store and forwards approved requests.',
      code: {
        typescript: `interface Store {
  read(): string;
}

function view(store: Store, allowed: boolean) {
  if (!allowed) throw new Error('Denied');
  return store.read();
}`,
        java: `interface Store {
    String read();
}

class Page {
    String view(Store store, boolean allowed) {
        if (!allowed) throw new SecurityException("Denied");
        return store.read();
    }
}`,
      },
    },
  },
];
