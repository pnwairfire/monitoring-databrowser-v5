#!/usr/bin/env python3
# -----------------------------------------------------------------------------
# calfire_cacher.py
#
# Fetch CalFire incidents GeoJSON, cache full and active-only versions locally,
# and upload them to S3.
#
# - Source (default):
#     https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=true
# - Local cache (default OUTPUT_DIR or /home/ubuntu/data/calfire):
#     {output_dir}/incidents_all.geojson
#     {output_dir}/incidents_active.geojson
# - Dest (S3):
#     s3://{bucket}/{prefix}/incidents_all.geojson
#     s3://{bucket}/{prefix}/incidents_active.geojson
#
# Logging:
#   {output_dir}/{process_name}_TRACE.log
#   (log file is trimmed to the last MAX_LOG_LINES lines on each run)
#
# Environment variables (via .env or shell):
#   CALFIRE_SOURCE_URL   (optional, override source URL)
#   S3_BUCKET            (optional, default: airfire-data-exports)
#   S3_PREFIX            (optional, default: calfire)
#   AWS_REGION           (optional, region for boto3)
#   PROCESS_NAME         (optional, default: calfire_cacher)
#   OUTPUT_DIR           (optional, default: /home/ubuntu/data/calfire)
# -----------------------------------------------------------------------------

import os
import argparse
import logging
from datetime import datetime
from tempfile import NamedTemporaryFile
import json

import psutil
import boto3
import requests
from dotenv import load_dotenv

MAX_LOG_LINES = 10000


def setup_logging(process_name: str, log_dir: str) -> logging.Logger:
    """
    Configure logging to file and stdout.

    Log file pattern: {log_dir}/{process_name}_TRACE.log
    Also trims the log file to the last MAX_LOG_LINES lines if it exists.
    """
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"{process_name}_TRACE.log")

    logger = logging.getLogger(process_name)
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler (TRACE-level details)
    fh = logging.FileHandler(log_path)
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    # Console handler (INFO+ for journald/syslog/docker logs)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # Trim existing log file to last MAX_LOG_LINES lines
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


def get_s3_client():
    """
    Return a boto3 S3 client, letting environment config drive credentials/region.
    """
    session_kwargs = {}
    region = os.getenv("AWS_REGION")
    if region:
        session_kwargs["region_name"] = region

    session = boto3.Session(**session_kwargs)
    return session.client("s3")


def fetch_calfire_geojson(url: str, logger: logging.Logger) -> dict:
    """
    Fetch raw CalFire GeoJSON from the given URL and return it as a dict.
    """
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
    """
    Given a CalFire FeatureCollection, return a new FeatureCollection
    containing only active incidents (properties.IsActive == True).
    """
    if not isinstance(geojson, dict) or geojson.get("type") != "FeatureCollection":
        logger.warning("Input GeoJSON is not a FeatureCollection; returning empty.")
        return {"type": "FeatureCollection", "features": []}

    features = geojson.get("features", [])
    active_features = []

    for feat in features:
        try:
            props = feat.get("properties", {}) or {}
            is_active = props.get("IsActive", False)
            if isinstance(is_active, str):
                is_active = is_active.lower() == "true"
            if is_active:
                active_features.append(feat)
        except Exception as e:
            logger.debug(f"Skipping feature due to error checking IsActive: {e}")

    logger.info(
        f"Subset active incidents: {len(active_features)} of {len(features)} features remain."
    )
    return {"type": "FeatureCollection", "features": active_features}


def write_geojson_atomic(path: str, data: dict, logger: logging.Logger):
    """
    Atomically write pretty-printed GeoJSON to a local file.
    """
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
        logger.exception(f"Failed to write GeoJSON to {path}: {e}")
        # Clean up tmp file if something went wrong
        if tmp_file is not None:
            try:
                os.remove(tmp_file.name)
            except OSError:
                pass
        raise


def upload_json_to_s3(
    s3_client,
    local_path: str,
    bucket: str,
    key: str,
    logger: logging.Logger,
):
    """
    Upload an existing local file (GeoJSON) to S3.
    """
    logger.info(f"Uploading {local_path} to s3://{bucket}/{key}")
    try:
        s3_client.upload_file(local_path, bucket, key)
        logger.info(f"Upload complete: s3://{bucket}/{key}")
    except Exception as e:
        logger.exception(f"Failed to upload {key} to S3: {e}")
        raise


def log_system_stats(logger: logging.Logger):
    """
    Log basic system stats via psutil for trace/debugging.
    """
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    logger.debug(
        f"System stats: CPU {cpu_percent}%, "
        f"Mem used {mem.percent}% ({mem.used / (1024 ** 3):.2f} GiB / "
        f"{mem.total / (1024 ** 3):.2f} GiB)"
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Fetch CalFire GeoJSON, cache locally, and upload full/active subsets to S3."
    )
    parser.add_argument(
        "--source-url",
        default=os.getenv(
            "CALFIRE_SOURCE_URL",
            "https://incidents.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=true",
        ),
        help="CalFire GeoJSON source URL (default: env CALFIRE_SOURCE_URL or official URL).",
    )
    parser.add_argument(
        "--bucket",
        default=os.getenv("S3_BUCKET", "airfire-data-exports"),
        help="Destination S3 bucket (default: airfire-data-exports or env S3_BUCKET).",
    )
    parser.add_argument(
        "--prefix",
        default=os.getenv("S3_PREFIX", "calfire"),
        help="Destination S3 prefix (default: calfire or env S3_PREFIX).",
    )
    parser.add_argument(
        "--process-name",
        default=os.getenv("PROCESS_NAME", "calfire_cacher"),
        help="Process name for logging (default: calfire_cacher or env PROCESS_NAME).",
    )
    parser.add_argument(
        "--output-dir",
        default=os.getenv("OUTPUT_DIR", "/home/ubuntu/data/calfire"),
        help="Local directory for cached GeoJSON and logs (default: /home/ubuntu/data/calfire or env OUTPUT_DIR).",
    )
    return parser.parse_args()


def main():
    load_dotenv()

    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    logger = setup_logging(args.process_name, log_dir=args.output_dir)

    logger.info("Starting CalFire cacher job.")
    log_system_stats(logger)

    logger.debug(f"Configuration: source_url={args.source_url}")
    logger.debug(
        f"Configuration: bucket={args.bucket}, prefix={args.prefix}, "
        f"output_dir={args.output_dir}"
    )

    try:
        s3_client = get_s3_client()
        now = datetime.utcnow().isoformat() + "Z"
        logger.info(f"Current UTC time: {now}")

        # Local cache file paths
        local_all_path = os.path.join(args.output_dir, "incidents_all.geojson")
        local_active_path = os.path.join(args.output_dir, "incidents_active.geojson")

        # 1. Fetch full GeoJSON
        geojson_all = fetch_calfire_geojson(args.source_url, logger)

        # 2. Write and upload full incidents file
        write_geojson_atomic(local_all_path, geojson_all, logger)
        key_all = f"{args.prefix}/incidents_all.geojson"
        upload_json_to_s3(s3_client, local_all_path, args.bucket, key_all, logger)

        # 3. Subset to active incidents
        geojson_active = subset_active_incidents(geojson_all, logger)

        # 4. Write and upload active incidents file
        write_geojson_atomic(local_active_path, geojson_active, logger)
        key_active = f"{args.prefix}/incidents_active.geojson"
        upload_json_to_s3(s3_client, local_active_path, args.bucket, key_active, logger)

        logger.info("CalFire cacher job completed successfully.")
    except Exception as e:
        logger.error(f"CalFire cacher job failed: {e}")
        raise


if __name__ == "__main__":
    main()
