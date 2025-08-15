#!/bin/bash

# Example script to send a custom newsletter
# First, you need to login as admin and get the token

echo "=== Sending Custom Newsletter ==="

# Login as admin first
echo "1. Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@futons.com",
    "password": "admin123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to get admin token"
    exit 1
fi

echo "2. Sending newsletter..."

# Send custom newsletter
curl -X POST http://localhost:3000/api/send-newsletter \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subject": "New Song Release!",
    "message": "Hey fans!\n\nWe just released our new single \"Electric Dreams\" on all streaming platforms!\n\nCheck it out and let us know what you think.\n\nRock on!\nThe Futons"
  }'

echo -e "\n=== Newsletter sent! ==="
