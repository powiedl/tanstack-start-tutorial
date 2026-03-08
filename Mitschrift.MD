# Tanstack Start (0:8:10)

## Tanstack Start "Komponenten"

Tanstack Start besteht zum größten Teil aus TanStack Router. Daneben besteht es noch aus Vite (modernes Buildtool) und Nitro (Open Source Framework um einen Webserver mit Hilfe von h3 zu bauen - hat eine Menge eingebauter Features). Durch Nitro wird der Code automatisch mit jedem Deployment Provider und Runtime kompatibel (dadurch kann man Tanstack Start Applikationen leicht auf unterschiedlichsten Deployment Providern deployen).

## Tanstack Start File und Directory Struktur

### src/router.tsx

In diesem wird das grundlegende Verhalten des Routers definiert - und auch die Eigenschaften wie beispielsweise preloading Funktionalität oder Cache Staleness. Es gibt zwei grundlegende Routing Arten:

- Filebased Routing: Hier werden die einzelnen Routen über Verzeichnisse und Dateien festgelegt. Im Normalfall will man genau diese Routing Art verwenden.
- Codebased Routing: Hier werden die einzelnen Routen direkt im Code definiert - flexibler, aber nicht so übersichtlich wie Filebased Routing.

### src/routes

In diesem Verzeichnis werden alle Routen definiert.

#### src/routes/\_\_root.tsx

Dabei handelt es sich um die Root Route. Sie kapselt alle anderen Routen als Children. Und sie **muss** in dem File `__root.tsx` definiert werden. Die Route hat keinen `path` und die Komponente wird immer gerendert. In der Komponente rendert man seine Dokumentenshell (`<html>` oder `<body>` etc). Da sie immer gerendert wird, ist sie der richtige Platz für globale Logik und die Konstruktion der Applikation. Man könnte sagen, dass ist vergleichbar mit dem Root Layout einer Next.JS Applikation.

#### src/routes/index.tsx

Das wird gerendert, wenn man das Root der Applikation aufruft (z. b. http://localhost:3000/). Im Normalfall definiert man darin die Komponente `App` - und verwendet diese Komponente in der Route für /.

```typescript
export const Route = createFileRoute('/')({ component: App })
```

#### Eigene Routen anlegen

Dazu muss man unter `src/routes` ein entsprechendes File anlegen. Wenn der Dev Server läuft, wird darin automatisch der notwendige Boilerplate Code erzeugt, damit diese Route funktioniert. Wenn man das File beispielsweise `about.tsx` nennt, wird eine entsprechende Route für `/about` angelegt (und auch eine passende Komponente mit einem "Dummyinhalt").

Legt man das File als `src/routes/users/public/list.tsx` an, wird die Route für `/users/public/list` angelegt. Man nennt das **Directory based routing**.

Alternativ kann man **Flat (file based) routing** verwenden. Dabei werden keine Verzeichnisse für die einzelnen Routing-Teile angelegt, sondern die Teile werden im Dateinamen mit `.` getrennt. Das obige Beispiel als flat file based Routing hätte daher diesen Pfad und Namen `src/routes/users.public.list.tsx`.

Man kann auch beide Arten von Routen miteinander in einer Applikation mischen. Beispielsweise "dünne, aber tief verschachtelte Routen" mittels flat file based Routing festlegen und umfangreiche Routen (viele verschiedene Endpunkte in einem Segment) mittels Directory based Routing.

Ein "Spezialfall" ist das File index.tsx in einem Route Verzeichnis (oder route1.route2.index.tsx im flat file based Routing). Dieses File wird gerendert, wenn die Route selbst angezeigt werden soll.

##### Dynamische Teile in eigenen Routen

Dazu verwendet man `$` am Anfang des Routingsegments - `src/routes/posts/$postId/index.tsx` oder `src/routes/posts.$postId.author.edit.tsx`. Die tatsächlichen Werte aus der URL stehen der Komponente dieser Route dann über das param Objekt zur Verfügung.

```typescript
export const Route = createFileRoute('/posts/$postId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { postId } = Route.useParams()
  return <div>Hello /posts/{postId}/!</div>
}
```

##### Layouts für Teile eigener Routen

Dazu legt man an der betreffenden Stelle ein `route.tsx` File an. Wichtig: Dieses route.tsx muss man bearbeiten, damit man den "untergeordneten" Inhalt nicht verliert (dazu gibt es die **Outlet**-Komponente, die bestimmt wo der Inhalt der "Unterrouten" angezeigt werden soll). Diese hat keine Props und ist einfach selbstschließend.

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'

...

function RouteComponent() {
  return (
    <div>
      My Navbar
      <Outlet />
      ...
```

Man kann auch mehrere, verschachtelte route-Files verwenden. Die jeweilige Outlet-Komponente bestimmt, wo im jeweiligen Layout der nächste Childteil gerendert wird.

## Navigation zwischen Routen

Man sollte `<a></a>` möglichst nicht verwenden, wenn man dem User einen Link geben will, mit dem er zwischen den einzelnen Routen der Applikation wechseln kann, weil das ein "hartes" Routing darstellt - in diesem Fall wird die gesamte Seite neu geladen und man verliert "alle Vorteile" von TanStack Router.

### Link Komponente

Das ist die bessere Alternative. Nicht nur, dass sie keinen "harten" Reload auslöst, sondern nur den Teil lädt, der sich tatsächlich ändert (also die Komponente der Route) ist es auch Typsicher. Das Ziel des Links wird im Prop `to` übergeben - nicht `href`. Wichtig: Es muss die Link Komponente von '@tanstack/react-router' importiert werden (beispielsweise nicht jene von lucide-react).

`<Link to='/about'>About Link</Link>`

Wenn das Warnen von inkorrekten Routen in der Entwicklungsumgebung nicht funktioniert, sollte man folgendes kontrollieren:

- Läuft der DEV Server? Nur wenn er läuft, funktionieren diese Warnungen
- Existiert eine `routeTree.gen.ts` (dieses File sollte keinesfalls manuell bearbeitet werden! - es wird immer wieder neu generiert) und sind die richtigen Routen darin definiert?
- Restart TS Server über (Strg+P bzw. Cmd+P in VS Code - Command Palette). Es kann sein, dass sich der Typescript Server "verläuft" (dann hilft oft ein Restart)
- `tsconfig.json`: Das Attribut `strict` muss auf `true` stehen und das Attribut `moduleResolution` muss auf `bundler` stehen.
