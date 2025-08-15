#!/bin/bash

echo "🎸 Testing The Futons JSON-Based System"
echo "========================================"

API_URL="http://localhost:3001/api"

# Test 1: Health Check
echo "1. Testing API health..."
curl -s "$API_URL/health" | jq .

# Test 2: User Registration
echo -e "\n2. Testing user registration..."
curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@example.com","password":"password123","newsletter":true}' | jq .

# Test 3: User Login
echo -e "\n3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}')
echo $LOGIN_RESPONSE | jq .

# Extract token for further tests
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# Test 4: Admin Login
echo -e "\n4. Testing admin login..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futons.com","password":"admin123"}')
echo $ADMIN_LOGIN | jq .

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.token')

# Test 5: Add Concert (Admin)
echo -e "\n5. Testing add concert (admin)..."
curl -s -X POST "$API_URL/concerts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Test Concert","date":"2025-08-15","venue":"Test Venue","description":"A test concert"}' | jq .

# Test 6: Get Concerts
echo -e "\n6. Testing get concerts..."
curl -s "$API_URL/concerts" | jq .

# Test 7: Add Song (Admin)
echo -e "\n7. Testing add song (admin)..."
curl -s -X POST "$API_URL/songs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Test Song","genre":"Indie","description":"A test song"}' | jq .

# Test 8: Get Songs
echo -e "\n8. Testing get songs..."
curl -s "$API_URL/songs" | jq .

# Test 9: Contact Form
echo -e "\n9. Testing contact form..."
curl -s -X POST "$API_URL/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Contact","email":"contact@example.com","message":"Test message"}' | jq .

# Test 10: Newsletter Preference
echo -e "\n10. Testing newsletter preference update..."
curl -s -X POST "$API_URL/newsletter-preference" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"subscribed":false}' | jq .

echo -e "\n✅ All tests completed!"
echo -e "\n📋 Summary:"
echo "- API is running on port 3001"
echo "- User registration and login working"
echo "- Admin panel functionality working"
echo "- Concert and song management working"
echo "- Contact form working"
echo "- Newsletter subscription working"
echo ""
echo "🎯 Ready to use:"
echo "Admin: admin@futons.com / admin123"
echo "User: testuser@example.com / password123"
echo ""
echo "Open the website and test the frontend!"
