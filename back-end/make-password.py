#!/usr/bin/env python3

import argparse
import hashlib
import secrets
import string
import sys
from getpass import getpass

ap = argparse.ArgumentParser(description='Read a password from the console and output a line for a password file')
ap.add_argument('-r', '--random', action='store_true', help='Generate a random password')
ap.add_argument('username', help='User name')

args = ap.parse_args()

def password_ok(password):
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
    print('Random password is', password, file=sys.stderr)
else:
    print('Password must have an upper case letter, a digit, a punctuation character, and a haiku.')
    while True:
        password = getpass()
        if password_ok(password):
            break

m = hashlib.sha256()
m.update(password.encode('utf-8'))
print(f'{args.username}:{m.hexdigest()}')
