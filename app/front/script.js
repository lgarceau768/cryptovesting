<<<<<<< HEAD
window.addEventListener('load', () => {
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
                const response = await fetch('http://25.89.250.119:4041/upload_token', {
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
=======
window.addEventListener('load', () => {
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
                const response = await fetch('http://25.89.250.119:4041/upload_token', {
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
>>>>>>> 1e3863f015956128c6e5f2af8081280410a04cc7
})