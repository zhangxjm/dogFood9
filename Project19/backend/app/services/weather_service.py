from datetime import datetime, timedelta
import random


class WeatherService:
    CITY_COORDS = {
        '北京': {'lat': 39.9, 'lon': 116.4},
        '上海': {'lat': 31.2, 'lon': 121.5},
        '广州': {'lat': 23.1, 'lon': 113.3},
        '深圳': {'lat': 22.5, 'lon': 114.1},
        '杭州': {'lat': 30.3, 'lon': 120.2},
        '南京': {'lat': 32.1, 'lon': 118.8},
        '成都': {'lat': 30.7, 'lon': 104.1},
        '重庆': {'lat': 29.6, 'lon': 106.5},
        '武汉': {'lat': 30.6, 'lon': 114.3},
        '西安': {'lat': 34.3, 'lon': 108.9}
    }

    WEATHER_TYPES = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '中雪']

    @staticmethod
    def get_weather(city='北京', date_str=None):
        if not date_str:
            date_str = datetime.now().strftime('%Y-%m-%d')

        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        days_diff = (target_date - today).days

        weather_data = WeatherService._generate_weather(city, days_diff)

        return {
            'success': True,
            'city': city,
            'date': date_str,
            'weather': weather_data,
            'tips': WeatherService._generate_tips(weather_data)
        }

    @staticmethod
    def get_forecast(city='北京', days=5):
        forecast = []
        for i in range(days):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            weather = WeatherService._generate_weather(city, i)
            forecast.append({
                'date': date,
                'weather': weather
            })
        return {
            'success': True,
            'city': city,
            'forecast': forecast
        }

    @staticmethod
    def _generate_weather(city, days_diff):
        seed = hash(f'{city}_{datetime.now().strftime("%Y-%m-%d")}_{days_diff}') % 1000
        random.seed(seed)

        weather_type = random.choice(WeatherService.WEATHER_TYPES[:5])

        base_temp = 20
        if city in ['哈尔滨', '长春', '沈阳']:
            base_temp = 10
        elif city in ['广州', '深圳', '海口']:
            base_temp = 28
        elif city in ['重庆', '武汉', '南京']:
            base_temp = 25

        temp_high = base_temp + random.randint(-3, 8) + days_diff
        temp_low = temp_high - random.randint(5, 12)

        humidity = random.randint(30, 90)
        wind_speed = random.randint(1, 6)
        wind_dir = random.choice(['东风', '南风', '西风', '北风', '东南风', '西北风'])

        aqi = random.randint(30, 180)
        if aqi <= 50:
            aqi_level = '优'
        elif aqi <= 100:
            aqi_level = '良'
        elif aqi <= 150:
            aqi_level = '轻度污染'
        else:
            aqi_level = '中度污染'

        return {
            'type': weather_type,
            'temperature_high': temp_high,
            'temperature_low': temp_low,
            'temperature_current': (temp_high + temp_low) // 2,
            'humidity': humidity,
            'wind_speed': wind_speed,
            'wind_direction': wind_dir,
            'aqi': aqi,
            'aqi_level': aqi_level
        }

    @staticmethod
    def _generate_tips(weather):
        tips = []

        if '雨' in weather['type']:
            tips.append('今天有雨，出门记得带伞')
        if weather['temperature_high'] >= 35:
            tips.append('气温较高，注意防暑降温')
        elif weather['temperature_low'] <= 0:
            tips.append('气温较低，注意保暖')
        if weather['aqi'] > 100:
            tips.append('空气质量较差，建议减少户外活动')
        if weather['wind_speed'] >= 5:
            tips.append('风力较大，注意防风')

        if not tips:
            tips.append('天气不错，适合外出活动')

        return tips
