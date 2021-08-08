import React from 'react'
import Button from '../components/Button'
import TextInputBox from '../components/TextInputBox'
import Title from '../components/Title'
import './Login.css'

export default function LoginScreen(props) {
    const pressed = () => {
        const els = document.querySelectorAll('.textinput')
        let uName = els[0].value;
        let pWord = els[1].value;
        console.log({uName, pWord})
    }

    return (
        <div className="mainDiv">
            <Title className="mainTitle" type="title" text="Cryptovesting"/>
            <TextInputBox id="loginInput" icon="account" type="text" placeholder="Enter Username" onChange={console.log}/>
            <TextInputBox id="loginInput" icon="key" type="password" placeholder="Enter Password" onChange={console.log}/>
            <Button color="#279AF1" text="Login" onClick={pressed}/>
        </div>
    )
}