export async function ensureArcTestnet(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum
  if (!eth) throw new Error('No wallet found. Please install MetaMask.')

  // Check current chain
  const currentChain = await eth.request({ method: 'eth_chainId' }) as string
  if (currentChain === '0x4CE252') return // already on Arc Testnet

  // Request switch
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
  } catch (e: unknown) {
    const err = e as { code?: number }
    if (err.code === 4902 || err.code === -32603) {
      // Chain not added — add it
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4CE252',
          chainName: 'Arc Testnet',
          nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
          rpcUrls: ['https://rpc.testnet.arc.network'],
          blockExplorerUrls: ['https://testnet.arcscan.app'],
        }],
      })
    } else {
      throw e
    }
  }

  // Wait until chain is actually switched (up to 5s)
  for (let i = 0; i < 20; i++) {
    const chain = await eth.request({ method: 'eth_chainId' }) as string
    if (chain === '0x4CE252') return
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('Chain switch timed out. Please switch to Arc Testnet manually in MetaMask.')
}
