import React from 'react'
import './Button.css'

export default function Button(props) {
    return (
        <div className="button_container" onClick={props.onClick} style={{backgroundColor: props.color}}>
            <p className="button_text">{props.text}</p>
        </div>
    )
}