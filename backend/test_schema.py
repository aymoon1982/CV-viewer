
from schemas import JobProfileCreate
import json

data = {
    "title": "Test Engineer",
    "department": "QA",
    "mandatoryCriteria": {"degree": "bachelor"},
    "preferredCriteria": {"senior": True},
    "scoringWeights": {"exp": 50},
}

try:
    obj = JobProfileCreate(**data)
    print(f"Mandatory (from alias): {obj.mandatory_criteria}")
except Exception as e:
    print(f"Error with camelCase: {e}")

data2 = {
    "title": "Test Engineer 2",
    "department": "QA",
    "mandatory_criteria": {"degree": "master"},
}

try:
    obj2 = JobProfileCreate(**data2)
    print(f"Mandatory (from field name): {obj2.mandatory_criteria}")
except Exception as e:
    print(f"Error with snake_case: {e}")
