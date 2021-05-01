import React, { Component } from "react";
import s from "./Components.module.scss";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";

export default class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            votesToSkip: 2,
            guestCanPause: false,
            isHost: false,
            showSettings: false,
            spotifyAuthenticated: false,
            song: {}
        };
        this.roomCode = this.props.match.params.roomCode;
        this.handleLeaveBtn = this.handleLeaveBtn.bind(this);
        this.updateShowSettings = this.updateShowSettings.bind(this);
        this.renderSettingsBtn = this.renderSettingsBtn.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
        this.getRoomDetails = this.getRoomDetails.bind(this);
        this.authenticateSpotify = this.authenticateSpotify.bind(this);
        this.getCurrentSong = this.getCurrentSong.bind(this);
        this.getRoomDetails();
    }

    componentDidMount() {
        this.interval = setInterval(this.getCurrentSong, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    getRoomDetails() {
        fetch('/api/get-room' + '?code=' + this.roomCode)
            .then((response) => {
                if (!response.ok) {
                    this.props.leaveRoomCallBack();
                    this.props.history.push('/');
                }
                return response.json();
            })
            .then((data) => {
                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                    isHost: data.is_host,
                });
                if (this.state.isHost) {
                    this.authenticateSpotify();
                }
            });
    }

    authenticateSpotify() {
        fetch('/spotify/is-authenticated')
            .then((response) => response.json())
            .then((data) => {
                this.setState({
                    spotifyAuthenticated: data.status
                });
                console.log("Authenticated: ", this.state.spotifyAuthenticated);
                if (!data.status) {
                    fetch('/spotify/get-auth-url')
                        .then((response) => response.json())
                        .then((data) => {
                            window.location.replace(data.url);
                        });
                }
            });
    }

    getCurrentSong() {
        fetch('/spotify/current-song')
            .then((response) => {
                if (!response.ok) {
                    return {};
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                this.setState({
                    song: data
                });
                console.log(this.state.song);
            });
    }


// Frontend related functions
    handleLeaveBtn() {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        };
        fetch('/api/leave-room', requestOptions)
            .then((_response) => {
                this.props.leaveRoomCallBack();
                this.props.history.push('/');
            });
    }

    updateShowSettings(value) {
        this.setState({
            showSettings: value
        })
    }

    renderSettingsBtn() {
        return (
            <button onClick={() => this.updateShowSettings(true)}>Настройки</button>
        );
    }

    renderSettings() {
        return (
            <CreateRoomPage 
                update={true} 
                votesToSkip={this.state.votesToSkip} 
                guestCanPause={this.state.guestCanPause} 
                roomCode={this.roomCode}
                updateCallBack={this.getRoomDetails}
                updateShowSettingsCallBack={this.updateShowSettings}
            />
        );
    }

    render() {
        if (this.state.showSettings) {
            return this.renderSettings();
        } else {
            return (
                <div className={s.roomDiv}>
                    <h3>Код комнаты: {this.roomCode}</h3>
                    <MusicPlayer {...this.state.song} />
                    {this.state.isHost ? this.renderSettingsBtn() : null}
                    <button className={s.returnBtn} onClick={this.handleLeaveBtn}>Выйти из комнаты</button>
                </div>
            )
        }
        
    }
}
