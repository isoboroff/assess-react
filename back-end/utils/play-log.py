#!/usr/bin/env python3

import argparse
import json
import collections
import sys

ap = argparse.ArgumentParser(
    description='foo!')
ap.add_argument('poolfile')
ap.add_argument('logfile')

args = ap.parse_args()

judgments = {}
with open(args.poolfile, 'r') as fp:
    for line in fp:
        topic, docid, rank, sim, runtag, _, _ = line.split()
        print(docid)
        judgments[docid] = -1

with open(args.logfile, 'r') as fp:
    for line in fp:
        e = json.loads(line)
        if 'docid' in e:
            if e['docid'] not in judgments:
                sys.exit(f'Unknown doc {docid}')
        if 'judgment' in e:
            judgments['docid'] = e['judgment']

for doc, rel in judgments.items():
    print(doc, rel)
