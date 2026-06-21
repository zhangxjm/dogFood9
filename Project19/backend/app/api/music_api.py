from flask import jsonify, request, Blueprint
from app.services import MusicService

music_bp = Blueprint('music', __name__, url_prefix='/api/music')


@music_bp.route('/', methods=['GET'])
def get_all():
    keyword = request.args.get('q')
    if keyword:
        musics = MusicService.search(keyword)
    else:
        musics = MusicService.get_all_musics()
    return jsonify({'success': True, 'musics': musics})


@music_bp.route('/favorites', methods=['GET'])
def get_favorites():
    musics = MusicService.get_favorites()
    return jsonify({'success': True, 'musics': musics})


@music_bp.route('/play', methods=['POST'])
def play():
    data = request.get_json() or {}
    music_id = data.get('music_id')
    artist = data.get('artist')
    song = data.get('song')
    result = MusicService.play(music_id, artist, song)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@music_bp.route('/pause', methods=['POST'])
def pause():
    result = MusicService.pause()
    return jsonify(result)


@music_bp.route('/resume', methods=['POST'])
def resume():
    result = MusicService.resume()
    return jsonify(result)


@music_bp.route('/next', methods=['POST'])
def next_song():
    result = MusicService.next()
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@music_bp.route('/prev', methods=['POST'])
def prev_song():
    result = MusicService.prev()
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@music_bp.route('/volume', methods=['POST'])
def set_volume():
    data = request.get_json() or {}
    value = data.get('value', 50)
    result = MusicService.set_volume(value)
    return jsonify(result)


@music_bp.route('/mute', methods=['POST'])
def mute():
    result = MusicService.mute()
    return jsonify(result)


@music_bp.route('/status', methods=['GET'])
def status():
    result = MusicService.get_status()
    return jsonify({'success': True, 'status': result})


@music_bp.route('/<int:music_id>/favorite', methods=['POST'])
def toggle_favorite(music_id):
    result = MusicService.toggle_favorite(music_id)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code
