#!/usr/bin/env python3

import argparse
import hashlib
import random
import secrets
import string
import sys
from pathlib import Path
from getpass import getpass

import werkzeug

ap = argparse.ArgumentParser(description='Read a password from the console and output a line for a password file')
ap.add_argument('-r', '--random', action='store_true', help='Generate a random password')
ap.add_argument('-l', '--length', type=int, default=3,
                help='Password length (default 3 words)')
ap.add_argument('username', help='User name')

args = ap.parse_args()

words_path = Path(__file__).parent / 'common-words.txt'
if words_path.exists():
    with open(words_path, 'r') as fp:
        words = [line.rstrip() for line in fp if len(line) > 2]
else:
    sys.exit('I have no words')

def password_ok(password):
    return (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in '!@#$%^&*(){}[]:;.,></?' for c in password))

if args.random:
    password = '-'.join(secrets.choice(words) for i in range(args.length))
else:
    print('Password must have a lower case letter, an upper case letter, a digit, a punctuation character, and a haiku.')
    while True:
        password = getpass()
        if password_ok(password):
            break

hashpass = werkzeug.security.generate_password_hash(password)
print(f'{args.username}:{password}', file=sys.stderr)
print(f'{args.username}:{hashpass}')
