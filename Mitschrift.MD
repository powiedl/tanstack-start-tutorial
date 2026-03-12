# Tanstack Start (6:19:00)

Wahrscheinlich ist das ein [Repo von jemanden](https://github.com/qkransrb/tanstack-start-tutorial), der diesem Tutorial gefolgt ist (da der "echte" Sourcecode hinter einer Paywall steht)

Testuser: tim@tom.io, abc

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

#### Client-only

Die `createClientOnlyFn(fn)` ist für Browser utilities gedacht. Wenn sie am Server ausgeführt wird, führt dies zu einem Fehler. Die `<ClientOnly>` Komponente ist für Komponenten, die eine Browser API benötigen, gedacht. Wenn sie am Server ausgeführt wird, wird der entsprechende Render fallback verwendet.

### Route Loader

Für das Data Fetching verwendet man dann `loader` (bzw. im Wording von TanStack Start **route loader**). Diese definiert man im createFileRouter neben der `component` - im Attribut `loader`. Das ist eine Funktion, die die Daten zurückliefert. Die Funktion kann auch async sein (wird sie vermutlich zumeist, weil die Daten wahrscheinlich nicht hartcodiert sein sollen).

#### Route.useLoaderData()

Die Daten, die der Route Loader zurückliefert, kann man dann in der Componente mit dem Hook `Route.useLoaderData()` tatsächlich "holen". Auch die Daten, die der Loader zurückliefert sind automatisch fully typed. `const data=Route.useLoaderData()`.

Ob der Loader am Server oder am Client läuft hängt davon ab, durch welches "Ereignis" er ausgelöst wird. Bei einem Hard Refresh der Seite läuft er am Server (weil ja die gesamte Seite neu geladen wird), bei einer Clientseitigen Navigation läuft er am Client (weil der Server für den Seitenaufbau nicht involvier ist). Es ist sehr wichtig, dass man sich das vor Augen hält bzw. versteht, wo ein Loader in Abhängigkeit des "Ereignisses" tatsächlich läuft.

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
