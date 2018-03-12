![](https://img.shields.io/pypi/pyversions/Django.svg) ![](https://img.shields.io/github/license/mashape/apistatus.svg) ![](https://img.shields.io/twitter/follow/benlaken.svg?style=social&logo=twitter&label=Follow)

# Lake site

Demo site using several technologies, including [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/#map), [Bootstrap](https://getbootstrap.com/), [Flask](http://flask.pocoo.org/), and dynamic data from [Google's Earth Engine](https://earthengine.google.com/), to explore a sample of study sites from the [ECCO project](http://www.mn.uio.no/kjemi/english/research/projects/ecco/).

## Requirements
* Python 3.6
* [Mapbox Access Token](https://www.mapbox.com/help/how-access-tokens-work/)
* *Optional: [Heroku command line tools](https://devcenter.heroku.com/articles/heroku-cli)*
* Google Service Account, [authorised to use Earth Engine](https://developers.google.com/earth-engine/service_account).

## Running locally

### Via Flask

After obtaining a [Mapbox access token](](https://www.mapbox.com/help/how-access-tokens-work/)) (which are free with a mapbox account) you should `export MAPBOX_ACCESS_TOKEN='XXXX'` to your local environment.

Next install the Python dependencies specified in the requirements file via: `pip install -r requirements.txt`

You will then need to export a flask environment variable `export FLASK_APP=lake_site.py`

Finally, run the server via `flask run`, if all went well the site
should be accessible at `localhost:5000`

Note, you can also run via `flask run --host=0.0.0.0` to expose the site to devices across your local network. (You should then find the site at `https://<my_IP>:5000`.)

### Via Heroku
Follow the above steps, except instead of running via the flask command, run via `heroku local`. Note this will require you to download the Heroku command line tools.


## Deploying

To deploy on Heroku you will need to create several environment variables (read `config vars` in Heroku-speak):

#### mapbox related config vars:
* MAPBOX_ACCESS_TOKEN

#### Google Earth Engine Service Account related config vars:
* auth_provider_x509_cert_url
* auth_uri
* client_email
* client_id
* client_x509_cert_url
* private_key
* private_key_id
* project_id
* token_uri
* type

*Note, the Service account config vars are taken from the JSON version of the [Service Account credentials](https://developers.google.com/earth-engine/service_account).*