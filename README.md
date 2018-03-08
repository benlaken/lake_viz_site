![](https://img.shields.io/pypi/pyversions/Django.svg) ![](https://img.shields.io/github/license/mashape/apistatus.svg)

# Lake site

Demo site using several technologies, including [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/#map), [Bootstrap](https://getbootstrap.com/), [Flask](http://flask.pocoo.org/), and dynamic data from [Google's Earth Engine](https://earthengine.google.com/), to explore a sample of sites from the [ECCO project](http://www.mn.uio.no/kjemi/english/research/projects/ecco/).

## Requirements
* Python > 3.4
* [Mapbox Access Token](https://www.mapbox.com/help/how-access-tokens-work/)
* *Optional: [Heroku command line tools](https://devcenter.heroku.com/articles/heroku-cli)*

## Running locally

### Via Flask

After obtaining a [Mapbox access token](](https://www.mapbox.com/help/how-access-tokens-work/)) (which are free with a mapbox account) you should `export MAPBOX_ACCESS_TOKEN='XXXX'` to your local environment.

Next install the Python dependencies specified in the requirements file via: `pip install -t requirements.txt`

You will then need to export a flask environment variable `export FLASK_APP=lake_site.py`

Finally, run the server via `flask run`, if all went well the site
should be accessible at `localhost:5000`

Note, you can also run via `flask run --host=0.0.0.0` to expose the site to devices across your local network. (You should then find the site at `https://<my_IP>:5000`.)

### Via Heroku
Follow the above steps, except instead of running via the flask command, run via `heroku local`. Note this will require you to download the Heroku command line tools.
