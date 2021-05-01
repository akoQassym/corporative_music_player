import React, { Component } from "react";
import { render } from "react-dom";

import HomePage from "./HomePage";

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render() {
        return (
            <div>
                <HomePage />
            </div>
            
        );
    }
}

const appDiv = document.getElementById("app"); //getting the element Div by Id "app" from the index.html (the parent file) in templates folder
render(<App name="Aknur"/>, appDiv); //render the App Component inside of the appDiv