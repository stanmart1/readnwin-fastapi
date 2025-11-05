#!/usr/bin/env python3
import requests
import json

# Test non-student signup
non_student_data = {
    "email": "testuser@example.com",
    "username": "testuser123",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "phone_number": None,
    "school_name": None,
    "school_category": None,
    "class_level": None,
    "department": None
}

# Test student signup
student_data = {
    "email": "teststudent@example.com",
    "username": "teststudent123",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "Student",
    "phone_number": None,
    "school_name": "Test University",
    "school_category": "Tertiary",
    "class_level": None,
    "department": "Computer Science"
}

print("=" * 60)
print("Testing NON-STUDENT signup...")
print("=" * 60)
print("Payload:", json.dumps(non_student_data, indent=2))
print()

try:
    response = requests.post(
        "http://localhost:8000/auth/register",
        json=non_student_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")

print("\n" + "=" * 60)
print("Testing STUDENT signup...")
print("=" * 60)
print("Payload:", json.dumps(student_data, indent=2))
print()

try:
    response = requests.post(
        "http://localhost:8000/auth/register",
        json=student_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")
