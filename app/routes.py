from flask import render_template, request, redirect, jsonify
from app import app
import json
import requests
import ee
import os
import numpy as np
import webcolors
import pandas as pd
import time
import tempfile
from pprint import pprint

print(f'Here is the ee source: {ee.__path__}')
ee_user = os.environ['client_email']
json_creds = os.path.exists('privatekey.json')
print('USER =', ee_user)
if json_creds:
    print('In environment with local json creds')
    credentials = ee.ServiceAccountCredentials(ee_user, 'privatekey.json')
    ee.Initialize(credentials, 'https://earthengine.googleapis.com')
elif ee_user and not json_creds:
    print(f'In environment with ee_user but no local json')
    # looks like I need to add all of the privatekey info to credentials on Heroku and reconstruct a dict
    # note - the private_key proved tricky, needed to be very careful to have a clean format to resolve it.
    cred_d = {
        "type": os.environ['type'],
        "project_id": os.environ['project_id'],
        "private_key_id": os.environ['private_key_id'],
        "private_key": os.environ['private_key'],
        "client_email": os.environ['client_email'],
        "client_id": os.environ['client_id'],
        "auth_uri": os.environ['auth_uri'],
        "token_uri": os.environ['token_uri'],
        "auth_provider_x509_cert_url": os.environ['auth_provider_x509_cert_url'],
        "client_x509_cert_url": os.environ['client_x509_cert_url'],
    }
    credentials = ee.ServiceAccountCredentials(ee_user, key_data=cred_d)
    ee.Initialize(credentials, 'https://earthengine.googleapis.com')
else:
    print('No ee_user or local json: attempting to authorize via EE local creds')
    ee.Initialize()


@app.route('/', methods=['GET'])
def index():
    d = {'item':['test', 'test2']}
    token = os.getenv('MAPBOX_ACCESS_TOKEN')
    return render_template('index.html', d=d, mytoken=token)


@app.route('/about', methods=['GET'])
def about():
    return render_template('about.html')


@app.route('/py_func', methods=['GET'])
def my_py_func(cloud_percent=90):
    """Example of response - boot local server and visit
       http://localhost:5000/py_func?eb_id=1038dh

       Note: Info on band combinations https://goo.gl/3xcXQw
    """
    start = pd.datetime.now()
    eb_id = request.args.get('eb_id')
    #print('Was passed', eb_id)
    # obtain the geojson/geometry data
    # Below is a placeholder geometry for dev purposes
    # feature_geometry = {
    #     'type': 'MultiPolygon',
    #     'coordinates': [[[
    #         [10.12939453125,60.09566451298078],
    #         [10.040130615234375,60.02369688198333],
    #         [10.191192626953125,60.01957970414989],
    #         [10.1568603515625,60.05661584530574],
    #         [10.162353515625,60.090871552737134],
    #         [10.12939453125,60.09566451298078]
    #     ]]]
    # }
    query = f"""SELECT cartodb_id, ROUND(area::numeric, 3) as area, eb_id, the_geom
            FROM ecco_test
            where eb_id = '{eb_id}' """
    account = 'benlaken'
    urlCarto = f"https://{account}.carto.com/api/v2/sql"
    sql = {"q": query, "format": "GeoJSON"}
    r = requests.get(urlCarto, params=sql)
    feature_geometry = r.json().get('features')[0].get('geometry')
    if feature_geometry.get('type') == 'MultiPolygon':
        geom = ee.Geometry.MultiPolygon(feature_geometry.get('coordinates'))
    elif feature_geometry.get('type') == 'Polygon':
        geom = ee.Geometry.Polygon(feature_geometry.get('coordinates'))
    else:
        print("bad geometry passed")
    # Landsat 8 surface reflectance
    #print('geometry created',pd.datetime.now() - start)
    collection = ee.ImageCollection(
        'LANDSAT/LC08/C01/T1_SR').filterDate('2013-04-11', f'{pd.datetime.now().date()}').filterBounds(geom).filterMetadata('CLOUD_COVER', 'less_than', cloud_percent).sort('SENSING_TIME')
    # use it to generate a feature object for EE
    aggregate = ee.Reducer.median()
    def setProperty(image):
        dict = image.select(['B1','B2','B3','B4','B5','B6','B7']).reduceRegion(aggregate, geom)
        return image.set(dict)
    # map a reducer to an image collection object with the feature
    withMean = collection.map(setProperty)
    # obtain a time series of avaialbe obs and put it into a pd dataframe object
    d_all= withMean.getInfo()
    #print('data dictionary retrieved',pd.datetime.now() - start)
    tmp_data = []
    tmp_date_index = []
    for n, feature in enumerate(d_all.get('features')):
        p = feature.get('properties')
        tmp_data.append([p.get('B1'), p.get('B2'), p.get('B3'),
                         p.get('B4'), p.get('B5'), p.get('B6'),
                         p.get('B7'), p.get('CLOUD_COVER')])

        tmp_date_index.append(pd.to_datetime(p.get('SENSING_TIME')))

    df = pd.DataFrame(tmp_data, columns=['B1','B2','B3','B4','B5','B6','B7','cloud_cover'], index=tmp_date_index)
    # Calculate a representation of color and add it to the DF
    reds = [convert_array(tmp) for tmp in df['B4']]
    greens = [convert_array(tmp) for tmp in df['B3']]
    blues = [convert_array(tmp) for tmp in df['B1']]
    colors = []
    for row in range(len(reds)):
        colors.append(webcolors.rgb_to_hex((reds[row], greens[row], blues[row])))
    df['colors'] = colors
    #print('heres the dataframe', df)
    # pass the df as a json object ready for rendering in a plot object on the front end
    #print(df.to_json(date_format='iso'))
    run_time = pd.datetime.now() - start
    #print(f'Python EE function finished, returned list with {len(df)} items',pd.datetime.now() - start)
    return df.to_json(date_format='iso') # this will return data with the columns as the index


def convert_array(arr, oldMax=700, oldMin=-300, newMin=1, newMax=255):
    """
    Convert an input value into a new value between 1 to 255.
    This function can be vectorised before it is applied:
    e.g. f = np.vectorize()
    """
    if arr == None:
        return None
    else:
        oldRange = oldMax - oldMin
        newRange = newMax - newMin
        new_arr = (((arr - oldMin) * newRange) / oldRange) + newMin
        tmp = np.int32(np.floor(new_arr))
        if tmp < 0:
            return 0
        elif tmp > 255:
            return 255
        else:
            return tmp