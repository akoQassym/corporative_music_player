import React, { Component } from "react";
import { Link } from "react-router-dom";
import s from "./Components.module.scss";
import { Collapse } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

export default class CreateRoomPage extends Component {
  static defaultProps = {
    votesToSkip: 2,
    guestCanPause: true,
    update: false,
    roomCode: null,
    updateCallBack: () => {},
    updateShowSettingsCallBack: () => {}
  };

  constructor(props) {
    super(props);
    this.state = {
      guestCanPause: this.props.guestCanPause,
      votesToSkip: this.props.votesToSkip,
      successMsg: "",
      errorMsg: "",
    };
    this.handleCreateRoomBtn = this.handleCreateRoomBtn.bind(this);
    this.handleVotesChange = this.handleVotesChange.bind(this);
    this.handleGuestCanPauseChange = this.handleGuestCanPauseChange.bind(this);
    this.handleUpdateRoomBtn = this.handleUpdateRoomBtn.bind(this);
  }

  handleVotesChange(e) {
    this.setState({
      votesToSkip: e.target.value,
    });
  }

  handleGuestCanPauseChange(e) {
    this.setState({
      guestCanPause: e.target.value == "True" ? true : false,
    });
  }

  handleCreateRoomBtn() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_can_pause: this.state.guestCanPause,
        votes_to_skip: this.state.votesToSkip,
      }),
    };
    fetch("/api/create-room", requestOptions)
      .then((response) => response.json())
      .then((data) => this.props.history.push("/room/" + data.code));
  }

  handleUpdateRoomBtn() {
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: this.props.roomCode,
        guest_can_pause: this.state.guestCanPause,
        votes_to_skip: this.state.votesToSkip,
      }),
    };
    fetch("/api/update-room", requestOptions).then((response) => {
      if (response.ok) {
        this.setState({
          successMsg: "Изменения были выполнены успешно!",
        });
        console.log(this.state.successMsg);
      } else {
        this.setState({
          errorMsg: "Ошибка! Комната не изменена",
        });
      }
      this.props.updateCallBack();
    });
  }

  renderCreateBtn() {
    return (
      <div className={s.btnsDiv}>
        <button className={s.createBtn} onClick={this.handleCreateRoomBtn}>
          Создать комнату
        </button>
        <Link to="/" className={s.returnBtn}>
          Назад
        </Link>
      </div>
    );
  }

  renderUpdateBtn() {
    return (
      <div className={s.btnsDiv}>
        <button className={s.createBtn} onClick={this.handleUpdateRoomBtn}>
          Изменить комнату
        </button>
        <button className={s.returnBtn} onClick={() => {this.props.updateShowSettingsCallBack(false)}}>Выйти</button>
      </div>
    );
  }

  render() {
    const title = this.props.update ? "Изменить комнату" : "Создать комнату";
    return (
      <div className={s.createDiv}>
        <Collapse in={this.state.errorMsg != "" || this.state.successMsg != ""}>
          {this.state.successMsg != "" ? (
            <Alert severity="success" onClose={ () => {this.setState({successMsg: "", errorMsg: ""})} }>{this.state.successMsg}</Alert>
          ) : (
            <Alert severity="error" onClose={ () => {this.setState({successMsg: "", errorMsg: ""})} } >{this.state.errorMsg}</Alert>
          )}
        </Collapse>
        <h1> {title} </h1>
        <h5>Выберите что могут делать ваши гости:</h5>
        <div className={s.createForm}>
          <div className={s.guestControl}>
            <input
              type="radio"
              id="guestControlChoice1"
              name="radioGroup"
              value="True"
              checked={this.state.guestCanPause ? true : false}
              onChange={this.handleGuestCanPauseChange}
            />
            <label htmlFor="guestControlChoice1">Пауза/Играть</label>
          </div>
          <div className={s.guestControl}>
            <input
              type="radio"
              id="guestControlChoice2"
              name="radioGroup"
              value="False"
              checked={this.state.guestCanPause ? false : true}
              onChange={this.handleGuestCanPauseChange}
            />
            <label htmlFor="guestControlChoice2">Ничего</label>
          </div>
          <h5>Количество голосов для пропуска трека:</h5>
          <input
            type="number"
            defaultValue={this.state.votesToSkip}
            onChange={this.handleVotesChange}
          />
          {this.props.update ? this.renderUpdateBtn() : this.renderCreateBtn()}
        </div>
      </div>
    );
  }
}
