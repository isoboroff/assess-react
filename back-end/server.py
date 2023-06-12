from flask import Flask, render_template, request, make_response
from elasticsearch import Elasticsearch
from webargs import fields, validate
from webargs.flaskparser import use_args

import json
import sys
import re
import traceback
import time
from pathlib import Path
from datetime import datetime

from pools.StaticPool import StaticPool

app = Flask(__name__, static_folder='../front-end/build/static',
            template_folder='../front-end/build')
app.config.from_pyfile('settings.py')

ELASTIC_PW = 'xWdaVo-josy6fjE*TS9e'
es = Elasticsearch(
    f'http://{app.config["ELASTIC_HOST"]}:{app.config["ELASTIC_PORT"]}',
    http_auth=('elastic', ELASTIC_PW),
    retry_on_timeout=True,
    max_retries=10,
    request_timeout=30)

Path(app.config['SAVE']).mkdir(exist_ok=True)


query_args = {
    'u': fields.String(validate=validate.Regexp(r'^[A-Za-z0-9]+$'),
                       required=True),
    'p': fields.String(validate=validate.Length(equal=64)),
    't': fields.String(validate=validate.Regexp(r'^[A-Za-z0-9.-]+$')),
    'd': fields.String()
}

def json_pool(pool):
    poollist = []
    last = 0
    count = 0
    for docid, jobj in pool.pool.items():
        if docid == pool.last:
            last = count
        poolitem = {'docid': docid,
                    'judgment': jobj['judgment']}
        if 'passage' in jobj:
            poolitem['passage'] = jobj['passage']
        if 'subtopics' in jobj:
            poolitem['subtopics'] = jobj['subtopics']

        poollist.append(poolitem)
        count += 1

    return json.dumps({ "pool": poollist,
                        "topic": pool.topic,
                        "desc": pool.desc,
                        "last": last })


@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/inbox')
@use_args(query_args, location='query')
def inbox(qargs):
    user = qargs['u']
    data = {}
    try:
        homedir = Path(app.config['SAVE']) / user
        for child in homedir.iterdir():
            if re.match(r'^topicIR-T\d+-r\d+.(rus|kor|zho)$', child.name):
                app.logger.debug(child)
                p = StaticPool(filename=str(child))
                data[p.topic] = (len(p), p.num_judged(), p.num_rel())
            else:
                app.logger.debug(f'{child} xxxx')

        app.logger.debug('Got inbox for ' + user)
        return(data, 200)
    except IOError as e:
        app.logger.warn('I/O error reading for ' + user)
        app.logger.warn(e.strerror + ': ' + e.filename)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading for ' + user)
        return('', 503)


@app.route('/pool')
@use_args(query_args, location='query')
def get_pool(qargs):
    topic = qargs['t']
    user = qargs['u']
    try:
        filename = Path(app.config['SAVE']) / user / f'topic{topic}'
        pool = StaticPool(filename=str(filename))
        return(json_pool(pool), 200)
    except FileNotFoundError:
        app.logger.warn(f'Pool not found: {user} {topic} {filename}')
        return('', 404)
    except IOError:
        app.logger.warn(f'Error reading pool {user} {topic} {filename}')
        return('', 503)
    except Exception:
        app.logger.exception(f'Unexpected error reading pool {user} {topic} {filename}')
        return('', 503)


@app.route('/doc')
@use_args(query_args, location='query')
def get_document(qargs):
    docid = qargs['d']
    topic = qargs['t']
    user = qargs['u']

    try:
        response = es.get(index=app.config['INDEX'], id=docid)
        if response['found']:
            if topic and user:
                logfile = Path(app.config['SAVE']) / user / f'topic{topic}.log'
                with open(logfile, 'a') as fp:
                    print(json.dumps({'stamp': time.time(),
                                      'docid': docid,
                                      'action': 'load'}), file=fp)

            return(response['_source'], 200)
        else:
            return('', 404)
    except Exception:
        app.logger.exception('Unexpected error getting docid ' + docid)
        return('', 503)


@app.route('/judge', methods=['POST'])
@use_args(query_args, location='query')
def set_judgment(qargs):
    user = qargs['u']
    topic = qargs['t']
    docid = qargs['d']

    payload = request.get_json()

    log_obj = { 'stamp': time.time(),
                'docid': docid }

    for key in ['judgment', 'passage', 'subtopics']:
        if key in payload:
            log_obj[key] = payload[key]

    logfile = Path(app.config['SAVE']) / user / f'topic{topic}.log'
    with open(logfile, 'a') as fp:
        print(json.dumps(log_obj), file=fp)

    return('', 200)

@app.route('/login')
@use_args(query_args, location='query')
def login(qargs):
    user = qargs['u']
    pw = qargs['p']

    with open(app.config['PWFILE'], 'r') as pwfile:
        for line in pwfile:
            username, hashpw = line.strip().split(':')
            if username == user:
                if pw == hashpw:
                    return('', 200)
                else:
                    return('', 403)
    return('', 403)

if __name__ == '__main__':
    print('Starting Flask...')
    app.debug = True
    app.run(host = '0.0.0.0')
