from flask import render_template, request, redirect, jsonify
from app import app
# import datetime
import requests
import ee
import os
import pandas as pd
import time
# import tempfile


try:
    ee_user = os.environ['EE_USER']
    print('USER =', ee_user)
except:
    ee_user = None
if ee_user:
    print(f'In deployed environment, using  {ee_user}')
    # looks like I may need to add all of the privatekey info to credentials on Heroku and reconstruct the json object.
    #creds_string = jsonify(
    #     ee_user=ee_user,
    #     ...
    # )
    # private_key = os.environ['EE_PRIVATE_KEY']
    # tf = tempfile.NamedTemporaryFile(mode='w+b',)
    # tf.write(creds_string) # should be written in binary mode...
    credentials = ee.ServiceAccountCredentials(ee_user, 'privatekey.json')
    ee.Initialize(credentials, 'https://earthengine.googleapis.com')
    # print(f'Temp name {tf.name}')
    # tf.close()
else:
    print('In local environment - authorizing via EE stored creds.')
    ee.Initialize()


@app.route('/', methods=['GET'])
def index():
    d = {'item':['test', 'test2']} #, **search_for}
    token = os.getenv('MAPBOX_ACCESS_TOKEN')
    return render_template('index.html', d=d, mytoken=token)


@app.route('/py_func', methods=['GET'])
def my_py_func(cloud_percent=15):
    """Example of response - boot local server and visit
       http://localhost:5000/py_func?eb_id=1038dh

       Note: Info on band combinations https://goo.gl/3xcXQw
    """
    start = pd.datetime.now()
    eb_id = request.args.get('eb_id')
    print('Was passed', eb_id)
    # obtain the geojson/geometry data
    feature_geometry = {
        'type': 'MultiPolygon',
        'coordinates': [[[
            [10.12939453125,60.09566451298078],
            [10.040130615234375,60.02369688198333],
            [10.191192626953125,60.01957970414989],
            [10.1568603515625,60.05661584530574],
            [10.162353515625,60.090871552737134],
            [10.12939453125,60.09566451298078]
        ]]]
    }

    # Landsat 8 surface reflectance
    collection = ee.ImageCollection(
        'LANDSAT/LC08/C01/T1_SR').filterDate('2013-04-11', f'{pd.datetime.now().date()}').filterBounds(feature_geometry).filterMetadata('CLOUD_COVER', 'less_than', cloud_percent).sort('SENSING_TIME')
    # use it to generate a feature object for EE
    def setProperty(image):
        dict = image.select(['B1','B2','B3','B4','B5','B6','B7']).reduceRegion(ee.Reducer.mean(), feature_geometry)
        return image.set(dict)
    # map a reducer to an image collection object with the feature
    withMean = collection.map(setProperty)
    # obtain a time series of avaialbe obs and put it into a pd dataframe object
    d_all= withMean.getInfo()

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

    # pass the df as a json object ready for rendering in a plot object on the front end
    run_time = pd.datetime.now() - start
    return df.to_json(orient='index')


    # return jsonify(
    #     id=eb_id,
    #     time=f'{datetime.datetime.now()}'
    # )