import React from 'react'
import './Title.css'

export default function Title(props) {   
    return (
        <p className={props.type}>{props.text}</p>
    )
}