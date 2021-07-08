import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';

const app = express();

const data = {
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //wbnb 
  to_PURCHASE: '0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3',  // token to purchase = BUSD for test
  factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
  recipient: '', //wallet address,
  AMOUNT_OF_WBNB : '0.0002', // INFO amount of the sniped token in BNB to buy
  Slippage : '3', //in Percentage
  gasPrice : '5', //in gwei
  gasLimit : '345684' //at least 21000
}

const initialLiquidityDetected = false;

const bscMainnetUrl = 'https://bsc-dataseed.binance.org/'; //ankr or quiknode
const privatekey = 'd2ba8bedb05f699de3a7f6d6f534a4b9ac487cc01eb0657f22a7d822865c7f7e'; //without 0
const provider = new ethers.providers.JsonRpcProvider(bscMainnetUrl)
const wallet = new ethers.Wallet(privatekey);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
  data.factory,
  ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
  account
);

const router = new ethers.Contract(
  data.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

const buyTokenTx = (amountIn, amountOutMin) => router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [data.WBNB, data.to_PURCHASE],
    data.recipient,
    Date.now() + 1000 * 60 * 10, //10 minutes
    {
      'gasLimit': data.gasLimit,
      'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
    }
);

const sellTokenTx = (amountIn, amountOutMin) => router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [data.to_PURCHASE, data.WBNB],
    data.recipient,
    Date.now() + 1000 * 60 * 10,
    {
      'gasLimit': data.gasLimit,
      'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
    }
);

const run = async () => {
  
  const pairAddress = await factory.getPair(data.WBNB, data.to_PURCHASE);

  console.log(pairAddress);

  const pair = new ethers.Contract(pairAddress, ['event Mint(address indexed sender, uint amount0, uint amount1)'], account);

  pair.on('Mint', async (sender, amount0, amount1) => {
    if(initialLiquidityDetected === true) {
        return;
    }

    initialLiquidityDetected = true;

  //We buy x amount of the new token for our wbnb
  const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);

  //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 

  console.log(
    chalk.green.inverse(`Liquidity Addition Detected\n`)
    +
    `Buying Token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);

  console.log('Processing Transaction.....');
  console.log(chalk.yellow(`amountIn: ${amountIn}`));
  console.log(chalk.yellow(`amountOutMin: ${amountOutMin}`));
  console.log(chalk.yellow(`tokenIn: ${tokenIn}`));
  console.log(chalk.yellow(`tokenOut: ${tokenOut}`));
  console.log(chalk.yellow(`data.recipient: ${data.recipient}`));
  console.log(chalk.yellow(`data.gasLimit: ${data.gasLimit}`));
  console.log(chalk.yellow(`data.gasPrice: ${ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')}`));
  
  const tx = await buyTokenTx(amountIn, amountOutMin);

  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);
  
  });
}

run();

const PORT = 5001;

app.listen(PORT, (console.log(chalk.yellow(`Listening for Liquidity Addition to token ${data.to_PURCHASE}`))));