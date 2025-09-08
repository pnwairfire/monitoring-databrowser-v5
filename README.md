# monitoring-databrowser-v5

This directory contains one (or more) Svelte apps that together make up the
monitoring v5 website. These are each built using Svelte. For
more information about Svelte, see https://svelte.dev.

Reading at https://svelte.dev/docs#getting-started we see:

> If you don't need a full-fledged app framework and instead want to build a
> simple frontend-only site/app, you can also use Svelte (without Kit) with Vite
> by running `npm init vite` and selecting the svelte option. With this,
> `npm run build` will generate HTML, JS and CSS files inside the dist directory.

We will be building frontend-only applications and so will use Svelte (without Kit).

# Setup

These instructions are for people who have just cloned the repository and want
to install npm packages and run the app interactively.

At the command line, download source code and install npm packages with:

```
git clone git@github.com:pnwairfire/monitoring-databrowser-v5.git
...
cd real-time
npm install
```

To run the app interactively, you need to be in the `real-time/`
subdirectory:

```
cd real-time
npm run dev
```

The app should be visible at: http://localhost:5173

# Generic setup

These instructions are for setting up a new Svelte project from scratch.

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

Now `npm run dev` to see the monitoring Svelte app.

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

On the `tools-c#` machines we have:

```
/var/www/html/monitoring/
├── Makefile
├── v5
├── v5-ara
└── v5-dev
```

## Password protect the static site

Google how to password protect a directory.

On the `tools-c#` machines the monitoring site
password is defined in `/etc/apache2/.htpasswd-monitoring`. Then define the
directories where this applies in `/etc/apache2/sites-available/default-ssl.conf`
with chunks like this:

```
<Directory /var/www/html/monitoring/v5-ara>
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Order allow,deny
    allow from all
    AuthType Basic
    AuthName "Authentication Required"
    AuthUserFile "/etc/apache2/.htpasswd-monitoring"
    Require valid-user
</Directory>
```

Test and reboot with:

```
sudo apache2ctl configtest
sudo service apache2 reload
```

