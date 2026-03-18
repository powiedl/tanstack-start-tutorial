# Tanstack Start Tutorial

Wahrscheinlich ist das ein [Repo von jemanden](https://github.com/qkransrb/tanstack-start-tutorial), der diesem Tutorial gefolgt ist (da der "echte" Sourcecode hinter einer Paywall steht)

Testuser: tim@tom.io, abc

## offene Todos

- den Return der /api/ai/summary auswerten und das Ergebnis an den User zurückmelden
- Möglichkeiten für den Ersatz von firecrawl suchen

# Versuch ein "eigenes" LLM für das Webscrapen zu finden

LLM für das Umwandeln von HTML zu Markdown: jina-reader (es gibt verschiedene Modelle - keines ist auf OpenRouter verfügbar).

Ich habe - in einem ersten Versuch - das "Qwen3Coder-Next-UD" Modell mit einem Kontextfenster von 80000 Token (abhängig von der Seite die ich scrapen will - wobei das schon ans Limit von meinem Computer geht) verwendet.

Als Prompt habe ich folgendes verwendet:

```
Konvertiere das folgende HTML in Markdown. Beachte besonders diese Regeln:
- Bleibe dabei so nahe am HTML wie das mit Markdown möglich ist.
- Bilder sollen als Links im Markdown erhalten bleiben.
- Links sollen als Links im Markdown erhalben bleiben.
- Am Anfang füge eine Sektion metadaten ein (diese soll den Titel der Seite, und wenn du es feststellen kannst das Veröffentlichungsdatum und den Autor enthalten).
- Der eigentliche Inhalt soll daran anschließen - die Sektion soll content heißen.

<!DOCTYPE HTML> <html lang="en"> <head>...
```

Nach dem ersten Durchlauf - der wirklich lange (über eine Stunde für [IBM Granite 4.0 Announcement](https://www.ibm.com/new/announcements/ibm-granite-4-0-hyper-efficient-high-performance-hybrid-models) gebraucht hat, würde ich folgende Anpassungen vornehmen:

```
Konvertiere das folgende HTML in Markdown. Beachte besonders diese Regeln:
- Der gesamte Markdown soll in einem Code-Block stehen, so dass man ihn leicht kopieren kann.
- Bleibe dabei so nahe am HTML wie das mit Markdown möglich ist.
- Behalte die Originalsprache bei (englische Seite --> englisches Markdown, deutsche Seite --> deutsches Markdown)
- Bilder sollen als Links im Markdown erhalten bleiben.
- Links sollen als Links im Markdown erhalben bleiben.
- Am Anfang füge eine Sektion metadaten ein (diese soll den Titel der Seite, und wenn du es feststellen kannst das Veröffentlichungsdatum und den Autor enthalten).
- Der eigentliche Inhalt soll daran anschließen - die Sektion soll content heißen.

<!DOCTYPE HTML> <html lang="en"> <head>...
```

Ich habe es dann mit dem Modell `Jinaai Reader Lm 1.5B Gguf Q8_0` versucht. Das war wesentlich schneller, hat aber inhaltlich komplett versagt.

Dann habe ich es mit dem Modell `ReaderLM-v2-i1` probiert. Das ging ebenfalls recht schnell und hat den Markdown sehr genau erstellt - allerdings hat es die Anweisung für die metadata Section komplett ignoriert.

Ich habe diesen Prompt verwendet:

```
Rolle: Du bist ein Experte für Web-Entwicklung und Dokumentations-Strukturierung.
Aufgabe: Konvertiere den folgenden HTML-Code präzise in sauberes GitHub Flavored Markdown (GFM).
Regeln:
- Beginne dein Markdown mit einer Sektion metadata. In dieser gib den Titel und wenn du es feststellen kannst den Autor und das Veröffentlichungsdatum an.
- Danach mach eine Sektion Content. In dieser soll eigentliche Inhalt des HTML in Markdown enthalten sein. Bleibe bei der Konvertierung so nahe am HTML Original wie möglich. Behalte vor allem auch die Sprache der Seite bei (englisch bleibt englisch, deutsch bleibt deutsch, …)- Erhalte die gesamte Hierarchie (H1-H6).
- Wandle Tabellen korrekt in Markdown-Tabellen um.
- Extrahiere Links im Format [Text](URL).
- Ignoriere <script> und <style> Tags sowie unnötige <div>-Container.
- Gib nur das Markdown-Ergebnis aus, ohne Einleitung oder abschließende Erklärungen.

HTML Input:
...
```

Recht schnell, allerdings geht die Struktur komplett verloren und die Metadata Sektion existiert ebenfalls nicht.

# TanStack Start

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

Eine Route muss dabei nicht zwingend eine Komponente enthalten (auch wenn dies nur selten "sinnvoll" ist), man kann beispielsweise das Attribut `beforeLoad` verwenden, um den User sofort wohin umzuleiten (das kann als "Abkürzung" sinnvoll sein). `beforeLoad` wird dabei - wie der Name bereits sagt - vor dem eigentlichen Loader (den wir bis jetzt noch nicht kennengelernt haben - aber das kommt in Kürze) ausgeführt.

```typescript
export const Route = createFileRoute('/dashboard/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/items' })
  },
})
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

##### Pathless Layout Routen

Manchmal will man Teile des Pfades nicht in der URL enthalten haben (weil der Teil nur dafür verwendet wird ein gemeinsames Layout zu erstellen). Dazu beginnt man dem entsprechenen Namen des Directories mit einem **\_**, z. b. `src/routes/_auth/login.tsx` Das führt in der URL zu `/login`. Der Name des restlichen Verzeichnisses wird zur Identifikation der Route verwendet (jede Route muss eindeutig identifiziert werden können).

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

### linkOptions()

Mit linkOptions kann man die Typsicherheit (nur valide `to` Attributwerte) auch "außerhalb" von der Link Komponente sicherstellen, das kann beispielsweise nützlich sein, wenn man Navigationslinks in einem Array verwalten will. Wenn das Array aus Objekten besteht und diese Objekte ein `to` Attribut haben, stellt die Funktion `linkOptions()` sicher, dass die to Attribute nur gültige Linkziele enthalten.

Das Objekt kann noch weitere Attribute mit "spezieller" Bedeutung haben. Interessant ist beispielsweise auch `activeOptions`. Damit kann man steuern, ob ein Link als gerade aktiver interpretiert werden soll oder nicht. Wenn man in dem Objekt das Attribut `exact` auf true stellt, muss der Pfad in der URL komplett mit dem `to` übereinstimmen, wenn man ihn auf false stellt, muss der Pfad in der URL nur mit dem `to` anfangen.

In der Link Komponente muss man das dann auch noch verwenden (die Zeile `activeProps={{'data-active':true}})` ist dafür verantwortlich, dass der aktive Link anders gestylt wird, wie die nicht gerade aktiven):

```typescript
<Link
  to={item.to}
  activeOptions={item.activeOptions}
  activeProps={{ 'data-active': true }}
>
  <item.icon />
  <span>{item.title}</span>
</Link>
```

### Programmatische Navigation

Die `Link` Komponente ist die richtige Wahl, wenn man ein UI Element rendern will, auf das der Benutzer klicken kann, um wohinzunavigieren. Will man hingegen aus dem Code wohin navigieren, ist der `useNavigate` Hook das richtige. Er liefert eine navigate Funktion zurück. Diese kann man mit einem Parameter aufrufen. Dieser Parameter ist ein Objekt, dass das Attribut to hat. Darin übergibt man, wohin man navigieren will. useNavigate hat einen optionalen Parameter, der ebenfalls ein Objekt ist. Darin kann man beispielsweise ein `from` (von wo aus navigiert man) angeben. Das ist hilfreich, wenn man searchParams verarbeiten will (in dem Fall muss man nämlich from auf Route.fullPath setzen, womit die Route typesafe wird): `const navigate=useNavigate({from: Route.fullPath})`

## TanStack Start Data fetching

In TanStack Start kann man sowohl am Client als auch am Server Data fetchen. Wenn man Daten am Client fetcht, führt das zu zusätzlichen Verzögerungen, weil zuerst der Request an den Server geschickt wird, der das HTML aufbaut - mit allen Informationen, die er "vorrätig" hat und dieses HTML dann an den Client zurückschickt. Der Client führt dann die Hydration durch, was bedeutet, dass er den Javascript-Teil hinzufügt bzw. ausführt. Wenn im Javascript Teil weitere Daten von einer API (z. b. Datenbank) geladen werden, führt das zu zusätzlichen Pending States und wenn diese "aufgelöst" werden ändert sich die UI (die neuen Daten werden an den "richtigen" Stellen eingefügt). Daher sollte man - wenn möglich - das Data fetching bereits am Server erledigen.

### Isomorphic by Default

In TanStack Start ist der gesamte Applikationscode standardmäßig isomorph, d. h. er läuft sowohl am Server als auch am Client. Wenn man bestimmte Teile nur am Server oder nur am Client laufen lassen will, muss man dies extra angeben.

### Execution Boundary

TanStack Start Applikationen laufen in zwei Umgebungen:

#### Server Environment

- **Node.js runtime** - Zugriff auf das Filesystem, Datenbanken, Umgebungsvariablen
- **During SSR** - initiales Seitenrendering am Server
- **API requests** - Serverfunktionen werden am Server ausgeführt
- **Build time** - statische Generierung und pre-rendering

#### Client Environment

- **Browser runtime** - Zugriff auf das DOM, localStorage, Userinteraktionen
- **Nach der hydration** - Der Client übernimmt nach dem initialen Server Render
- **Navigation** - Route loader laufen client-seitig während der Navigation
- **Benutzerinteraktionen** - Event handler, form submission, ...

### Execution Control APIs

Es gibt verschiedene APIs mit denen man steuern kann, ob etwas nur am Client oder nur am Server laufen soll.

#### Server-only

Eine Server-only Funktion läuft **immer** am Server, aber sie kann auch vom Client aus aufgerufen werden.

Die `createServerFn()` wird verwendet um RPC Calls oder Data Mutations vorzunehmen. Das entsprechende Client Verhalten ist ein Netzwerkrequest zum Server. Die `createServerOnlyFn(fn)` ist für Hilfsfunktionen am Server gedacht. Wenn diese am Client aufgerufen wird, führt dies zu einem Fehler.

##### Serverfunktion definieren

Um eine Server-only Funktion zu definieren verwendet man `createServerFn()`. Hier ein kurzes Beispiel:

```typscript
import { auth } from '#/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return session
  },
)
```

Im Beispiel sieht man auch. wie man in einer Serversidefunktion ein Redirect zu einer anderen Route auszulöst, nämlich indem man die `redirect` Funktion von `@tanstack/react-router` aufruft.

##### Von wo kann/soll man Server Functions aufrufen?

- **Route loaders** - perfekt um Data Fetching zu machen
- **Components** - Mit Hilfe des useServerFn() Hooks (dieser wandelt den Server Function Call in einen entsprechenden API Call um, wenn es am Client läuft)
- **andere Server Functions** - Um Server Logik in einzelne Teile zu zerlegen
- **Event handlers ** - Um Form Submissions oder Clicks zu verarbeiten

##### Parameter für eine Server Function

Eine Serverfunction kann genau einen Parameter haben. Dieser ist ein Objekt und dieses muss ein Attribut `data` haben. Vor dem Aufruf des `.handler` fügt man den `.inputValidator()` Aufruf ein. Als Parameter von inputValidator kann man entweder ein zodSchema verwenden (was insbesondere praktisch ist, wenn man das gleiche Schema an anderer Stelle ebenfalls schon verwendet hat, z. b in einem Formular, in dem die entsprechenden Daten vom Benutzer eingegeben werden können). Hier ein Beispiel für ein Schema importSchema:

```typescript
export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.scrape(data.url)
    console.log(result)
  })
```

Hat man kein Schema (und will für diese Server Function auch keines erstellen), kann man eine entsprechende Funktion schreiben, die die Data Validierung vornimmt. Hier ein simples Beispiel für Daten, die genau ein Attribut name enthalten (vom Typ string):

```typescript
export const greetUser = createServerFn({method:'GET'})
  .inputValidator({data: {name:string}} => data)
  .handler(async ({data}) => {
    return `Hello, ${data.name}`
  });
```

#### Data Streaming von Server Functions

Insbesondere seit AI vermehrt in Applikationen Einzug hält, ist es "üblich", dass bei längerdauernden Tasks Updates über den Taskfortschritt in der UI dargestellt werden. Wenn der betreffende Task in einer einzigen Server Function abgehandelt wird, kann man in TanStack Start 2 verschiedene Strategien verfolgen um dieses Ziel zu erreichen: `ReadableStream` oder `async Generatoren` (für beides findet man ein Beispiel auf der [offiziellen TanStack Start Dokumentation](https://tanstack.com/start/latest/docs/framework/react/guide/streaming-data-from-server-functions)).

Hier werden `async Generatoren` verwendet, weil es der klarere Ansatz ist.

Dazu muss man die `.handler` Funktion als "normale" Funktion schreiben (es darf keine Arrow-Funktion sein), weil man nach dem Schlüsselwort `function` einen `*` hinzufügen muss, z. b. `.handler(async ({ data, context }) => {` wird zu `.handler(async function* ({ data, context })  {`. Durch den `*` wird die Funktion eben zu einer Generator Funktion. Diese läuft nicht einmal durch und liefert am Ende ihr Ergebnis, sondern sie kann ihren Ablauf "unterbrechen" und später an genau der Stelle wieder fortsetzen.

Wenn man so eine Funktion aufruft, wird sie nicht direkt ausgeführt, sondern liefert ein Generator-Objekt (einen `Iterator`) zurück, mit dem man die Ausführung entsprechend Schritt für Schritt steuern kann. Man kann sich das in der Funktion `bulkScrapeUrlsFn` ansehen.

Hier ein einfacheres Beispiel aus der TanStack Start Dokumentation:

```typescript
const streamingWithAnAsyncGeneratorFn = createServerFn().handler(
  async function* () {
    const messages: Message[] = generateMessages()
    for (const msg of messages) {
      await sleep(500)
      // The streamed chunks are still typed as `Message`
      yield msg
    }
  },
)
```

Und hier ein dazu passender Clientteil (in `src/routes/dashboard/discover.tsx` kann man sich "unseren" Clientteil ansehen):

```typescript
const getResponseFromTheAsyncGenerator = useCallback(async () => {
  for await (const msg of await streamingWithAnAsyncGeneratorFn()) {
    const chunk = msg.content
    setMessages((prev) => prev + chunk)
  }
}, [])
```

#### Client-only

Die `createClientOnlyFn(fn)` ist für Browser utilities gedacht. Wenn sie am Server ausgeführt wird, führt dies zu einem Fehler. Die `<ClientOnly>` Komponente ist für Komponenten, die eine Browser API benötigen, gedacht. Wenn sie am Server ausgeführt wird, wird der entsprechende Render fallback verwendet.

### Route Loader

Für das Data Fetching verwendet man dann `loader` (bzw. im Wording von TanStack Start **route loader**). Diese definiert man im createFileRouter neben der `component` - im Attribut `loader`. Das ist eine Funktion, die die Daten zurückliefert. Die Funktion kann auch async sein (wird sie vermutlich zumeist, weil die Daten wahrscheinlich nicht hartcodiert sein sollen).

#### Route.useLoaderData()

Die Daten, die der Route Loader zurückliefert, kann man dann in der Componente mit dem Hook `Route.useLoaderData()` tatsächlich "holen". Auch die Daten, die der Loader zurückliefert sind automatisch fully typed. `const data=Route.useLoaderData()`.

Ob der Loader am Server oder am Client läuft hängt davon ab, durch welches "Ereignis" er ausgelöst wird. Bei einem Hard Refresh der Seite läuft er am Server (weil ja die gesamte Seite neu geladen wird), bei einer Clientseitigen Navigation läuft er am Client (weil der Server für den Seitenaufbau nicht involvier ist). Es ist sehr wichtig, dass man sich das vor Augen hält bzw. versteht, wo ein Loader in Abhängigkeit des "Ereignisses" tatsächlich läuft.

#### Suspend Data Loading (Streaming) - in TanStack (Router / Start) nennt man das Deferred Data Loading

In TanStack Start bzw. Router prüft der Loader, ob er ein Promise erhält oder nicht. Wenn er ein Promise erhält, wartet er, bis dieses Promise resolved wird. Wenn er kein Promise erhält, gibt er das was er erhält sofort an die Komponente weiter. Damit kann man beim Loader leicht steuern, ob man eine "blocking" Route (der Loader wartet, bis das Promise resolved wird) oder eine "non-blocking" Route (der Loader gibt das Resultat sofort weiter) realisiert.

Aus `loader: () => getItemsFn()` wird `loader: () => ({itemsPromise: getItemsFn()})`.

Dadurch gibt der Loader sofort ein Objekt zurück, dass ein Attribut itemsPromise - der Attributname ist egal - enthält, dass das Promise von getItemsFn() ist. Er gibt dieses Objekt als `LoaderData` an die Komponente (wo es mit `useLoaderData()` ausgelesen werden kann). In der Komponente, muss man dann dafür sorgen, dass man den Teil, der auf itemsPromise beruht, erst rendert, wenn das Promise resolved ist.

##### Anpassung in der Komponente

In der Komponente sind jetzt ebenfalls ein paar Änderungen notwendig (weil die ja jetzt zuerst ein Promise bekommt und erst später - vielleicht - die Daten).

Dazu gibt es den `use` Hook von React, mit dem man ein Promise oder Context verwenden kann. Außerdem muss man zwei Komponenten verwenden. Die Parent Komponente enthält den `Route.useLoaderData()` Aufruf (wo wahrscheinlich ein Promise geliefert wird) und die zweite Komponente wird innerhalb eines `<Suspense></Suspense>` gewrappt. In dieser zweiten wird dann der `use` Hook verwendet.

Hier ein Beispiel mit den relevanten Codeteilen:

```typescript
// Parent Komponente
function RouteComponent() {
  const { itemsPromise } = Route.useLoaderData()
  ...
  return (
    ...
    <Suspense>
      <ItemsList data={itemsPromise} />
    </Suspense>
    ...
  )
}

// Child Komponente
function ItemsList({data}:{items:ReturnType<typeof getItemsF>}) {
  const items=use(data);
  return (
    {items.map((item) => <p>{item.title}</p>
  )
}
```

Wenn man unbedingt alles in einer Komponente machen will, kann man innerhalb des `Suspense` die `Await` Komponente verwenden. Diese hat das Prop `promise` (wo man das Promise, das man von `useLoaderData()` erhalten hat, übergibt). Innerhalb der Await Komponente ist dann das promise bereits resolved, d. h. man spart sich in diesem Fall den `use` Hook.

Die Suspense Komponente hat ein optionales Prop `fallback`. Da kann man ein JSX (oder eine andere Komponente) angeben, das gerendert wird, solange auf die Daten gewartet wird, z. b. ein Skeleton oder als "Minimum" ein `<p>Loading...</p> (damit der User weiß, dass da noch was kommt).

## SearchParams

TanStack Start unterstützt SearchParams. SearchParams kann man als globalen State betrachten, weil sie einen hard refresh überleben und wenn man den gleichen Link wieder öffnet, sollte die Applikation "gleich" aussehen. Die Implementierung von TanStack Start ist dabei der nativen URLSearchParams vorzuziehen, weil erstere typesafe ist.

Außerdem werden TanStack Start SearchParams in JSON konvertiert - damit kann man alles, was sich als JSON serialisieren lässt, in den SearchParams verwenden.

### Validierung

Nachdem die SearchParams etwas sind, worauf der User direkt Einfluss nehmen kann (weil er die Url "manipulieren" kann), ist es wesentlich die SearchParams, bevor man mit ihnen arbeitet entsprechend zu Validieren. TanStack Start unterstützt das "out of the box", beispielsweise mit einem entsprechenden zod Schema.

```typescript
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

// das Schema für die SearchParams als zod Schema definieren
const itemsSearchSchema = z.object({
  q: z.string().default(''),
  status: z.union([z.literal('all'), z.nativeEnum(ItemStatus)]).default('all'),
})

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => getItemsFn(),
  validateSearch: zodValidator(itemsSearchSchema), // hier sagt man, dass man das itemsSearchSchema für die Validierung der searchParams verwenden will
})
```

### Verwendung in der Komponente

Dazu gibt es den `useSearch`-Hook:

```typescript
function RouteComponent() {
  const { q, status } = Route.useSearch()
```

## TanStack Start Middleware

Middleware erlaubt es das Verhalten von Server Routen und Server Functions anzupassen. Sie läuft, bevor die Route oder die Server Function überhaupt startet. Oft wird sie verwendet, um Authentication und daran anschließend Authorization zu überprüfen.

In TanStack Start gibt es zwei verschiedene Arten von Middleware (für spezielle Requests):

- Request Middleware: Diese kann sowohl jeden Server Request, der durch diese Middleware läuft, verändern - als auch für Server Functions verwendet werden.
- Server function middleware: Wird nur für Server functions verwendet (dafür hat diese Middleware mehr Möglichkeiten).

Wie bei Middleware "üblich", kann man auch mehrere hintereinander ausführen, z. b. eine, die die Authentication überprüft, dann eine, die die Authorization überprüft (die sich sicher sein kann, dass ein authentifierter Benutzer vorhanden ist, sonst hätte die vorige Middleware einen Fehler geworfen) und am Ende dann eine die den Request (ev. mit angereicherten Daten der ersten beiden Middlewares logt).

Im folgenden eine Beispielmiddleware für Server functions, die die auth Session in den Context einfügt:

```typescript
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './lib/auth'
import { redirect } from '@tanstack/react-router'

export const authFnMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw redirect({ to: '/login' })
    }
    return next({ context: { session } })
  },
)
```

Mit `createMiddleware` wird eine Middleware erzeugt - der Typ wird auf `function festgelegt`, d. h. diese Middleware ist eine Server Function Middleware. Sie holt die Session von better.Auth und ruft die next-Function (die jede Middleware als Parameter bekommt) auf und übergibt im Context die session.

### Den Kontext aus der Middleware in der Server Function verwenden

In der Server Function kann man dann die Middleware hinzufügen (nach `createServerFn()`) und auf den Context kann man als (weiteren) Parameter zugreifen. Hier das Beispiel von vorhin fortgesetzt:

```typescript
export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {
    const item = await prisma.savedItem.create({
      data: {
        userId: context.session.user.id,
        ...
      },
    })
```

### Middleware oder Server Function?

Prinzipiell sollte man die Server Function für die Business Logik verwenden. Notwendige "Hilfsaufgaben" sollte man über Middleware realisieren. Das führt (auf lange Sicht) zu klarerem, leichter wartbaren Code. Außerdem kann man die Middleware an verschiedenen Stellen verwenden - aber das Hauptargument ist die Trennung der Aufgaben.

### Globale Middleware

Neben den ersten beiden Arten gibt es noch Globale Middleware. Diese läuft vor jedem einzelnen Request. Man legt diese Middleware in der Datei `/src/start.ts` fest. Diese hängt sich in den Request, bevor dieser eigentlich den Server erreicht.

Hier ein einfaches Beispiel für ein simples Logging als globale Middleware:

```typescript
import { createMiddleware, createStart } from '@tanstack/react-start'

const loggingMiddleware = createMiddleware().server(({ request, next }) => {
  const url = new URL(request.url)
  console.log(`${request.method} ${url.pathname}`)
  return next()
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [loggingMiddleware],
  }
})
```

## API Endpoint

Obwohl man eine Server function als API Endpoint betrachten kann, gibt es auch dezidierte API Endpoints. Die Server function wird (von der Idee) innerhalb der Applikation aufgerufen (obwohl technisch nichts verhindert, dass sie beispielsweise durch ein curl aufgerufen wird). Ein API Endpoint ist dafür gedacht, dass er "von überall" aus aufgerufen werden kann und darf.

Ein API Endpoint wird - wie eine normale Route in dem entsprechenden `/src/routes` File im `createFileRoute` definiert. Dazu gibt man dem zurückgelieferten Objekt ein Attribut `server`, in dem man dann die `handlers` festlegt. Wenn man kein Attribut `component` zurückliefert, handelt es sich nur um einen API Endpoint. Man kann aber innerhalb einer `createFileRoute` auch sowohl das Attribut `server` und `component` zurückliefern (in diesem Fall darf der API Endpoint nur keinen handler für GET haben).

Hier ein Beispiel für einen API Endpoint (man hat im Handler Zugriff auf den Request, den Context ... wie bei jeder anderen Route auch). Im Beispiel wird davon ausgegangen, dass der User authentifiziert ist (dies kann beispielsweise durch eine globale middleware sichergestellt werden - da diese vor **jedem** Request laufen, also auch vor einem API Endpoint) und dass in der Session user.name exisitiert (womit der User persönlich begrüsst wird):

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/summary')({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        return new Response(`Hello ${context.session.user.name}!`)
      },
    },
  },
})
```

## Die Head Komponente managen

Das ist u. a. wichtig für Search Engine Optimization. TanStack Start bietet dafür gute Möglichkeiten. Damit das funktioniert muss sowohl die `<Head />` als auch die `<Scripts />` Komponente gerendert werden. Das macht man meist im Root Layout (in `__root.tsx`).

Die eigentlichen "Werte"/"Attribute definiert man im `createRootRoute` im Attribut `head` - wobei das eine Funktion ist, die die Attribute zurückliefert, z. b. `charset`, `title`, ...

```typescript
export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        ...
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
```

Die Informationen, die man in der Root Route angibt, werden auch an alle Childrouten vererbt - können dort aber im `createFileRoute` überschrieben werden. Dabei muss es sich nicht nur um statische Informationen handeln, sondern man kann beispielsweise auch auf die Daten des Loaders zurückgreifen (im Beispiel wird der title aus den LoaderData als Titel für die aktuelle Seite verwendet).

```typescript
export const Route = createFileRoute('/dashboard/items/')({
  ...
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title ?? 'Item Details',
      },
    ],
  }),
```

# ShadcnUI

Auf der Webseite von ShadcnUi gibt es eine Möglichkeit seine eigene ShadcnUI Komponentenbibliothek zu erstellen. Dazu geht man auf [https://ui.shadcn.com/create](https://ui.shadcn.com/create). Dort setzt man dann die Parameter, klickt anschließend rechts oben auf Create Project, wählt dort noch das Framework und den verwendeten Package Manager, kopiert das erstellte Kommando und führt das im Hauptverzeichnis des Projekts aus.

## Komponenten auswählen

Dann geht man auf die [Komponentenübersicht](https://ui.shadcn.com/docs/components), wählt die gewünschten Komponenten, kopiert das Installationskommando und führt es ebenfalls im Hauptverzeichnis des Projekts aus.

# Form Management

Für das Form Management verwenden wir TanStack Form, da es zum gleichen Ecosystem wie TanStack Start gehört.

## Formularvalidierung

Für die Validierung wird zod verwendet. Die Validierungsschemata für die Formulare werden im Verzeichnis schemas erstellt. Im Gegensatz zum Tutorial verwende ich beim Signup auch ein confirmPasswort Feld. Die Validierung dieses ist etwas "schwieriger", weil es auf ein anderes Feld - eben password - referenzieren muss. Dass macht man nach dem Validieren der einzelnen Felder mittels `.refine`:

```typescript
export const signupSchema = z
  .object({
    fullName: z.string().min(3, 'name must be at least 3 characters long'),
    email: z.email(),
    password: z.string().min(3, 'Password must be at least 3 characters long'),
    confirmPassword: z
      .string()
      .min(3, 'Password must be at least 3 characters long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Zeigt den Fehler direkt am zweiten Feld an
  })
```

## Form Komponente

### useForm Hook

Die Formkomponente verwendet den useForm Hook (`import { useForm } from '@tanstack/react-form'`). Hier wieder das Beispiel für das Signup Formular:

```typescript
const form = useForm({
  defaultValues: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  validators: {
    onSubmit: signupSchema,
  },
  onSubmit: async ({ value }) => {
    console.log(value)
  },
})
```

### <form> im JSX

Im JSX muss man dann festlegen, dass beim onSubmit die onSubmit Methode vom useForm Hook ausgeführt werden soll:

```typescript
<form
  onSubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
>
```

### einzelne Formularfelder

Für die einzelnen Formularfelder wird die <form.Field /> Komponente verwendet (statt einer "einfachen "<Field />" Komponente). Hier das Beispiel für den fullName (die anderen Formularfelder sind ähnlich):

```typescript
<form.Field
  name="fullName"
  children={(field) => {
    const isInvalid =
      field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder="Enter your full name"
          autoComplete="off"
        />
        {isInvalid && (
          <FieldError errors={field.state.meta.errors} />
        )}
      </Field>
    )
  }}
/>
```

Bei den Passwortfeldern kann man den type vom Input auf 'password' setzen (dann wird die Eingabe maskiert), bei der Mailadresse auf 'email' wobei das keinen erkennbaren Mehrwert bringt (aber es ist "richtiger").

# Authentication

In diesem Tutorial wird das open source Framework [Better Auth](https://better-auth.com/) verwendet. Auf der Webseite findet man die Installation unter [Docs](https://better-auth.com/docs/installation). Man muss das Paket installieren, dann in `.env.local` das ??`BETTER_AUTH_SECRET` (das man sich auch gleich auf der Webseite generieren lassen kann) und die `BETTER_AUTH_URL` eintragen.

Danach erstellt man ein `/src/lib/auth.ts` File und fügt den Inhalt aus der Dokumentation ein (bzw. sieht es am Ende so aus):

```typescript
import { prisma } from '#/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    tanstackStartCookies(), // make sure this is the last plugin in the array
  ],
})
```

Dann muss man die Datenbanktabellen anlegen (ich verwende prisma.io für das Projekt): `pnpm dlx auth@latest generate`.

Mit `pnpm db:push` und `npm db:generate` erstellt man das notwendige Prisma Schema für Better Auth und speichert es in der Datenbank. Danach findet man die neuen Tabellen in der Primsa PostgreSQL Datenbank.

## TanStack Start Integration

Dann geht man in der Documentation auf Integrations und [TanStack Start](https://better-auth.com/docs/integrations/tanstack) und kopiert das `/src/routes/api/auth/$.ts` von dort.

Damit man signInEmail und signUpEmail Cookies behandeln kann, muss man das in TanStack integrieren. Dafür gibt es in der Doku ebenfalls ein entsprechendes Codesnippet, welches in src/lib/auth.ts eingefügt wird (das ist bereits im obenstehenden auth.ts enthalten).

## Better-Auth Client

Der nächste (und letzte) Schritt ist die Erstellung der Client Instanz - die kopiert man aus der Dokumentation nach `/lib/auth-client.ts`.

# React

## useTransition

Mittels useTransition kann man u. a. einen Pending State auf der Oberfläche darstellen.

`const [isPending,startTransition] = useTransition();`

Danach kapselt man das, was während dem isPending passiert in einen `startTransition()` aufruf. startTransition erwartet als einzigen Parameter eine Funktion (sinnvollerweise eine async Funktion, weil solange diese Funktion läuft ist der Pending State aktiv). Im JSX kann man dann mit Hilfe von isPending feststellen, ob gerade die Transition aktiv ist und die gerenderte UI entsprechend anpassen.

# Eigene Ergänzungen / Änderungen

## SignUp Formular

Im SignUp Formular habe ich ein zusätzliches Feld für die Wiederholung des Passworts eingebaut. Außerdem habe ich das zod Schema entsprechend erweitert, dass prüft, ob beide eingegebenen Passwörter gleich sind. Zur Sicherheit habe ich im onSubmit am Anfang zusätzlich auch auf die Gleichheit der beiden Passwörter geprüft (auch wenn man "ordentlich" über die App gar nicht so weit kommen kann, dass die Kennwörter nicht übereinstimmen - weil dann ja die Validierung des zod Schemas fehlschlägt). All diese Änderungen sind in der `signup-form.tsx` Datei zu finden.

Im Zuge dessen habe ich im better-Auth auch definiert, dass 3 Zeichen als Kennwort ausreichend sind (Standardwert 8). Das ist in der `lib/auth.ts` Datei zu finden.

# AI SDK

Ist ein Opensource Toolkit für Typescript um mit LLMs zu interagieren. Für die eigentliche Interaktion mit den LLMs wird auch noch ein AI Gateway benötigt. AI SDK bietet eines an - allerdings muss man dafür eine Kreditkarte hinterlegen.

## OpenRouter (als LLM Gateway)

Daher wird in diesem Tutorial statt dessen OpenRouter als LLM Gateway verwendet. Dort kann man bei der Anlage eines API Keys ein Limit angeben (auch 0$) - wobei man gar keine Kreditkarte hinterlegen muss.

## Einrichten OpenRouter für AI SDK

Die AI SDK Homepage enthält eine genaue [Anleitung](https://ai-sdk.dev/providers/community-providers/openrouter#openrouter), wie man den OpenRouter in das AI SDK einbindet. Man muss den Provider installieren, dann die Provider Instanz einrichten.

## Summarize Article

### API Endpoint

Hier der gesamte Code für die Summarize Article API Function:

```typescript
import { prisma } from '#/db'
import { openrouter } from '#/lib/openrouter'
import { createFileRoute } from '@tanstack/react-router'
import { streamText } from 'ai'

export const Route = createFileRoute('/api/ai/summary')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const { itemId, prompt } = await request.json()
        if (!itemId || !prompt) {
          return new Response('Missing prompt or itemId', { status: 400 })
        }
        const item = await prisma.savedItem.findUnique({
          where: {
            id: itemId,
            userId: context?.session.user.id,
          },
        })
        if (!item) {
          return new Response('Item not found', { status: 404 })
        }

        // stream summary
        const result = streamText({
          model: openrouter.chat('z-ai/glm-4.5-air:free'),
          system: `You are a helpful assistant that creates concise, informative summaries of web content.
            Your summaries should:
            - Be 2-3 paragraphs long
            - Capture the main points and key takeaways
            - Be written in a clear, professional tone`,
          prompt: `Please summarize the following content:\n\n${prompt}`,
        })

        // Return the stream in the format useCompletion expects
        return result.toTextStreamResponse()
      },
    },
  },
})
```

#### Erklärung des Codes

Zuerst wird geprüft, ob alle notwendigen Parameter - `itemId` und `prompt` (das wird der zusammenzufassende Artikel sein) vorhanden sind. Anschließend wird geprüft, ob es ein entsprechendes Item in der Datenbank gibt (und dieses dem aktuellen Benutzer gehört - dazu wird der context, den die authMiddleware hinzufügt, verwendet). Abschließende wird die Funktion `streamText` vom AI SDK aufgerufen (das angegebene Modell ist ein free Model, d. h. für die Benutzung fallen keine Kosten an).

Am Ende wird das Ergebnis zum Client gestreamt (in einer Form, die der useCompletion Hook erwartet).

### Frontend Komponente (auszugsweise)

Im folgenden die relevanten Teile der Komponente, für das Darstellen der AI Summary. Wie im vorigen Abschnitt erwähnt, wollen wir den `useCompletion` Hook (vom AI SDK) verwenden.

```typescript
import { useCompletion } from '@ai-sdk/react'
...
function RouteComponent() {
  const data = Route.useLoaderData()
  const {completion,complete,isLoading} = useCompletion({
    api: '/api/ai/summary',
    streamProtocol: 'text',
    body: { itemId: data.id },
    onError: (error) => {
      toast.error(error.message)
    },
  })
```

`completion` ist das "Ergebnis" bzw. der Stream mit der Summary. `complete` ist die Funktion, die man aufruft, damit das AI Modell tatsächlich seine Arbeit macht (eben die Zusammenfassung generiert). Und `isLoading` ist der Status, woran man erkennen kann, ob die Erzeugung der summary bereits abgeschlossen ist oder noch andauert.
