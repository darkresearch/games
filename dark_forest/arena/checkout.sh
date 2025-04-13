#!/bin/bash

# (cd packages && git checkout $1)
cd packages && git checkout $1 && cd ..
cd client && git checkout $1 && cd ..
cd eth && git checkout $1 && cd ..
cd circuits && git checkout $1 && cd ..
