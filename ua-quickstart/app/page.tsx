"use client";

import {
  ConnectButton,
  useAccount,
  useDisconnect,
  useWallets,
} from "@particle-network/connectkit";
import {
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  IAssetsResponse,
  UniversalAccount,
} from "@GDdark/universal-account";
import { getBytes, Interface, parseEther, hexlify, toBeHex } from "ethers";
import { useEffect, useState } from "react";

/**
 * Home Component - Universal Accounts Tutorial
 *
 * This component demonstrates the basic setup and usage of Particle Network's Universal Accounts.
 * Universal Accounts provide a unified way to manage accounts across different blockchains
 * (like EVM and Solana) through a single interface.
 *
 * Key concepts demonstrated:
 * 1. Connecting with Particle Auth
 * 2. Initializing a Universal Account
 * 3. Retrieving smart account addresses for different chains
 */
export default function Home() {
  // Get connection state from Particle Auth
  const { address, isConnected } = useAccount();
  const disconnect = useDisconnect();

  const [primaryWallet] = useWallets();
  const walletClient = primaryWallet?.getWalletClient();

  const [transactionUrl, setTransactionUrl] = useState("");
  const [transactionSent, setTransactionSent] = useState(false);
  const [signedMessage, setSignedMessage] = useState("");

  // Store the Universal Account instance
  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);

  // Store account addresses across different chains
  const [accountInfo, setAccountInfo] = useState({
    ownerAddress: "",
    evmSmartAccount: "",
    solanaSmartAccount: "",
  });

  // Store primary assets
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(
    null
  );

  /**
   * Step 1: Initialize UniversalAccount instance when user connects
   *
   * When a user connects their wallet through Particle Auth, we create a new
   * Universal Account instance. This instance serves as our main interface
   * for interacting with the user's accounts across different chains.
   *
   * Key parameters:
   * - projectId: Your Particle project ID
   * - ownerAddress: The user's EOA (Externally Owned Account) address
   * - tradeConfig: Configuration for cross-chain transactions
   */
  useEffect(() => {
    if (isConnected && address) {
      const ua = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_UA_PROJECT_ID || "",
        ownerAddress: address,
        tradeConfig: {
          // if this is not set, will use auto slippage
          slippageBps: 100, // 100 means 1%, max is 10000
          // use parti to pay fee
          universalGas: true,
        },
      });
      console.log("UniversalAccount initialized:", ua);
      setUniversalAccount(ua);
    } else {
      setUniversalAccount(null);
    }
  }, [isConnected, address]);

  /**
   * Step 2: Fetch Universal Account Addresses
   *
   * Once we have a Universal Account instance, we can retrieve the smart contract
   * wallet addresses for different chains. These smart contract wallets are what
   * make Universal Accounts "universal" - they provide a consistent interface
   * across different blockchain networks.
   *
   * We fetch:
   * - Owner EOA: The user's main Particle Auth address
   * - EVM Smart Account: The smart contract wallet for EVM chains
   * - Solana Smart Account: The smart contract wallet for Solana
   */
  useEffect(() => {
    const fetchSmartAccountAddresses = async () => {
      if (!universalAccount || !address) return;

      try {
        const smartAccountOptions =
          await universalAccount.getSmartAccountOptions();
        setAccountInfo({
          ownerAddress: address,
          evmSmartAccount: smartAccountOptions.smartAccountAddress || "",
          solanaSmartAccount:
            smartAccountOptions.solanaSmartAccountAddress || "",
        });
        console.log("Smart Account Options:", smartAccountOptions);
      } catch (error) {
        console.error("Error fetching smart account addresses:", error);
      }
    };

    fetchSmartAccountAddresses();
  }, [universalAccount, address]);

  /**
   * Fetch Universal Account balances.
   * This effect demonstrates getPrimaryAssets():
   * Returns a JSON object containing all primary assets held on supported chains,
   * including native tokens and major assets like USDC, USDT, etc.
   */
  useEffect(() => {
    const fetchPrimaryAssets = async () => {
      if (!universalAccount || !address) return;

      try {
        const primaryAssets = await universalAccount.getPrimaryAssets();
        // console.log("Primary Assets:", JSON.stringify(primaryAssets, null, 2));
        setPrimaryAssets(primaryAssets);
      } catch (error) {
        console.error("Error fetching primary assets:", error);
      }
    };

    fetchPrimaryAssets();
  }, [universalAccount, address]);

  /**
   * Handles user logout.
   */
  const handleDisconnect = async () => {
    if (isConnected) {
      await disconnect.disconnectAsync();
    }
  };

  /**
   * Handles signing a simple message
   */
  const handleSignMessage = async () => {
    if (!walletClient || !isConnected) return;

    try {
      const message = "Hello from Particle Network!";
      console.log("Signing message:", message);

      const signature = await walletClient.signMessage({
        message,
        account: address as `0x${string}`,
      });

      console.log("Message signature:", signature);
      setSignedMessage(signature);
    } catch (error) {
      console.error("Message signing error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      setSignedMessage("");
    }
  };

  /**
   * Handles the custom abstracted transaction
   */
  const handleTransaction = async () => {
    if (!universalAccount || !isConnected) return;

    console.log("Initiating abstracted transaction...");
    console.log("Connected address:", address);
    console.log("Wallet client:", walletClient);
    const contractAddress = "0x14dcD77D7C9DA51b83c9F0383a995c40432a4578";
    const interf = new Interface(["function checkIn() public payable"]);
    const transaction = await universalAccount.createUniversalTransaction({
      chainId: CHAIN_ID.BASE_MAINNET,
      // expect you need 0.0000001 ETH on base mainnet
      // if your money(USDC, USDT, SOL, etc.) is on other chain, will convert to ETH on base mainnet
      expectTokens: [
        {
          type: SUPPORTED_TOKEN_TYPE.USDC,
          amount: "0.01",
        },
      ],
      transactions: [
        {
          to: contractAddress,
          data: interf.encodeFunctionData("checkIn"),
          value: toBeHex(parseEther("0.01")),
        },
      ],
    });

    console.log("Transaction details:", {
      rootHash: transaction.rootHash,
      transactions: transaction.transactions,
      expectTokens: transaction.expectTokens,
    });

    try {
      // Sign the transaction using the connected wallet
      const messageToSign = hexlify(getBytes(transaction.rootHash));
      console.log("Message to sign (hex):", messageToSign);
      console.log("Message to sign (bytes):", getBytes(transaction.rootHash));

      const signature = await walletClient?.signMessage({
        message: messageToSign,
        account: address as `0x${string}`,
      });

      console.log("Signature result:", signature);

      // Send the signed transaction through Universal Account
      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature
      );

      console.log("Send transaction result:", sendResult);

      //console.log("sendResult", sendResult);
      setTransactionUrl(
        `https://universalx.app/activity/details?id=${sendResult.transactionId}`
      );
      setTransactionSent(true);
    } catch (error) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      setTransactionSent(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-8xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">
            Universal Accounts Quickstart
          </h1>
          <p className="text-lg text-gray-300 mt-2">Universal Accounts Demo</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          {!isConnected ? (
            <div className="flex items-center justify-center py-8">
              <ConnectButton label="Login" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:space-x-8 lg:space-y-0 space-y-6">
              {/* Left Column - Connected EOA */}
              <div className="lg:w-1/3">
                <button
                  onClick={handleDisconnect}
                  className="mb-6 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Disconnect
                </button>
                <h2 className="text-xl font-semibold mb-2">Connected EOA</h2>
                <p className="text-sm text-gray-400 mb-2">Owner Address</p>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="font-mono text-sm text-blue-400 break-all">
                    {address}
                  </p>
                </div>
              </div>

              {/* Middle Column - Universal Account Addresses */}
              <div className="lg:w-1/3">
                <h2 className="text-xl font-semibold mb-4">
                  Universal Account Addresses
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">
                      EVM Universal Account
                    </h3>
                    <p className="font-mono text-sm text-blue-400 break-all">
                      {accountInfo.evmSmartAccount || "Loading..."}
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">
                      Solana Universal Account
                    </h3>
                    <p className="font-mono text-sm text-blue-400 break-all">
                      {accountInfo.solanaSmartAccount || "Loading..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Universal Balance and Transaction */}
              <div className="lg:w-1/3 space-y-4">
                <div className="bg-gray-700 p-6 rounded-lg flex flex-col justify-center items-center">
                  <h3 className="text-xl font-semibold mb-4">
                    Universal Balance
                  </h3>
                  <p className="text-3xl font-bold text-green-400">
                    ${primaryAssets?.totalAmountInUSD || "0.00"}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Cross-Chain Transaction Section */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      Cross-Chain Transaction
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 text-center">
                      Send a custom abstracted transaction. Destination is on
                      Base, the source is any primary token you hold on any
                      chain
                    </p>
                    <button
                      onClick={handleTransaction}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isConnected || !universalAccount}
                    >
                      Initiate Transaction
                    </button>
                    {transactionSent && (
                      <p className="text-sm text-gray-300 mt-4 text-center">
                        Sending...
                      </p>
                    )}
                    {transactionUrl && (
                      <a
                        href={transactionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-300 mt-4 text-center block hover:text-blue-400"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>

                  {/* Message Signing Section */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      Sign Message
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 text-center">
                      Sign a simple message using your connected wallet
                    </p>
                    <button
                      onClick={handleSignMessage}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isConnected}
                    >
                      Sign Message
                    </button>
                    {signedMessage && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-300 mb-2">Signature:</p>
                        <p className="text-xs font-mono bg-gray-800 p-3 rounded break-all text-blue-400">
                          {signedMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
