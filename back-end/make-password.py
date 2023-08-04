#!/usr/bin/env python3

import argparse
import hashlib
import secrets
import string
import sys
from pathlib import Path
from getpass import getpass

ap = argparse.ArgumentParser(description='Read a password from the console and output a line for a password file')
ap.add_argument('-r', '--random', action='store_true', help='Generate a random password')
ap.add_argument('-w', '--words', action='store_true',
                help='Use random words instead of random characters')
ap.add_argument('-l', '--length', type=int, default=-1,
                help='Password length (default 3 words or 12 chars)')
ap.add_argument('--use-this-password', nargs=1,
                help='Specify the password on the command line (don\'t do this please)')
ap.add_argument('username', help='User name')

args = ap.parse_args()

if args.words:
    if args.length == -1:
        args.length = 3
    words_path = Path(__file__).parent / 'common-words.txt'
    if words_path.exists():
        with open(words_path, 'r') as fp:
            words = [line.rstrip() for line in fp if len(line) > 2]
    else:
        args.words = False

if args.length == -1:
    args.length = 12

def password_ok(password):
    return (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in '!@#$%^&*(){}[]:;.,></?' for c in password))

if args.use_this_password:
    password = args.use_this_password[0]
elif args.random:
    if args.words:
        password = '-'.join(secrets.choice(words) for i in range(args.length))
    else:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        while True:
            password = ''.join(secrets.choice(alphabet) for i in range(args.length))
            if password_ok(password):
                break
else:
    print('Password must have a lower case letter, an upper case letter, a digit, a punctuation character, and a haiku.')
    while True:
        password = getpass()
        if password_ok(password):
            break

m = hashlib.sha256()
m.update(password.encode('utf-8'))
print(f'{args.username}:{password}', file=sys.stderr)
print(f'{args.username}:{m.hexdigest()}')
