# Makefile for deploying and managing calfire_cacher.py
#
# Purpose:
# - Deploy calfire_cacher.py to a system already running Ubuntu and Python 3
# - Ensure script permissions and supporting directories are correct
# - Provide a "create-venv" target so users can set up the required Python virtual environment
#
# This Makefile assumes that it is run as the "ubuntu" user.

# ---------------------------
# Configuration variables
# ---------------------------

# Location of the virtual environment used to isolate Python dependencies
VENV_DIR := /home/ubuntu/.venvs/calfire-cacher

# Python and pip executables inside the virtual environment
PYTHON := $(VENV_DIR)/bin/python
PIP := $(VENV_DIR)/bin/pip

# Where we will install the script and optional .env file
INSTALL_DIR := /home/ubuntu/bin

# Script name and source path
SCRIPT_NAME := calfire_cacher.py
SRC_DIR := $(CURDIR)
SCRIPT_SRC := $(SRC_DIR)/$(SCRIPT_NAME)
SCRIPT_DEST := $(INSTALL_DIR)/$(SCRIPT_NAME)

# Optional environment file that may accompany the script
ENV_DEST := $(INSTALL_DIR)/.env

# Where the script writes BOTH its log output and cached GeoJSON
OUTPUT_DIR := /home/ubuntu/data/calfire

# ---------------------------
# Targets
# ---------------------------

.PHONY: all deploy check advise create-venv check-deps install-script create-output-dir check-python-libs set-permissions

# Default target: deploy and show crontab advice
all: check deploy advise

# Check prerequisites before deploy
check:
	@echo "Checking prerequisites..."
	# Ensure virtual environment exists and has a Python interpreter
	@test -x $(PYTHON) || { echo >&2 "ERROR: Python virtual environment not found at $(VENV_DIR). Please run 'make create-venv' first."; exit 1; }

# Main deploy target that installs the script and prepares environment
deploy: install-script create-output-dir check-python-libs set-permissions

# Install the script file into the designated install directory
install-script:
	@echo "Installing $(SCRIPT_NAME) to $(INSTALL_DIR)..."
	mkdir -p $(INSTALL_DIR)
	cp $(SCRIPT_SRC) $(SCRIPT_DEST)
	@echo "✅ Script installed successfully."

# Ensure the output directory exists (for logs + cached GeoJSON)
create-output-dir:
	@echo "Ensuring output directory $(OUTPUT_DIR) exists..."
	mkdir -p $(OUTPUT_DIR)
	@echo "✅ Output directory ready."

# Check that required Python libraries are present in the virtual environment
check-python-libs:
	@echo "Checking Python library requirements in venv..."
	@$(PYTHON) -c "import psutil" 2>/dev/null || echo "WARNING: psutil not installed in venv"
	@$(PYTHON) -c "import boto3" 2>/dev/null || echo "WARNING: boto3 not installed in venv"
	@$(PYTHON) -c "import dotenv" 2>/dev/null || echo "WARNING: python-dotenv not installed in venv"
	@$(PYTHON) -c "import requests" 2>/dev/null || echo "WARNING: requests not installed in venv"
	@echo "✅ Python library check complete."

# Set secure permissions on script and optional .env file
set-permissions:
	@echo "Setting permissions on script and .env (if present)..."
	chmod 700 $(SCRIPT_DEST)
	if [ -f $(ENV_DEST) ]; then chmod 600 $(ENV_DEST); fi
	@echo "✅ Permissions set."

# Provide a reminder about what cron entry to add
advise:
	@echo ""
	@echo "✅ Deployment complete."
	@echo ""
	@echo "NOTE: Ensure the venv exists at $(VENV_DIR) and required libraries are installed."
	@echo ""
	@echo "NOTE: Copy /home/ubuntu/bin/.env from another system to get the AWS environment variables."
	@echo ""
	@echo "Recommended crontab entry for user 'ubuntu':"
	@echo ""
	@echo "################################################################################"
	@echo "#     CalFire incidents cacher"
	@echo "################################################################################"
	@echo ""
	@echo "*/10 * * * * $(PYTHON) $(SCRIPT_DEST) --bucket airfire-data-exports --prefix calfire --output-dir $(OUTPUT_DIR) >> /var/log/calfire_cacher_cron.log 2>&1"
	@echo ""

# Confirm setup of python3-venv and Python installation
check-deps:
	@echo "Checking system dependencies..."
	# --- Check for python3 executable ---
	@if ! command -v python3 >/dev/null 2>&1; then \
		echo "❌ ERROR: python3 is not installed or not in PATH."; \
		exit 1; \
	else \
		PYVER=$$(python3 -V | awk '{print $$2}' | cut -d. -f1,2); \
		echo "✓ python3 found: Python $$PYVER"; \
	fi

	# --- Check for python3-venv base package ---
	@if ! dpkg -s python3-venv >/dev/null 2>&1; then \
		echo "⚠️  WARNING: python3-venv package not installed."; \
		echo "    Install it with:"; \
		echo "        sudo apt update && sudo apt install -y python3-venv"; \
	fi

	# --- Detect Ubuntu version for extra guidance ---
	@UBUVER=$$(lsb_release -sr 2>/dev/null || echo "unknown"); \
	echo "Detected Ubuntu version: $$UBUVER"; \
	if [ "$$UBUVER" = "24.04" ]; then \
		echo "💡 NOTE: On Ubuntu 24.04 with Python $$PYVER, you may also need:"; \
		echo "         sudo apt install -y python$${PYVER}-venv"; \
	fi

	@echo "✅ System dependency check complete."

# Create and initialize a fresh virtual environment every time
create-venv: check-deps
	@echo "Recreating virtual environment at $(VENV_DIR)..."
	@if [ -d "$(VENV_DIR)" ]; then \
		echo "⚠️  Existing venv found — removing it to ensure compatibility."; \
		rm -rf "$(VENV_DIR)"; \
	fi

	@echo "Creating new virtual environment..."
	python3 -m venv "$(VENV_DIR)"

	@echo "Ensuring pip is available inside venv..."
	@if [ ! -x "$(PIP)" ]; then \
		echo "⚠️  pip not found in venv — attempting to bootstrap..."; \
		if $(PYTHON) -m ensurepip --upgrade >/dev/null 2>&1; then \
			echo "✅ Bootstrapped pip with ensurepip."; \
		else \
			echo "❌ ERROR: pip is missing and ensurepip is not available."; \
			echo "This commonly occurs on Ubuntu 24.04 with Python 3.12."; \
			echo ""; \
			echo "Please run the following command and re-run make:"; \
			echo "    sudo apt update && sudo apt install -y python3.12-venv"; \
			echo ""; \
			exit 1; \
		fi \
	fi

	@echo "Upgrading pip inside venv..."
	$(PYTHON) -m pip install --upgrade pip

	@echo "Installing Python dependencies into venv..."
	$(PIP) install psutil boto3 python-dotenv requests

	@echo "✅ Virtual environment rebuilt and ready at $(VENV_DIR)."
