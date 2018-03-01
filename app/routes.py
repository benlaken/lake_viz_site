from flask import render_template
from app import app
import os

@app.route('/')
@app.route('/index')
def index():
    d = {'item':['test', 'test2']}
    token = os.getenv('MAPBOX_ACCESS_TOKEN')
    return render_template('index.html', d=d, mytoken=token)