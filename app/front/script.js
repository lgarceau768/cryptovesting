
window.addEventListener('load', () => {
    const IP = '25.89.250.119' //'192.168.1.224'
    let button = document.getElementById("uploadtoken")
    button.addEventListener('click', async () => {
        let link = document.getElementById("linkinput").value
        if(link == ""){
            alert('Please enter a url')
        } else if(link.split('bscscan.com/').length < 1){
            alert('Please enter a valid url')
        } else {
            let address = link.split('bscscan.com')[1]
            address = address.substring(address.indexOf("0x"))
            try {
                const response = await fetch('http://'+ IP +':4041/upload_token', {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                      },
                    body: JSON.stringify({
                        token_name: address,
                        contract_hash: address,
                        bscscan_link: link
                    })
                })
                let data = await response.json();
                if(data["res"] == "OK"){
                    alert('Added!')
                }
            } catch (err) {
                alert('Error uploading token')
                console.error(err)
            }
        }
    })

    let button2 = document.getElementById("uploadtokenByPass")
    button2.addEventListener('click', async () => {
        let link = document.getElementById("linkinput2").value
        if(link == ""){
            alert('Please enter a url')
        } else if(link.split('bscscan.com/').length < 1){
            alert('Please enter a valid url')
        } else {
            let address = link.split('bscscan.com')[1]
            address = address.substring(address.indexOf("0x"))
            try {
                const response = await fetch('http://'+IP+':4041/upload_token_bypass', {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                      },
                    body: JSON.stringify({
                        token_name: address,
                        contract_hash: address,
                        bscscan_link: link
                    })
                })
                let data = await response.json();
                if(data["res"] == "OK"){
                    alert('Added!')
                }
            } catch (err) {
                alert('Error uploading token')
                console.error(err)
            }
        }
    })
})