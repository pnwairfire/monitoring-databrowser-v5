#!/usr/bin/env python3
# -----------------------------------------------------------------------------
# calfire_cacher.py
#
# Fetch CalFire incidents GeoJSON, cache full and active-only versions locally,
# and upload them to S3.
#
# All configuration values are intentionally hardcoded so that this script
# does *not* respond to unrelated environment variables used by other tools.
#
# -----------------------------------------------------------------------------

import os
import logging
import json
from datetime import datetime, timezone
from tempfile import NamedTemporaryFile

import psutil
import boto3
import requests
from dotenv import load_dotenv   # still used only for AWS credentials

# -----------------------------------------------------------------------------
# Hardcoded Configuration
# -----------------------------------------------------------------------------

CALFIRE_SOURCE_URL = (
    "https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=true"
)

S3_BUCKET = "airfire-data-exports"
S3_CALFIRE_PREFIX = "calfire"        # previously "clafire" but corrected
PROCESS_NAME = "calfire_cacher"
OUTPUT_DIR = "/home/ubuntu/data/calfire"

MAX_LOG_LINES = 10000

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

def setup_logging(process_name: str, log_dir: str) -> logging.Logger:
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"{process_name}_TRACE.log")

    logger = logging.getLogger(process_name)
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Log file
    fh = logging.FileHandler(log_path)
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Console (INFO only)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # Trim log file
    if os.path.exists(log_path):
        try:
            with open(log_path, "r") as f:
                lines = f.readlines()
            if len(lines) > MAX_LOG_LINES:
                with open(log_path, "w") as f:
                    f.writelines(lines[-MAX_LOG_LINES:])
                logger.debug(
                    f"Trimmed log file '{log_path}' "
                    f"from {len(lines)} to {MAX_LOG_LINES} lines."
                )
        except Exception as e:
            logger.warning(f"Failed to trim log file '{log_path}': {e}")

    logger.debug(f"Logging initialized. Log file: {log_path}")
    return logger


# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

def get_s3_client():
    """Return a boto3 S3 client, using AWS credentials from .env or OS env."""
    session_kwargs = {}
    region = os.getenv("AWS_REGION")
    if region:
        session_kwargs["region_name"] = region
    session = boto3.Session(**session_kwargs)
    return session.client("s3")


def fetch_calfire_geojson(url: str, logger: logging.Logger) -> dict:
    logger.info(f"Fetching CalFire GeoJSON from {url}")
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        logger.info("Successfully fetched CalFire GeoJSON.")
        return data
    except Exception as e:
        logger.exception(f"Failed to fetch CalFire GeoJSON: {e}")
        raise


def subset_active_incidents(geojson: dict, logger: logging.Logger) -> dict:
    if not isinstance(geojson, dict) or geojson.get("type") != "FeatureCollection":
        logger.warning("Input GeoJSON not a FeatureCollection; returning empty.")
        return {"type": "FeatureCollection", "features": []}

    features = geojson.get("features", [])
    active = []

    for feat in features:
        try:
            props = feat.get("properties", {}) or {}
            is_active = props.get("IsActive", False)
            if isinstance(is_active, str):
                is_active = is_active.lower() == "true"
            if is_active:
                active.append(feat)
        except Exception as e:
            logger.debug(f"Skipping feature due to error: {e}")

    logger.info(
        f"Subset active incidents: {len(active)} of {len(features)} features remain."
    )
    return {"type": "FeatureCollection", "features": active}


def write_geojson_atomic(path: str, data: dict, logger: logging.Logger):
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)

    logger.debug(f"Writing GeoJSON atomically to {path}")
    tmp_file = None
    try:
        tmp_file = NamedTemporaryFile(
            mode="w", suffix=".tmp", dir=directory, delete=False
        )
        json.dump(data, tmp_file, indent=2)
        tmp_file.flush()
        os.fsync(tmp_file.fileno())
        tmp_name = tmp_file.name
        tmp_file.close()
        os.replace(tmp_name, path)
        logger.info(f"Wrote GeoJSON to {path}")
    except Exception as e:
        logger.exception(f"Failed writing {path}: {e}")
        if tmp_file is not None:
            try:
                os.remove(tmp_file.name)
            except OSError:
                pass
        raise


def upload_to_s3(s3_client, local_path: str, bucket: str, key: str, logger: logging.Logger):
    logger.info(f"Uploading {local_path} to s3://{bucket}/{key}")
    try:
        s3_client.upload_file(local_path, bucket, key)
        logger.info(f"Upload complete: s3://{bucket}/{key}")
    except Exception as e:
        logger.exception(f"Failed to upload {key} to S3: {e}")
        raise


def log_system_stats(logger: logging.Logger):
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    logger.debug(
        f"System stats: CPU {cpu_percent}%, "
        f"Mem used {mem.percent}% ({mem.used / (1024**3):.2f} GiB / "
        f"{mem.total / (1024**3):.2f} GiB)"
    )


# -----------------------------------------------------------------------------
# Main Logic
# -----------------------------------------------------------------------------

def main():
    load_dotenv()  # Only used for AWS credentials

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    logger = setup_logging(PROCESS_NAME, OUTPUT_DIR)

    logger.info("Starting CalFire cacher job.")
    log_system_stats(logger)

    try:
        s3 = get_s3_client()
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        logger.info(f"Current UTC time: {now}")

        # Local paths
        all_path = os.path.join(OUTPUT_DIR, "incidents_all.geojson")
        active_path = os.path.join(OUTPUT_DIR, "incidents_active.geojson")

        # 1. Fetch full GeoJSON
        geojson_all = fetch_calfire_geojson(CALFIRE_SOURCE_URL, logger)

        # 2. Write & upload all
        write_geojson_atomic(all_path, geojson_all, logger)
        upload_to_s3(s3, all_path, S3_BUCKET, f"{S3_CALFIRE_PREFIX}/incidents_all.geojson", logger)

        # 3. Subset active
        geojson_active = subset_active_incidents(geojson_all, logger)

        # 4. Write & upload active
        write_geojson_atomic(active_path, geojson_active, logger)
        upload_to_s3(s3, active_path, S3_BUCKET, f"{S3_CALFIRE_PREFIX}/incidents_active.geojson", logger)

        logger.info("CalFire cacher job completed successfully.")

    except Exception as e:
        logger.error(f"CalFire cacher job FAILED: {e}")
        raise


if __name__ == "__main__":
    main()
