from flask import Flask, render_template, request, make_response
from elasticsearch import Elasticsearch

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
    argparser.add_argument('--index', help='Index to search against', default='better_ar')
    args = argparser.parse_args()
else:
    args = argparse.Namespace(**{'host': 'elastic',
                                 'port': 9200,
                                 'save': 'relevance',
                                 'index': 'better_ar'})


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
                    if 'passage' in log_entry:
                        self.pool[log_entry['docid']]['passage'] = log_entry['passage']
                    if 'judgment' in log_entry:
                        self.pool[log_entry['docid']]['judgment'] = log_entry['judgment']
                    
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
        return sum([1 for judgment in self.pool.values() if int(judgment) > 0])

    def num_judged(self):
        return sum([1 for judgment in self.pool.values() if judgment != '-1'])
    
    def json(self):
        poollist = []
        for docid, jobj in self.pool.items():
            if 'passage' in jobj:
                poollist.append({"docid": docid, "judgment": jobj['judgment'], "passage": jobj['passage']})
            else:
                poollist.append({"docid": docid, "judgment": jobj['judgment']})
        return json.dumps({ "pool": poollist,
                            "topic": self.topic,
                            "desc": self.desc })

    @staticmethod
    def read_log_entry(line):
        if line.startswith('#'):
            return None
        log_entry = json.loads(line)
        if 'stamp' not in log_entry or 'docid' not in log_entry:
            app.logger.debug('Bad log object: ' + json.dumps(log_entry))
            return None
        return log_entry

                 

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/inbox')
def inbox():
    username = request.args['u']
    if not re.match(r'[a-z]+', username):
        app.logger.debug('Load called with bad username: ' + username)
        return('', 404)
    data = {}
    try:
        homedir = Path(args.save) / username
        for child in homedir.iterdir():
            if re.match(r'^topic[0-9]+$', child.name):
                p = Pool(child)
                data[p.topic] = (len(p), p.num_judged(), p.num_rel())
                
        app.logger.debug('Got inbox for ' + username)
        return(data, 200)
    except IOError:
        app.logger.debug('I/O error reading for ' + username)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading for ' + username)
        return('', 503)


@app.route('/pool')
def get_pool():
    user = request.args['u']
    topic = request.args['t']
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
def get_document():
    docid = request.args['d']
    try:
        response = es.get(index=args.index, id=docid)
        if response['found']:
            return(response['_source'], 200)
        else:
            return('', 404)
    except Exception:
        app.logger.exception('Unexpected error getting docid ' + docid)
        return('', 503)
    

@app.route('/judge', methods=['POST'])
def set_judgment() :
    user = request.args['u']
    topic = request.args['t']
    docid = request.args['d']
    judgment = request.args['j']

    log_obj = { 'stamp': time.time(),
                'docid': docid,
                'judgment': judgment }
        
    if request.content_length > 0:
        passage = request.get_json()
        log_obj['passage'] = passage

    logfile = Path(args.save) / user / f'topic{topic}.log'
    with open(logfile, 'a') as fp:
        print(json.dumps(log_obj), file=fp)
        
    return('', 200)


if __name__ == '__main__':
    print('Starting Flask...')
    app.debug = True
    app.run(host = '0.0.0.0')
