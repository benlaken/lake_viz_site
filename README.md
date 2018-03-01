![](https://img.shields.io/pypi/pyversions/Django.svg) ![](https://img.shields.io/github/license/mashape/apistatus.svg)

# Lake site

Demo site using Mapbox GL, Bootstrap, and Flask to expose data from the ECCO project.

## Requirements
* Python > 3.5
* Mapbox Access Token

## Running locally
After obtaining a mapbox access token (which are free with a mapbox account) you should `export MAPBOX_ACCESS_TOKEN='XXXX'` to your local environment.

Next install the Python dependencies specified in the requirements file via: `pip install -t requirements.txt`

You will then need to export a flask environment variable `export FLASK_APP=lake_site.py`

Finally, run the server via `flask run`, if all went well the site
should be accessible at `localhost:5000`

Note, you can also run via `flask run --host=0.0.0.0` to expose the site to devices across your local network. (You should then find the site at `https://<my_IP>:5000`.)