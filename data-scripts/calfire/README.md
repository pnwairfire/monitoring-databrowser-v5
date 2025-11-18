# calfire-cacher

_Updated 2025-11-18_

_Currently deployed on `data-monitoring_v3-c2`_

## Overview

`calfire-cacher` is a lightweight Python utility designed to run periodically (via cron)
to fetch CalFire’s public wildfire incident GeoJSON, split the dataset into
"all incidents" and "active incidents", and upload both files into an AWS S3 bucket.

This tool follows the same structure and conventions as the `server-health-stats.py`
script used in airfire-system-status/server-health-stats/. It uses:

- A dedicated Python virtual environment
- A secure `.env` file for AWS credentials and runtime configuration
- A Makefile-driven deployment and environment setup
- Logging to `/app/logs/<process_name>_TRACE.log`
- Standard modules including:
  `psutil`, `boto3`, `python-dotenv`, and `requests`

The script:

1. Downloads the CalFire GeoJSON from
   `https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=true`

2. Uploads the full FeatureCollection to
   `s3://airfire-data-exports/calfire/incidents_all.geojson`

3. Extracts only features where `properties.IsActive == true` and uploads them to
   `s3://airfire-data-exports/calfire/incidents_active.geojson`

4. Logs each run to `/app/logs/calfire_cacher_TRACE.log`

This ensures Monitoring v5 (and other AirFire tools) can safely fetch the data from S3
without running into CORS problems when operating in a browser environment.

## Installation Instructions

### 1. Create a Python virtual environment

The included Makefile provides a `create-venv` target that:

- Checks for system dependencies
- Creates `/home/ubuntu/.venvs/calfire-cacher`
- Installs all required Python modules:
  - psutil
  - boto3
  - python-dotenv
  - requests

Run:

    make create-venv

This will rebuild a clean virtual environment every time.

---

### 2. Deploy the script

The default `make all` target will:

- Check that the venv is ready
- Copy `calfire_cacher.py` into `/home/ubuntu/bin`
- Create `/app/logs` if it does not already exist
- Check required libraries in the venv
- Set secure permissions on the script and `.env`

Run:

    make all

The deployed script will now live at:

    /home/ubuntu/bin/calfire_cacher.py

### 3. Prepare the .env file

The script loads environment variables from:

    /home/ubuntu/bin/.env

At a minimum, the following variables are expected:

    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_DEFAULT_REGION=us-west-2

Optional overrides:

    CALFIRE_SOURCE_URL=...
    S3_BUCKET=airfire-data-exports
    S3_PREFIX=calfire
    PROCESS_NAME=calfire_cacher

For convenience, copy an existing `.env` file with valid AWS credentials from another system:

    cp /home/ubuntu/bin/.env /some/backup/location

Ensure correct permissions:

    chmod 600 /home/ubuntu/bin/.env

### 4. Configure cron

Once deployed, cron can run the script automatically using the venv Python interpreter.

Example cron entry (run every 10 minutes):

    */10 * * * * /home/ubuntu/.venvs/calfire-cacher/bin/python \
        /home/ubuntu/bin/calfire_cacher.py \
        --bucket airfire-data-exports \
        --prefix calfire \
        >> /var/log/calfire_cacher_cron.log 2>&1

This pattern matches the conventions used for:
- `server-health-stats.py`
- Other AirFire monitoring automation scripts
- Systems where cron writes directly to `/var/log/...`

## Example output

A typical log file entry in `/app/logs/calfire_cacher_TRACE.log` might look like:

    2025-01-02 13:10:47 [INFO] calfire_cacher - Starting CalFire cacher job.
    2025-01-02 13:10:47 [DEBUG] calfire_cacher - System stats: CPU 2.5%, Mem used 31.4%
    2025-01-02 13:10:47 [INFO] calfire_cacher - Fetching CalFire GeoJSON from https://incidents.fire.ca.gov/...
    2025-01-02 13:10:48 [INFO] calfire_cacher - Successfully fetched CalFire GeoJSON.
    2025-01-02 13:10:48 [INFO] calfire_cacher - Uploading to s3://airfire-data-exports/calfire/incidents_all.geojson
    2025-01-02 13:10:49 [INFO] calfire_cacher - Upload complete.
    2025-01-02 13:10:49 [INFO] calfire_cacher - Subset active incidents: 3 of 5 features remain.
    2025-01-02 13:10:49 [INFO] calfire_cacher - Uploading to s3://airfire-data-exports/calfire/incidents_active.geojson
    2025-01-02 13:10:50 [INFO] calfire_cacher - Upload complete.
    2025-01-02 13:10:50 [INFO] calfire_cacher - CalFire cacher job completed successfully.

This log format ensures reproducibility, transparency, and easy debugging.

## Testing

You can test the script manually inside the virtual environment:

    /home/ubuntu/.venvs/calfire-cacher/bin/python \
        /home/ubuntu/bin/calfire_cacher.py \
        --bucket airfire-data-exports \
        --prefix calfire

Optional: test with a local `.env` override:

    CALFIRE_SOURCE_URL="https://example.local/mock.json" \
    /home/ubuntu/.venvs/calfire-cacher/bin/python \
        /home/ubuntu/bin/calfire_cacher.py

To verify S3 uploads:

    aws s3 ls s3://airfire-data-exports/calfire/

To validate GeoJSON:

    jq '.features | length' incidents_all.geojson

## Security considerations

- The `.env` file contains AWS credentials.
  It **must** be owned by `ubuntu:ubuntu` with permissions `600`.

- The deployed script is set to permissions `700` to prevent unauthorized execution.

- The script writes logs to `/app/logs`.
  Ensure this directory is writable only by the appropriate user.

- If running on an EC2 instance with an attached IAM role, you may omit
  AWS credentials in `.env` and rely solely on instance profile credentials.

- Avoid storing large historical GeoJSON files unless necessary.
  S3 versioning can be enabled if historical copies are required.

## Summary

`calfire-cacher` provides a reliable, cron-friendly way to transform,
normalize, and publish CalFire wildfire incident data into your S3
ecosystem, where Monitoring v5 and other AirFire tools can access it
without CORS issues.

It follows all conventions established by `server-health-stats.py`,
including:

- Virtual environment isolation
- Makefile-driven installation
- Secure credential handling
- S3-based data publishing
- Rich logging and traceability

Once configured, the tool is fully automated and requires no further
maintenance beyond updating AWS credentials when needed.

