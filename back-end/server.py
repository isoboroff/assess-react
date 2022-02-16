from flask import Flask, render_template, request, make_response
from elasticsearch import Elasticsearch
from webargs import fields, validate
from webargs.flaskparser import use_args

import argparse
import json
import sys
import re
import traceback
import time
from pathlib import Path
from datetime import datetime

if (__name__ == '__main__'):
    argparser = argparse.ArgumentParser(description='An assessment backend', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    argparser.add_argument('--host', help='ElasticSearch host', default='localhost')
    argparser.add_argument('--port', help='ElasticSearch port', default=9200)
    argparser.add_argument('--save', help='Location for saved data', default='relevance')
    argparser.add_argument('--index', help='Index to search against', default='hc4')
    argparser.add_argument('--pwfile', help='File containing username:pwhashes', default='passwd')
    args = argparser.parse_args()
else:
    args = argparse.Namespace(**{'host': 'localhost',
                                 'port': 9200,
                                 'save': 'relevance',
                                 'index': 'hc4',
                                 'pwfile': 'passwd'})


app = Flask(__name__, static_folder='../front-end/build/static',
            template_folder='../front-end/build')
es = Elasticsearch([{'host': args.host, 'port': args.port}])

Path(args.save).mkdir(exist_ok=True)

class Pool:
    '''This pool reads standard TREC mastermerge pools, but the
    logs are JSON lines.
    '''
    def __init__(self, filename):
        self.pool = {}
        self.topic = None
        self.desc = ''
        self.last = ''

        with open(filename, 'r') as fp:
            for line in fp:
                fields = line.split()
                if not self.topic:
                    self.topic = fields[0]
                if fields[0] != self.topic:
                    continue
                self.pool[fields[4]] = { 'judgment': '-1' }

        try:
            with open(f'{filename}.log', 'r') as log:
                for line in log:
                    log_entry = Pool.read_log_entry(line)
                    self.last = log_entry['docid']
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

        with open(f'{filename}.desc', 'r') as fp:
            self.desc = fp.read()

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
    't': fields.String(validate=validate.Regexp(r'^[0-9]+$')),
    'd': fields.String()
}


@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/inbox')
@use_args(query_args, location='query')
def inbox(qargs):
    user = qargs['u']
    data = {}
    try:
        homedir = Path(args.save) / user
        for child in homedir.iterdir():
            if re.match(r'^topicIR-T\d+-r\d+$', child.name):
                p = Pool(child)
                data[p.topic] = (len(p), p.num_judged(), p.num_rel())

        app.logger.debug('Got inbox for ' + user)
        return(data, 200)
    except IOError as e:
        app.logger.debug('I/O error reading for ' + user)
        app.logger.debug(e.strerror + ': ' + e.filename)
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
        filename = Path(args.save) / user / f'topic{topic}'
        pool = Pool(filename)
        return(pool.json(), 200)
    except FileNotFoundError:
        app.logger.debug(f'Pool not found: {user} {topic} {filename}')
        return('', 404)
    except IOError:
        app.logger.debug(f'Error reading pool {user} {topic} {filename}')
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
        response = es.get(index=args.index, id=docid)
        if response['found']:
            if topic and user:
                logfile = Path(args.save) / user / f'topic{topic}.log'
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

    logfile = Path(args.save) / user / f'topic{topic}.log'
    with open(logfile, 'a') as fp:
        print(json.dumps(log_obj), file=fp)

    return('', 200)

@app.route('/login')
@use_args(query_args, location='query')
def login(qargs):
    user = qargs['u']
    pw = qargs['p']

    with open(args.pwfile, 'r') as pwfile:
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
