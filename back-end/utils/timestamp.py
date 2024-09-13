$!/usr/bin/env python3

import fileinput
import json
import time

for line in fileinput.input():
    try:
        obj = json.loads(line)
    except Exception:
        continue
    obj['stamp'] = time.ctime(obj['stamp'])
    print(json.dumps(obj))
