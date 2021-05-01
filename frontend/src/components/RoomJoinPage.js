import React, { Component } from "react";
import { Link } from "react-router-dom";
import s from "./Components.module.scss";

export default class RoomJoinPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            code: "",
            error: "",
        };
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleJoinClick = this.handleJoinClick.bind(this);
    }

    handleCodeChange(e) {
        this.setState({
            code: e.target.value,
            error: "",
        });
    }

    handleJoinClick() {
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                code: this.state.code,
            })
        };
        fetch('/api/join-room', requestOptions)
            .then((response) => {
                if (response.ok) {
                    this.props.history.push(`/room/${this.state.code}`);
                } else {
                    this.setState({
                        error: "Неверный код группы"
                    });
                }
            })
            .catch((error) => {
                console.log(error);
            });

    }

    render() {
        return (
            <div className={s.joinDiv}>
                <h1>Подключиться в комнату</h1>
                <p className={s.errorText}>{this.state.error}</p>
                <input type="text" id="codeInput" placeholder="Введите код" className={this.state.error == "" ? s.codeInput : s.error} onChange={this.handleCodeChange}/>
                <button className={s.joinBtn} onClick={this.handleJoinClick}>Присоединиться</button>
                <Link to="/" className={s.returnBtn} >Назад</Link>
            </div>
        );
    }
}