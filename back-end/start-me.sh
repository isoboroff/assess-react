#!/bin/bash
. venv/bin/activate
nohup uwsgi --ini uwsgi.ini > uwsgi.out 2>&1 &

