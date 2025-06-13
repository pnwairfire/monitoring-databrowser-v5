# Monitoring v5 for ARA training 2025

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

