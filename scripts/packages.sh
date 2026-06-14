#!/usr/bin/env bash
# Single source of truth for publishable workspace packages.
# Sourced by release scripts and read by the Makefile.
# To add a new package: append its directory name to PACKAGES.
PACKAGES=(fsw layout editor renderer vue react web-components)
