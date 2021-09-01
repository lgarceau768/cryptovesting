// TODO replace with the wallet address of crpytovesting
let walletAddress = "0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC";
walletAddress =  '0x01420A7b545ac6c99F2b91e9f73464AA69C6E248';

// The minimum ABI to get ERC20 Token balance
let minABI = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  }
];


window.addEventListener('load', () => {
    let web3 = new Web3('https://bsc-dataseed.binance.org') //'https://data-seed-prebsc-1-s1.binance.org:8545/') // https://bsc-dataseed.binance.org/
    const IP = '25.89.250.119' //'192.168.1.224'

    async function getBalance(tokenAddress) {
        let balanceContract = new web3.eth.Contract(minABI,tokenAddress);
        balance = await balanceContract.methods.balanceOf(walletAddress).call();
        return balance;
      }

    // INFO upload token for contract check
    let button = document.getElementById("uploadtoken")
    button.addEventListener('click', async () => {
        let link = document.getElementById("linkinput").value
        if(link == ""){
            alert('Please enter a url')
        } else {
            let address = '0x' + link.split('0x')[1]
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

    // INFO upload token for sniper bypass
    let button2 = document.getElementById("uploadtokenByPass")
    button2.addEventListener('click', async () => {
        let link = document.getElementById("linkinput2").value
        if(link == ""){
            alert('Please enter a url')
        } else {
            let address = '0x'+ link.split('0x')[1]
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

    // INFO upload token and amount to sell
    let sellButton = document.getElementById('sellButton');
    sellButton.addEventListener('click', async () => {
        let token = document.getElementById('sellInput').value
        let amount = document.getElementById('sellAmountInput').value
        if(amount == "" || token == "") {
            alert('Please enter values for a token and link')
        } else {
            let address = '0x'+ token.split('0x')[1]
            try {
                const resp = await fetch('http://'+IP+':4041/upload_sell_token', {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                    'token': address,
                    'amt': parseInt(amount)
                    })
                })
                let data = await resp.json();
                if(data['res'] == 'OK'){
                    alert('Selling token')
                }
            } catch (err) {
                alert('Error selling token: ' + err.message)
                console.error(err)
            }
        }
    })

    // INFO handle uploading a live token to buy
    let liveButton = document.getElementById('livetokenBuy');
    liveButton.addEventListener('click', async () => {
        let token = document.getElementById('livetoken').value
        if(token == "") {
            alert('Please enter values for a token')
        } else {
            let address = '0x'+ token.split('0x')[1]
            try {
                const resp = await fetch('http://'+IP+':4041/upload_buy_token', {
                    method: 'post',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                    'token': address
                    })
                })
                let data = await resp.json();
                if(data['res'] == 'OK'){
                    alert('Buying token')
                }
            } catch (err) {
                alert('Error buying token: ' + err.message)
                console.error(err)
            }
        }
    })

    // INFO handle getting the balance of the inputted token
    let sellInput = document.getElementById('sellInput');
    sellInput.addEventListener('change', () => {
        document.getElementById('amtAvailable').innerText = 'Checking amount..'
        let value = document.getElementById('sellInput').value;
        if(value.length >= 42) {
            value = '0x'+ value.split('0x')[1]
            console.log(value)
            // get the balance available to sell
            getBalance(value).then((balance) => {
                document.getElementById('amtAvailable').innerText = 'Amount: '+ balance
            }).catch(console.error)
        }
    })


})


