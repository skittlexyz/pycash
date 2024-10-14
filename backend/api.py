import json
import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify, abort
import numpy as np
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)

INVESTMENTS_PATH = os.getenv('INVESTMENTS_PATH')
PORT = os.getenv('API_PORT')

def business_days(start, end):
    return np.busday_count(start, end)

def read_investments():
    with open(INVESTMENTS_PATH, 'r') as f:
        return json.load(f)

def save_investments(investments):
    with open(INVESTMENTS_PATH, 'w') as f:
        json.dump(investments, f, indent=4)

def calculate_return(cdi_rate, start_date, end_date, investments):
    daily_rate = cdi_rate / 252
    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    total_return = 0
    total_expenses = 0

    for investment in investments:
        investment_date = datetime.strptime(investment["date"], "%Y-%m-%d").date()
        
        if start_date <= investment_date <= end_date:
            if investment["value"] > 0:
                days = business_days(investment_date, end_date)
                total_return += investment["value"] * (1 + daily_rate) ** days
            else:
                total_expenses += -investment["value"]

    final_return = total_return - total_expenses
    return max(final_return, 0)

@app.route('/investments', methods=['GET'])
def get_investments():
    investments = read_investments()
    return jsonify(investments)

@app.route('/investments', methods=['POST'])
def add_investment():
    if not request.json or 'value' not in request.json or 'date' not in request.json or 'description' not in request.json:
        abort(400)  # Bad request

    value = request.json['value']
    date_input = request.json['date']
    description = request.json['description']

    # Validate date format
    try:
        datetime.strptime(date_input, "%Y-%m-%d")
    except ValueError:
        abort(400)  # Bad request

    investments = read_investments()

    # Generate new ID
    new_id = max(inv['id'] for inv in investments) + 1 if investments else 1

    # Append the new investment with the generated ID
    investments.append({"id": new_id, "value": value, "date": date_input, "description": description})
    save_investments(investments)

    return jsonify({"message": "Investment added", "id": new_id, "value": value, "date": date_input, "description": description}), 201

@app.route('/calculate-return', methods=['POST'])
def calculate_return_route():
    if not request.json or 'cdi_rate' not in request.json or 'start_date' not in request.json or 'end_date' not in request.json:
        abort(400)  # Bad request

    cdi_rate = request.json['cdi_rate']
    start_date = request.json['start_date']
    end_date = request.json['end_date']

    # Validate the start date format
    try:
        datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        abort(400)  # Bad request

    # Use today's date if end_date is an empty string
    if end_date == "":
        end_date = datetime.now().date().strftime("%Y-%m-%d")
    else:
        try:
            datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            abort(400)  # Bad request

    investments = read_investments()
    result = calculate_return(cdi_rate, start_date, end_date, investments)

    return jsonify({"total_return": result}), 200

@app.route('/investments/<int:id>', methods=['PUT'])
def update_investment(id):
    investments = read_investments()
    
    investment = next((inv for inv in investments if inv['id'] == id), None)
    if investment is None:
        abort(404)  # Not found

    if not request.json or 'value' not in request.json or 'date' not in request.json or 'description' not in request.json:
        abort(400)  # Bad request

    investment['value'] = request.json['value']
    investment['date'] = request.json['date']
    investment['description'] = request.json['description']

    save_investments(investments)
    
    return jsonify({"message": "Investment updated", "investment": investment})

@app.route('/investments/<int:id>', methods=['DELETE'])
def delete_investment(id):
    investments = read_investments()
    
    investment = next((inv for inv in investments if inv['id'] == id), None)
    if investment is None:
        abort(404)  # Not found

    investments.remove(investment)  # Remove the investment with the matching id
    save_investments(investments)
    
    return jsonify({"message": "Investment deleted"})

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "Pong!"})

if __name__ == "__main__":
    app.run(debug=True, port=PORT)
