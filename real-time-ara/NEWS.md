# real-time-ara 5.5.2

Major refactor:

- updated air-monitor packages (corrects time axes in plots)
- toggleable layers

# real-time-public 5.4.10

- Updated PurpleAir data url from v2 => v4.

# real-time 5.4.7

_NOTE: Version number keeps up w/ real-time-public_

- Updated HighCharts package fixes x-axis timezone bug.
- Added link to AQI-NowCast service.

# real-time 5.4.4

- Performant hms_fires.

# real-time 5.4.3

- Updated air-monitor.js fixes monitor.combine() bug.

# real-time 5.4.2

- Switch to updated PM2.5 NAAQS.

# real-time 5.4.0

- Added HMS fires and smoke plumes.

# real-time 5.1.6

- Selected sensors are added to URL and page is properly initialized with any
  monitors and sensors in the URL.
- Removed AQI lines from hourly barplots.
- Fixed typo in color levels causing some "red" levels to be shown as purple.

# real-time 5.1.5

- Added ESRI 'Topographic' basemap.
- Updated map refresh time to 10 minutes.

# real-time 5.1.2 - 5.1.4

- Mostly working with PurpleAir data.

# real-time 5.1.1

- LeafletMap filters out "pnwusfs" monitors from AIRSIS.

# real-time 5.1.0

- First use of PurpleAir sensor data for hover-over barplot.

# real-time 5.0.9

- Modified UX with hovered plot immediately below map.

# real-time 5.0.3

- Updated major version to 5.

# real-time 0.0.2

- Added support for Leaflet map initialization with URL parameters:
  `&centerlat=42.2936&centerlon=-118.8281&zoom=4`

# real-time 0.0.01

First working example.
