const ARC_CHAIN_ID = '0x4cef52'

export async function ensureArcTestnet(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum
  if (!eth) throw new Error('No wallet found. Please install MetaMask or Rabby.')

  const currentChain = await eth.request({ method: 'eth_chainId' }) as string
  if (currentChain.toLowerCase() === ARC_CHAIN_ID) return

  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_ID }] })
  } catch (e: unknown) {
    const err = e as { code?: number }
    if (err.code === 4902 || err.code === -32603) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: ARC_CHAIN_ID,
          chainName: 'Arc Testnet',
          nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
          rpcUrls: ['https://rpc.testnet.arc.network'],
          blockExplorerUrls: ['https://testnet.arcscan.app'],
        }],
      })
      // After adding, explicitly switch to it
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_ID }] })
      } catch { /* ignore */ }
    } else {
      throw e
    }
  }

  // Poll up to 15s — case-insensitive
  for (let i = 0; i < 60; i++) {
    const chain = await eth.request({ method: 'eth_chainId' }) as string
    if (chain.toLowerCase() === ARC_CHAIN_ID) return
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('Chain switch timed out. Please switch to Arc Testnet manually in your wallet.')
}
