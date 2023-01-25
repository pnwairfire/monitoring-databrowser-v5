# monitoring-databrowser-v5

This directory contains one (or more) Svelte apps that together make up the
monitoring v5 website. These are each built using Svelte and rollup. For
more information about Svelte, see https://svelte.dev.

Reading at https://svelte.dev/docs#getting-started we see:

> If you don't need a full-fledged app framework and instead want to build a
> simple frontend-only site/app, you can also use Svelte (without Kit) with Vite
> by running `npm init vite` and selecting the svelte option. With this,
> `npm run build` will generate HTML, JS and CSS files inside the dist directory.

We will be building frontend-only applications and so will use Svelte (without Kit).

## Generic setup

These instructions are for setting up a new Svelte project from scratch.

### Initial setup

At the command line:

```
npm init vite
# choose framework: Svelte
# choose variant: JavaScript
cd monitoring-v5-simple
npm install
npm run dev
```

This will create a default Svelte app visible at:

And view the page at http://localhost:5173/

### Copy in code

Ctrl-C to stop serving the Svelte app. Copy in various files from the relevant development directory. These will include at least:

```
./src/App.svelte
./src/components/
./src/stores/
```

### Remove/modify example files/code

Remove unneeded files that came with the example app:

```
rm -rf ./src/assets
rm -rf ./src/lib
```

Modify `./index.html` by removing this line:

```
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

### Install required packages

For monitoring v5 apps, the following packages need to be installed. At the
command line:

```
# npm packages
npm install arquero highcharts moment-timezone suncalc
npm install @square/svelte-store
npm install leaflet
# AirFire packages
npm install github:MazamaScience/air-monitor
npm install github:MazamaScience/air-monitor-algorithms
npm install github:pnwairfire/air-monitor-plots
```

Now `npm run dev` to see the monitoring Svelte app.

### Build the static site

Compile/build the static site with:

```
npm run build
```

Files will be found in the `dist/` directory:

```
dist
├── assets
│   ├── index-ad776a4e.js
│   └── index-f9ecc00f.css
├── index.html
└── vite.svg
```

### Deploy the static site

Before copying `index.html` and the `assets/` subdirectory to a web server, you
will need to modify the references in `index.html` so they are relative rather
than absolute. Just begin the paths with `./` rather than `/`:

```
    <script type="module" crossorigin src="./assets/index-ad776a4e.js"></script>
    <link rel="stylesheet" href="./assets/index-f9ecc00f.css">
```

Now just copy these files to your favorite web server!
