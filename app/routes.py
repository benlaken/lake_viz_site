from flask import render_template, request, redirect, jsonify
from app import app
import datetime
import os


@app.route('/', methods=['GET'])
def index():
    d = {'item':['test', 'test2']} #, **search_for}
    token = os.getenv('MAPBOX_ACCESS_TOKEN')
    return render_template('index.html', d=d, mytoken=token)


@app.route('/py_func', methods=['GET'])
def my_py_func():
    """Example of response - boot local server and visit
       http://localhost:5000/py_func?eb_id=1038dh
    """
    eb_id = request.args.get('eb_id')
    return jsonify(
        id=eb_id,
        time=f'{datetime.datetime.now()}'
    )