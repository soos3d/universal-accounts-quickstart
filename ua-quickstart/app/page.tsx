"use client";

import {
  ConnectButton,
  useAccount,
  useDisconnect,
} from "@particle-network/connectkit";
import { UniversalAccount, IAssetsResponse } from "@GDdark/universal-account";
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

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">
          Universal Accounts Quickstart
        </h1>

        <div className="mb-8">
          <p className="text-lg text-gray-300">Universal Accounts Demo</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <ConnectButton label="Login" />
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <button
                  onClick={handleDisconnect}
                  className="mt-4 mb-4 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
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

              <div>
                <h2 className="text-xl font-semibold mb-2">
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

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">
                      Universal Balance
                    </h3>
                    <p className="text-2xl font-bold text-green-400">
                      ${primaryAssets?.totalAmountInUSD || "0.00"}
                    </p>
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
