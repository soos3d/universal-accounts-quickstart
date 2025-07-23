"use client";

import { useConnect, useEthereum } from "@particle-network/authkit";
import {
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  type IAssetsResponse,
  UniversalAccount,
} from "@particle-network/universal-account-sdk";
import { Interface, parseEther, toBeHex } from "ethers";
import { useEffect, useState } from "react";

export default function Home() {
  // Particle Auth hooks
  const { connect, disconnect, connected } = useConnect();
  const { address, provider } = useEthereum();

  // Transaction state - stores the URL of the latest transaction
  const [transactionUrl, setTransactionUrl] = useState("");

  // Universal Account instance states
  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);

  // Smart account addresses for different chains
  const [accountInfo, setAccountInfo] = useState({
    ownerAddress: "",
    evmSmartAccount: "", // EVM-based chains (Ethereum, Base, etc)
    solanaSmartAccount: "", // Solana chain
  });

  // Aggregated balance across all chains
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(
    null
  );

  // === Authentication Handlers ===
  const handleLogin = () => {
    if (!connected) connect({});
  };

  const handleDisconnect = () => {
    if (connected) disconnect();
  };

  // === Initialize UniversalAccount ===
  useEffect(() => {
    if (connected && address) {
      // Create new UA instance when user connects
      const ua = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
        projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
        projectAppUuid: process.env.NEXT_PUBLIC_APP_ID!,
        ownerAddress: address,
        // If not set it will use auto-slippage
        tradeConfig: {
          slippageBps: 100, // 1% slippage tolerance
          universalGas: true, // Enable gas abstraction
          //usePrimaryTokens: [SUPPORTED_TOKEN_TYPE.SOL], // Specify token to use as source (only for swaps)
        },
      });
      console.log("UniversalAccount initialized:", ua);
      setUniversalAccount(ua);
    } else {
      // Reset UA when user disconnects
      setUniversalAccount(null);
    }
  }, [connected, address]);

  // === Fetch Smart Account Addresses ===
  useEffect(() => {
    if (!universalAccount || !address) return;
    const fetchSmartAccountAddresses = async () => {
      // Get smart account addresses for both EVM and Solana
      const options = await universalAccount.getSmartAccountOptions();
      setAccountInfo({
        ownerAddress: address, // EOA address
        evmSmartAccount: options.smartAccountAddress || "", // EVM smart account
        solanaSmartAccount: options.solanaSmartAccountAddress || "", // Solana smart account
      });
      console.log("Smart Account Options:", options);
    };
    fetchSmartAccountAddresses();
  }, [universalAccount, address]);

  // === Fetch Primary Assets ===
  useEffect(() => {
    if (!universalAccount || !address) return;
    const fetchPrimaryAssets = async () => {
      // Get aggregated balance across all chains
      // This includes ETH, USDC, USDT, etc. on various chains
      const assets = await universalAccount.getPrimaryAssets();
      setPrimaryAssets(assets);
    };
    fetchPrimaryAssets();
  }, [universalAccount, address]);

  // === Send Cross-chain Transaction ===
  const handleTransaction = async () => {
    // Safety check - all these are required for transactions
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }
    const contractAddress = "0x14dcD77D7C9DA51b83c9F0383a995c40432a4578";
    const interf = new Interface(["function checkIn() public payable"]);
    const transaction = await universalAccount.createUniversalTransaction({
      chainId: CHAIN_ID.BASE_MAINNET,
      // expect you need 0.0000001 ETH on base mainnet
      // if your money(USDC, USDT, SOL, etc.) is on other chain, will convert to ETH on base mainnet
      expectTokens: [
        {
          type: SUPPORTED_TOKEN_TYPE.ETH,
          amount: "0.0000001",
        },
      ],
      transactions: [
        {
          to: contractAddress,
          data: interf.encodeFunctionData("checkIn"),
          value: toBeHex(parseEther("0.0000001")),
        },
      ],
    });
    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );
    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  // === Send USDT Transfer Transaction ===
  const handleTransferTransaction = async () => {
    // Safety check - ensure wallet is connected and UA is initialized
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }
    const transaction = await universalAccount.createBuyTransaction({
      token: {
        chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      }, // USDT on Arbitrum
      amountInUSD: "1",
    });
    const signature = await provider.signMessage(transaction.rootHash);
    const sendResult = await universalAccount.sendTransaction(
      transaction,
      signature
    );
    console.log("Transaction sent:", sendResult);
    setTransactionUrl(
      `https://universalx.app/activity/details?id=${sendResult.transactionId}`
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-200 text-gray-900 p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">
            Universal Accounts Quickstart
          </h1>
          <p className="text-lg text-gray-600">
            Particle Auth + Universal Accounts
          </p>
        </div>

        {!connected ? (
          <div className="w-full max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Get Started
              </h2>
              <p className="text-gray-600 mt-2">
                Login to get started with Universal Accounts
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleLogin}
                className="w-full max-w-xs bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Login
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Connection Status */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-700">
                  Owner Address (EOA)
                </h2>
                <p className="font-mono text-sm text-purple-700 break-all">
                  {address}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Smart Accounts */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Universal Account Addresses
                  </h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">EVM</p>
                    <p className="font-mono text-sm text-purple-700 break-all">
                      {accountInfo.evmSmartAccount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Solana</p>
                    <p className="font-mono text-sm text-purple-700 break-all">
                      {accountInfo.solanaSmartAccount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6 flex flex-col justify-between">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Universal Balance
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Aggregated{" "}
                    <a
                      className="text-purple-600 hover:underline"
                      href="https://developers.particle.network/universal-accounts/cha/chains#primary-assets"
                    >
                      primary assets
                    </a>{" "}
                    from every chain
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-600">
                    ${primaryAssets?.totalAmountInUSD.toFixed(4) || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Custom Contract Call
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Send a cross-chain contract call to Base.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleTransaction}
                    disabled={!universalAccount}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Custom Transaction
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Swap Transaction
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Buy $1 USDT on Arbitrum using any token.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleTransferTransaction}
                    disabled={!universalAccount}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy USDT
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Demo Repo
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Explore the code behind this demo on GitHub.
                  </p>
                </div>
                <div>
                  <a
                    href="https://github.com/particle-network/universal-accounts-quickstart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>

            {/* Latest Transaction - Shown Only If Exists */}
            {transactionUrl && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600 mb-2">Latest Transaction</p>
                <a
                  href={transactionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:underline break-all"
                >
                  {transactionUrl}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
