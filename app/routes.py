from flask import render_template, request, redirect
from app import app
import os

#@app.route('/', methods=['GET','POST'])
@app.route('/', methods=['GET'])
def index():
    # if request.method == 'POST':
    #     print(f"Search for {request.form['lakeSearch']}")
    #     search_for = {'form': request.form['lakeSearch']}
    # else:
    #     search_for = {}
    d = {'item':['test', 'test2']} #, **search_for}
    token = os.getenv('MAPBOX_ACCESS_TOKEN')
    return render_template('index.html', d=d, mytoken=token)