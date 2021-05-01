import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import s from "./Components.module.scss";

import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";

export default class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: null
    }
    this.handleLeaveRoomCallBack = this.handleLeaveRoomCallBack.bind(this);
  }

  async componentDidMount() {
    fetch('/api/user-in-room')
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          roomCode: data.code
        });
      });
  }

  handleLeaveRoomCallBack() {
    this.setState({
      roomCode: null
    });
  }

  renderHomePage() {
    return (
      <div className={s.homeDiv}>
        <h1>Ковид-тусовка</h1>
        <div className={s.homeBtnGroup}>
          <Link to="/join" className={s.homeBtnJoin}>Подключиться</Link>
          <Link to="/create" className={s.homeBtnCreate}>Создать комнату</Link>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Router>
          <Switch>
              <Route exact path="/" render={()=>{
                return this.state.roomCode ? (
                  <Redirect to={`/room/${this.state.roomCode}`} />
                ) : (
                  this.renderHomePage()
                )
              }} />
              <Route path="/join" component={RoomJoinPage}/>
              <Route path="/create" component={CreateRoomPage}/>
              <Route 
                path="/room/:roomCode" 
                render={(props)=>{
                  return <Room {...props} leaveRoomCallBack={this.handleLeaveRoomCallBack} />
                }}
              />
          </Switch>
      </Router>
    ) 
  }
}
