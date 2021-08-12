import React, { useState } from 'react'
import PhoneAndroidIcon from '@material-ui/icons/PhoneAndroid';
import MessageIcon from '@material-ui/icons/Message';
import './2FAPopup.css'
import Button from './Button';

export default function TwoFAPopup(props) {
    const [code, setCode] = useState('')
    
    const submit = () => {
        setCode(document.getElementsByClassName('twofa_code')[0].value)
        console.log('submit')
    }

    return (
        <div className="twofapopup">
            <p className="twofa_title">2FA Authentication</p>
            <div className="twofa_split">
                <div className="twofa_stacked">
                    <PhoneAndroidIcon className="twofa_phone"/>
                    <MessageIcon className="twofa_message"/>
                </div>
                <div className="twofa_text">
                    <p className="twofa_info">We have sent a message to <span className="twofa_blue">(XXX) XXX-{props.phoneLast4}</span> please type it below
                    </p>
                </div>
            </div>
            <input type="text" className="twofa_code"/>
            <Button color="var(--success-color)" tColor="var(--bkg-color)" text="Submit" onClick={submit}/>
        </div>
    )
}