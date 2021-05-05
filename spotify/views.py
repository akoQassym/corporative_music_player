from django.shortcuts import redirect, render
from requests.sessions import session
import rest_framework
from rest_framework import views
from rest_framework.response import Response
from .credentials import REDIRECT_URI, CLIENT_ID, CLIENT_SECRET
from rest_framework.views import APIView
from requests import Request, api, post
from rest_framework import status
from rest_framework.response import Response
from .util import *
from api.models import Room
from .models import VotesModel

class AuthUrlView(APIView):
    def get(self, request, format=None):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        # We are not SENDING request, we are GENERATING URL
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)

def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    # Here we are actually SENDING THE REQUEST and get the info in return
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')
    
    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(request.session.session_key, access_token, refresh_token, token_type, expires_in)
    
    # Redirect to a different APP:

    # in urls.py of app named Frontend 
    #   there is a line of code: app_name = 'frontend',
    #   and in a path: name=''

    # if we had a name='lol', we should have written the redirecting line as one below:
    #   return redirect('frontend:lol')

    return redirect('frontend:')

class IsAuthenticatedView(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)

class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)
        if rooms.exists():
            room = rooms[0]
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)

        host = room.host

        endpoint = 'player/currently-playing'
        response = execute_spotify_api_call(host, endpoint)

        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)        
        
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        artist_string = ""

        for i, artist in enumerate(item.get('artists')):
            if i>0:
                artist_string += ", "
            name = artist.get('name')
            artist_string += name

        votes = VotesModel.objects.filter(room=room, song_id=song_id)
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': len(votes),
            'votes_required': room.votes_to_skip,
            'id': song_id
        }

        self.update_room_song(room, song_id)

        return Response(song, status=status.HTTP_200_OK)

    def update_room_song(self, room, song_id):
        current_song = room.current_song

        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            votes = VotesModel.objects.filter(room=room).delete()



class PauseSongView(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            response = pause_song(room.host)
            return Response(response, status=status.HTTP_204_NO_CONTENT)

        return Response({}, status=status.HTTP_403_FORBIDDEN)


class PlaySongView(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            response = play_song(room.host)
            return Response(response, status=status.HTTP_204_NO_CONTENT)

        return Response({}, status=status.HTTP_403_FORBIDDEN)


class SkipSongView(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code)[0]
        votes = VotesModel.objects.filter(room=room, song_id = room.current_song)
        votes_needed = room.votes_to_skip

        if self.request.session.session_key == room.host or len(votes)+1 >= votes_needed:
            votes.delete(room=room)
            response = skip_song(room.host)
        else:
            vote = VotesModel(user=self.request.session.session_key, room=room, song_id=room.current_song)
            votes.save()
            

        return Response(response, status=status.HTTP_204_NO_CONTENT)