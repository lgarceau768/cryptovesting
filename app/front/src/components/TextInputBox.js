import React, { useState } from 'react'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'
import VpnKeyIcon from '@material-ui/icons/VpnKey'
import './TextInputBox.css'

export default function TextInputBox(props) {
    return (
        <div className="textinput_container">
            {props.icon == "account" ?
                <AccountCircleIcon className="textinput_icon" color="var(--text-color)"/>
            :
            props.icon == "key" ?   
                <VpnKeyIcon className="textinput_icon" color="var(--text-color)"/>
            : null}
            <input className="textinput" type={props.type} placeholder={props.placeholder}/>
        </div>
        
    )
}