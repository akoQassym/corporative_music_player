from django.http import response
from .models import SpotifyTokenModel
from django.utils import timezone
from datetime import timedelta
from .credentials import CLIENT_SECRET, CLIENT_ID
from requests import post, put, get

BASE_URL = "https://api.spotify.com/v1/me/"


def get_user_tokens(session_key):
    user_token = SpotifyTokenModel.objects.filter(user = session_key)
    if user_token.exists():
        return user_token[0]
    return None


def update_or_create_user_tokens(session_key, access_token, refresh_token, token_type, expires_in):
    tokens = get_user_tokens(session_key)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in 
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
    else:
        tokens = SpotifyTokenModel(user=session_key, access_token=access_token, refresh_token=refresh_token, token_type=token_type, expires_in=expires_in)
        tokens.save()


def is_spotify_authenticated(session_key):
    tokens = get_user_tokens(session_key)

    if tokens:
        expiry = tokens.expires_in
        if expiry <= timezone.now():
            refresh_spotify_token(session_key)
        return True

    return False


def refresh_spotify_token(session_key):
    tokens = get_user_tokens(session_key)
    refresh_token = tokens.refresh_token

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token', 
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    new_access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')
    
    update_or_create_user_tokens(session_key, new_access_token, refresh_token, token_type, expires_in)


def execute_spotify_api_call(session_key, endpoint, post_=False, put_=False):
    tokens = get_user_tokens(session_key)
    header = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokens.access_token}

    # post_ to distinguish from post()
    if post_:
        post(BASE_URL + endpoint, headers=header)
    if put_:
        put(BASE_URL + endpoint, headers=header)

    response = get(BASE_URL + endpoint, {}, headers=header)
    try:
        return response.json()
    except:
        return {'Error': 'Issue with request'}




        

