#!/usr/bin/env python3

import argparse
import hashlib
import random
import secrets
import string
import sys
from getpass import getpass

ap = argparse.ArgumentParser(description='Read a password from the console and output a line for a password file')
ap.add_argument('-r', '--random', action='store_true', help='Generate a random jumble password')
ap.add_argument('-w', '--words', type=int, default=0,
                help='Generate a password with N random words')
ap.add_argument('-d', '--dictionary',
                default='/usr/share/dict/words')
ap.add_argument('username', help='User name')

args = ap.parse_args()

if args.words > 0:
    with open(args.dictionary, 'r') as fp:
        words = [w.strip().lower()
                 for w in fp.readlines()
                 if len(w) > 3 and len(w) < 8]

def jumble_password_ok(password):
    return (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in '!@#$%^&*(){}[]:;.,></?' for c in password))

if args.random:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(10))
        if password_ok(password):
            break
    print(f'{args.username}:{password}', file=sys.stderr)

elif args.words > 0:
    password = random.sample(words, args.words)
    password = '-'.join(password)
    print(f'{args.username}:{password}', file=sys.stderr)

else:
    print('Password must have an upper case letter, a digit, a punctuation character, and a haiku.')
    while True:
        password = getpass()
        if password_ok(password):
            break

m = hashlib.sha256()
m.update(password.encode('utf-8'))
print(f'{args.username}:{m.hexdigest()}')
