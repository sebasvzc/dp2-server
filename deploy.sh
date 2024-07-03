#!/bin/bash

git switch main
git fetch
git reset --hard origin/main

# Check if a parameter is provided
if [ -z "$1" ]; then
  echo "Debe introducir la direccion url base, por ejemplo: $0 http://3.218.68.113"
  exit 1
fi

# Assign the parameter to a variable
PARAMETER=$1
processed_url="${PARAMETER#*//}"

# Use the parameter
echo "The parameter provided is: $PARAMETER"

# Example of using the parameter in a command
sed -i 's|http://localhost:3000|$PARAMETER/api|g' example/web-socket.html
sed -i 's|localhost:3000|$processed_url/api|g' example/web-socket.html
sed -i 's|http://localhost:3030|$PARAMETER|g' routes/user/userRoutes.js

npm start