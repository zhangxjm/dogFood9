from app.database import db
from app.models.models import Music


class MusicService:
    current_playlist = []
    current_index = 0
    is_playing = False
    volume = 60
    is_muted = False

    @staticmethod
    def get_all_musics():
        musics = Music.query.all()
        return [m.to_dict() for m in musics]

    @staticmethod
    def get_favorites():
        musics = Music.query.filter_by(is_favorite=True).all()
        return [m.to_dict() for m in musics]

    @staticmethod
    def search(keyword):
        musics = Music.query.filter(
            (Music.title.like(f'%{keyword}%')) |
            (Music.artist.like(f'%{keyword}%')) |
            (Music.album.like(f'%{keyword}%'))
        ).all()
        return [m.to_dict() for m in musics]

    @staticmethod
    def get_by_artist(artist):
        musics = Music.query.filter(Music.artist.like(f'%{artist}%')).all()
        return [m.to_dict() for m in musics]

    @staticmethod
    def play(music_id=None, artist=None, song=None):
        if music_id:
            music = Music.query.get(music_id)
            if music:
                MusicService.current_playlist = [music.to_dict()]
                MusicService.current_index = 0
        elif artist:
            results = MusicService.get_by_artist(artist)
            if results:
                MusicService.current_playlist = results
                MusicService.current_index = 0
        elif song:
            results = MusicService.search(song)
            if results:
                MusicService.current_playlist = results
                MusicService.current_index = 0
        else:
            if not MusicService.current_playlist:
                MusicService.current_playlist = MusicService.get_all_musics()
                MusicService.current_index = 0

        MusicService.is_playing = True
        current = MusicService.current_playlist[MusicService.current_index] if MusicService.current_playlist else None

        return {
            'success': True,
            'is_playing': True,
            'current': current,
            'playlist_size': len(MusicService.current_playlist),
            'volume': MusicService.volume,
            'is_muted': MusicService.is_muted
        }

    @staticmethod
    def pause():
        MusicService.is_playing = False
        return {
            'success': True,
            'is_playing': False,
            'current': MusicService.current_playlist[MusicService.current_index] if MusicService.current_playlist else None
        }

    @staticmethod
    def resume():
        MusicService.is_playing = True
        return {
            'success': True,
            'is_playing': True,
            'current': MusicService.current_playlist[MusicService.current_index] if MusicService.current_playlist else None
        }

    @staticmethod
    def next():
        if not MusicService.current_playlist:
            return {'success': False, 'message': '播放列表为空'}
        MusicService.current_index = (MusicService.current_index + 1) % len(MusicService.current_playlist)
        return {
            'success': True,
            'is_playing': MusicService.is_playing,
            'current': MusicService.current_playlist[MusicService.current_index]
        }

    @staticmethod
    def prev():
        if not MusicService.current_playlist:
            return {'success': False, 'message': '播放列表为空'}
        MusicService.current_index = (MusicService.current_index - 1) % len(MusicService.current_playlist)
        return {
            'success': True,
            'is_playing': MusicService.is_playing,
            'current': MusicService.current_playlist[MusicService.current_index]
        }

    @staticmethod
    def set_volume(value):
        MusicService.volume = max(0, min(100, int(value)))
        if MusicService.volume > 0:
            MusicService.is_muted = False
        return {
            'success': True,
            'volume': MusicService.volume,
            'is_muted': MusicService.is_muted
        }

    @staticmethod
    def mute():
        MusicService.is_muted = not MusicService.is_muted
        return {
            'success': True,
            'is_muted': MusicService.is_muted,
            'volume': 0 if MusicService.is_muted else MusicService.volume
        }

    @staticmethod
    def get_status():
        return {
            'is_playing': MusicService.is_playing,
            'current': MusicService.current_playlist[MusicService.current_index] if MusicService.current_playlist else None,
            'playlist_size': len(MusicService.current_playlist),
            'volume': 0 if MusicService.is_muted else MusicService.volume,
            'is_muted': MusicService.is_muted
        }

    @staticmethod
    def toggle_favorite(music_id):
        music = Music.query.get(music_id)
        if not music:
            return {'success': False, 'message': '音乐不存在'}
        music.is_favorite = not music.is_favorite
        db.session.commit()
        return {'success': True, 'is_favorite': music.is_favorite}
