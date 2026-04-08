export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'SOL' | 'BTC'

export type CryptoWalletInstructions = {
  btcAddress: string
  ethAddress: string
  usdtTrc20Address: string
  usdtErc20Address: string
  usdtBep20Address: string
  solAddress: string
}

function readEnvAddress(value: string | undefined, fallback: string) {
  const normalized = value?.toString().trim() || ''
  return normalized.length > 0 ? normalized : fallback
}

export function getDefaultCryptoWalletInstructions(): CryptoWalletInstructions {
  return {
    btcAddress: readEnvAddress(
      import.meta.env.VITE_CRYPTO_BTC_ADDRESS?.toString(),
      'bc1q9xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ),
    ethAddress: readEnvAddress(
      import.meta.env.VITE_CRYPTO_ETH_ADDRESS?.toString(),
      '0x83B2dB6C9aE0f1E5C4a2d5B1a9d4E6f8b9C0d1e2',
    ),
    usdtTrc20Address: readEnvAddress(
      import.meta.env.VITE_CRYPTO_USDT_TRC20_ADDRESS?.toString(),
      'TQ7QK1v7n3d8S3qE8P4m4K9r2q8p5y6z7a',
    ),
    usdtErc20Address: readEnvAddress(
      import.meta.env.VITE_CRYPTO_USDT_ERC20_ADDRESS?.toString(),
      '0x83B2dB6C9aE0f1E5C4a2d5B1a9d4E6f8b9C0d1e2',
    ),
    usdtBep20Address: readEnvAddress(
      import.meta.env.VITE_CRYPTO_USDT_BEP20_ADDRESS?.toString(),
      '0x6fC2b1A9D0c3E7f8a2B4c5D6e7F8a9B0c1D2E3f4',
    ),
    solAddress: readEnvAddress(
      import.meta.env.VITE_CRYPTO_SOL_ADDRESS?.toString(),
      '9p9d6QZ7f2rZQ5m5bS8d5oJpQw4KfVb7mL2cT8yXhV4A',
    ),
  }
}

export function getWalletAddressByNetwork(
  network: CryptoNetwork,
  wallets: CryptoWalletInstructions,
) {
  if (network === 'TRC20') {
    return wallets.usdtTrc20Address
  }

  if (network === 'ERC20') {
    return wallets.usdtErc20Address
  }

  if (network === 'BEP20') {
    return wallets.usdtBep20Address
  }

  if (network === 'SOL') {
    return wallets.solAddress
  }

  return wallets.btcAddress
}
