#!/usr/bin/env python

from elasticsearch import helpers
from elasticsearch import Elasticsearch, TransportError
import argparse
import bz2
import json
import re
import sys
import traceback
import uuid
from tqdm import tqdm

parser = argparse.ArgumentParser(description='Index product search track docs to ElasticSearch',                                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('bundle', nargs='*', help='Bundle to index')
parser.add_argument('--host', default='localhost', help='Host for ElasticSearch endpoint')
parser.add_argument('--port', default='9200', help='Port for ElasticSearch endpoint')
parser.add_argument('--index_name', default='ikat', help='index name')
parser.add_argument('--create', action='store_true')

args = parser.parse_args()
# Ian dev
#ELASTIC_PW = '_sVN=QdW+IIMtE2tyI5i'
#CERT_FINGERPRINT = '46:73:6B:BE:F6:16:B7:C1:4C:EF:FE:59:1E:F3:78:86:67:02:55:25:F2:62:53:69:55:F3:70:8E:F0:B0:3D:1B'

# Madison
ELASTIC_PW = '_sVN=QdW+IIMtE2tyI5i'
CERT_FINGERPRINT = '46:73:6B:BE:F6:16:B7:C1:4C:EF:FE:59:1E:F3:78:86:67:02:55:25:F2:62:53:69:55:F3:70:8E:F0:B0:3D:1B'

# IR
#CERT_FINGERPRINT = 'B3:3D:86:03:C4:EB:1F:E4:DE:26:60:C2:DF:37:EF:A8:A5:8D:0F:B3:75:35:7A:10:C5:FC:CB:DC:DA:C2:72:CA'
#ELASTIC_PW = '8kSU40BA3-Fr-Mg8av60'  # elastic on IR

es = Elasticsearch(
    f'https://{args.host}:{args.port}',
    basic_auth=('elastic', ELASTIC_PW),
    ssl_assert_fingerprint=CERT_FINGERPRINT,
    retry_on_timeout=True,
    max_retries=10,
    request_timeout=30)

settings = {
    'settings': {
        'index': {
            # Optimize for loading; this gets reset when we're done.
            'refresh_interval': '-1',
            'number_of_shards': '5',
            'number_of_replicas': '0',
        },
        # Set up a custom unstemmed analyzer.
        'analysis': {
            'analyzer': {
                'english_exact': {
                    'tokenizer': 'standard',
                    'filter': [
                        'lowercase'
                    ]
                }
            }
        }
    },
    'mappings': {
        'properties': {
            'text': {
                # text is stemmed; text.exact is not.
                'type': 'text',
                'analyzer': 'english',
                'fields': {
                    'exact': {
                        'type': 'text',
                        'analyzer': 'english_exact'
                    }
                }
            },
        }
    }
}

if args.create or not es.indices.exists(index=args.index_name):
    try:
        es.indices.create(index=args.index_name, body=settings)
    except TransportError as e:
        print(e.info)
        sys.exit(-1)

def doc_generator(f, num_docs):
    for line in tqdm(f, total=num_docs):
        try:
            js = json.loads(line)
            
            data_dict = {
                "_index": args.index_name,
                "_id": js['id']
            }
            source_block = {
                "docid": js['id'],
                "title": js['contents'][:25],
                "text": js['contents'],
                "url": js['url']
            }
            
            data_dict['_source'] = source_block
            
        except json.decoder.JSONDecodeError:
            traceback.print_exc(file=sys.stdout)
            print(line, file=sys.stdout)
        except Exception:
            # print(json.dumps(js,sort_keys=True, indent=4))
            traceback.print_exc(file=sys.stdout)
            quit()

        yield data_dict

for bundle in args.bundle:
    if bundle.endswith('.bz2'):
        open = bz2.open
        
    print(f"Counting {bundle}...")
    with open(bundle, 'r') as f:
        lines = 0
        for line in f:
            lines += 1

    print(f"Indexing {bundle}...")
    with open(bundle, 'r') as f:
        helpers.bulk(es, doc_generator(f, lines), request_timeout=30)

es.indices.put_settings(index=args.index_name,
                        body={'index': { 'refresh_interval': '1s',
                                         'number_of_replicas': '1',
                        }})
