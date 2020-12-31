from flask import Flask, render_template, request, make_response
from elasticsearch import Elasticsearch

import argparse
import json
import sys
import re
import traceback
from pathlib import Path
from datetime import datetime

if (__name__ == '__main__'):
    argparser = argparse.ArgumentParser(description='An assessment backend', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    argparser.add_argument('--host', help='ElasticSearch host', default='localhost')
    argparser.add_argument('--port', help='ElasticSearch port', default=9200)
    argparser.add_argument('--save', help='Location for saved data', default='relevance')
    argparser.add_argument('--index', help='Index to search against', default='wapo')
    args = argparser.parse_args()
else:
    args = argparse.Namespace(**{'host': 'elastic',
                                 'port': 9200,
                                 'save': 'relevance',
                                 'index': 'wapo'})


app = Flask(__name__, static_folder='../front-end/build/static',
            template_folder='../front-end/build')
es = Elasticsearch([{'host': args.host, 'port': args.port}])

Path(args.save).mkdir(exist_ok=True)

def log(user, event):
    with open(Path(args.save) / f'{user}.log', 'a') as fp:
        print(datetime.now(), event, file=fp)


class Pool:
    '''This pool reads standard TREC mastermerge pools.'''
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
                self.pool[fields[4]] = '-1'

        try:
            with open(f'{filename}.log', 'r') as log:
                for line in log:
                    stamp, docid, judgment = line.split()
                    self.pool[docid] = judgment
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
        poollist = [{"docid": docid, "judgment": judgment} for docid, judgment in self.pool.items()]
        return json.dumps({ "pool": poollist,
                            "topic": self.topic,
                            "desc": self.desc })

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
    user = request.args['u']
    docid = request.args['d']
    try:
        response = es.get(index=args.index, id=docid)
        if response['found']:
            return(response['_source'], 200)
        else:
            return('', 404)
    except Exception:
        app.logger.exception('Unexpected error getting docid ' + docid + ' for user ' + user)


if __name__ == '__main__':
    print('Starting Flask...')
    app.debug = True
    app.run(host = '0.0.0.0')
