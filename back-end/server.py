from flask import Flask, render_template, request, make_response, jsonify
from elasticsearch import Elasticsearch, NotFoundError
from webargs import fields, validate
from webargs.flaskparser import use_args

import json
import sys
import re
import traceback
import time
import os
from pathlib import Path
from datetime import datetime

app = Flask(__name__, static_folder='../front-end/build/static',
            template_folder='../front-end/build')
app.config.from_pyfile('settings.py')
app.logger.setLevel(app.config['LOGLEVEL'])

ELASTIC_PW = 'MiNp271=BMrcY7ASiEFT'
es = Elasticsearch(
    f'http://{app.config["ELASTIC_HOST"]}:{app.config["ELASTIC_PORT"]}',
    http_auth=('elastic', ELASTIC_PW),
    retry_on_timeout=True,
    max_retries=10,
    request_timeout=30)

Path(app.config['SAVE']).mkdir(exist_ok=True)

if 'TZ' in app.config:
    os.environ['TZ'] = app.config['TZ']
    time.tzset()

class Pool:
    '''This pool reads standard TREC mastermerge pools, but the
    logs are JSON lines.
    '''
    def __init__(self, filename):
        self.pool = {}
        self.topic = None
        self.desc = ''
        self.last = ''
        self.last_stamp = 0

        with open(filename, 'r') as fp:
            for line in fp:
                fields = line.split()
                if not self.topic:
                    self.topic = fields[0]
                if fields[0] != self.topic:
                    continue
                self.pool[fields[1]] = { 'judgment': '-1' }

        try:
            with open(f'{filename}.log', 'r') as log:
                for line in log:
                    log_entry = Pool.read_log_entry(line)
                    self.last = log_entry['docid']
                    self.last_stamp = log_entry['stamp']
                    if 'passage' in log_entry:
                        self.pool[log_entry['docid']]['passage'] = log_entry['passage']
                    if 'judgment' in log_entry:
                        self.pool[log_entry['docid']]['judgment'] = log_entry['judgment']
                    if 'subtopics' in log_entry:
                        if 'subtopics' not in self.pool[log_entry['docid']]:
                            self.pool[log_entry['docid']]['subtopics'] = {}
                        for subtopic, value in log_entry['subtopics'].items():
                            self.pool[log_entry['docid']]['subtopics'][subtopic] = value

        except FileNotFoundError:
            pass
        except KeyError:
            app.logger.debug('Bad log entry ' + topic + ': ' + docid)
            pass

        try:
            with open(f'{filename}.desc', 'r') as fp:
                desc_obj = json.loads(fp.read())
                resp = es.get(index='atomic-images', id=desc_obj['image_id'])
                self.desc = resp['_source']
        except FileNotFoundError:
            self.desc = json.dumps({'text': 'No description file'})
        except NotFoundError:
            self.desc = json.dumps({'text': 'Image not found'})

    def __len__(self):
        return len(self.pool)

    def num_rel(self):
        return sum([1 for judgment in self.pool.values() if int(judgment['judgment']) > 0])

    def num_judged(self):
        return sum([1 for judgment in self.pool.values() if judgment['judgment'] != '-1'])

    def json(self):
        poollist = []
        last = 0
        count = 0
        for docid, jobj in self.pool.items():
            if docid == self.last:
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
                            "topic": self.topic,
                            "desc": self.desc,
                            "last": last })

    @staticmethod
    def read_log_entry(line):
        if line.startswith('#'):
            return None
        log_entry = json.loads(line)
        if 'stamp' not in log_entry or 'docid' not in log_entry:
            app.logger.debug('Bad log object: ' + json.dumps(log_entry))
            return None
        return log_entry

query_args = {
    'u': fields.String(validate=validate.Regexp(r'^[A-Za-z0-9]+$'),
                       required=True),
    'p': fields.String(validate=validate.Length(equal=64)),
    't': fields.String(validate=validate.Regexp(r'^[0-9a-f-]+$')),
    'd': fields.String()
}


@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard_front():
    return render_template('index.html')

@app.route('/inbox')
@use_args(query_args, location='query')
def inbox(qargs):
    user = qargs['u']
    data = {}
    try:
        homedir = Path(app.config['SAVE']) / user
        for child in homedir.iterdir():
            if re.match(r'^topic[0-9a-f-]+$', child.name):
                p = Pool(child)
                data[p.topic] = (len(p), p.num_judged(), p.num_rel())

        app.logger.debug('Got inbox for ' + user)
        return(data, 200)
    except IOError as e:
        app.logger.exception('I/O error reading for ' + user)
        app.logger.exception(e.strerror + ': ' + e.filename)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading for ' + user)
        return('', 503)

@app.route('/dashdata')
def dashboard():
    data = []
    try:
        reldir = Path(app.config['SAVE'])
        for relchild in reldir.iterdir():
            if relchild.is_dir():
                for child in relchild.iterdir():
                    if re.match(r'^topic[0-9a-f-]+$', child.name):
                        p = Pool(child)
                        pct_rel = p.num_rel() * 100 / len(p)
                        data.append({'topic': p.topic,
                                     'assr': child.parent.stem,
                                     'num_docs': len(p),
                                     'num_rel': p.num_rel(),
                                     'pct_rel': pct_rel,
                                     'num_left': len(p) - p.num_judged(),
                                     'stamp': p.last_stamp,
                                     'timedate': time.strftime("%a %d %b %Y %H:%M", time.localtime(p.last_stamp))
                                     })
        return(jsonify(data), 200)
    except IOError as e:
        app.logger.exception('I/O error reading dashboard')
        app.logger.exception(e.strerror + ': ' + e.filename)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading dashboard')
        return('', 503)

@app.route('/pool')
@use_args(query_args, location='query')
def get_pool(qargs):
    topic = qargs['t']
    user = qargs['u']
    try:
        filename = Path(app.config['SAVE']) / user / f'topic{topic}'
        pool = Pool(filename)
        return(pool.json(), 200)
    except FileNotFoundError:
        app.logger.exception(f'Pool not found: {user} {topic} {filename}')
        return('', 404)
    except IOError:
        app.logger.exception(f'Error reading pool {user} {topic} {filename}')
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
