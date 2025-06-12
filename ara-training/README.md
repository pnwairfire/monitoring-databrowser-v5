# Monitoring v5 for ARA training 2025

## Initial setup

At the command line:

```
npm init vite
# choose framework: Svelte
# choose variant: JavaScript
cd real-time
npm install
npm run dev
```

This will create a default Svelte app visible at:

And view the page at http://localhost:5173/

## Copy in code

Ctrl-C to stop serving the Svelte app. Copy in various files from the relevant development directory. These will include at least:

```
./src/App.svelte
./src/components/
./src/stores/
```

## Remove/modify example files/code

Remove unneeded files that came with the example app:

```
rm -rf ./src/assets
rm -rf ./src/lib
```

Modify `./index.html` by removing this line:

```
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

## Install required packages

For monitoring v5 apps, the following packages need to be installed. At the
command line:

```
# npm packages
npm install arquero highcharts moment-timezone suncalc
npm install @square/svelte-store
npm install leaflet
npm install leaflet-svg-shape-markers
npm install esri-leaflet
npm install papaparse
npm install geojson pbf
# AirFire packages
npm install github:MazamaScience/air-monitor
npm install github:MazamaScience/air-monitor-algorithms
npm install github:pnwairfire/air-monitor-plots
```

## Test functioning

Start the Svelte app with:

```
npm run dev
```

## Build the static site

Compile/build the static site (on OSX) with:

```
npm run build_osx
```

Files will be found in the `dist/` directory:

```
dist
├── assets
│   ├── index-6187947d.js
│   └── index-af8c322a.css
├── images
│   ├── fire-dot.png
│   └── forestservicelogo-inverted.svg
└── index.html
```

## Deploy the static site

Now just copy these files to your favorite web server!

