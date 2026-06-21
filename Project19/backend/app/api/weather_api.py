from flask import jsonify, request, Blueprint
from app.services import WeatherService

weather_bp = Blueprint('weather', __name__, url_prefix='/api/weather')


@weather_bp.route('/', methods=['GET'])
def get_current():
    city = request.args.get('city', '北京')
    date_str = request.args.get('date')
    result = WeatherService.get_weather(city, date_str)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@weather_bp.route('/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city', '北京')
    days = int(request.args.get('days', 5))
    result = WeatherService.get_forecast(city, days)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code
