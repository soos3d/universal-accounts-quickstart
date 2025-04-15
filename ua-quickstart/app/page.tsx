"use client";

import { useConnect, useEthereum } from "@particle-network/authkit";
import { arbitrum } from "@particle-network/authkit/chains";
import {
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  IAssetsResponse,
  UniversalAccount,
} from "@GDdark/universal-account";
import { Interface, parseEther, toBeHex } from "ethers";
import { useEffect, useState } from "react";

export default function Home() {
  const { connect, disconnect, connected } = useConnect();
  const { address, provider } = useEthereum();

  const [transactionUrl, setTransactionUrl] = useState("");

  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState({
    ownerAddress: "",
    evmSmartAccount: "",
    solanaSmartAccount: "",
  });
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(
    null
  );

  // === LOGIN LOGIC ===
  const handleLogin = () => {
    if (!connected) connect({});
  };

  const handleDisconnect = () => {
    if (connected) disconnect();
  };

  // === Initialize UniversalAccount ===
  useEffect(() => {
    if (connected && address) {
      const ua = new UniversalAccount({
        projectId: process.env.NEXT_PUBLIC_UA_PROJECT_ID || "",
        ownerAddress: address,
        tradeConfig: {
          slippageBps: 100,
          universalGas: true,
        },
      });
      console.log("UniversalAccount initialized:", ua);
      setUniversalAccount(ua);
    } else {
      setUniversalAccount(null);
    }
  }, [connected, address]);

  // === Fetch Smart Account Addresses ===
  useEffect(() => {
    if (!universalAccount || !address) return;

    const fetchSmartAccountAddresses = async () => {
      try {
        const options = await universalAccount.getSmartAccountOptions();
        setAccountInfo({
          ownerAddress: address,
          evmSmartAccount: options.smartAccountAddress || "",
          solanaSmartAccount: options.solanaSmartAccountAddress || "",
        });
        console.log("Smart Account Options:", options);
      } catch (err) {
        console.error("Error fetching smart account addresses:", err);
      }
    };

    fetchSmartAccountAddresses();
  }, [universalAccount, address]);

  // === Fetch Primary Assets ===
  useEffect(() => {
    if (!universalAccount || !address) return;

    const fetchPrimaryAssets = async () => {
      try {
        const assets = await universalAccount.getPrimaryAssets();
        setPrimaryAssets(assets);
      } catch (err) {
        console.error("Error fetching primary assets:", err);
      }
    };

    fetchPrimaryAssets();
  }, [universalAccount, address]);

  // === Send Transaction ===
  const handleTransaction = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }

    try {
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
    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  // === Send Transfer Transaction ===
  const handleTransferTransaction = async () => {
    if (!universalAccount || !connected || !provider) {
      console.error("Transaction prerequisites not met");
      return;
    }

    try {
      const transaction = await universalAccount.createTransferTransaction({
        token: {
          chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
          address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        }, // USDT on Arbitrum
        amount: "0.1",
        rpcUrl: arbitrum.rpcUrls.default.http[0], // RPC URL for the target chain
        receiver: "0x5C1885c0C6A738bAdAfE4dD811A26B546431aD89",
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
    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white font-sans">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-400">
            Universal Accounts Quickstart
          </h1>
          <p className="text-lg text-gray-400 mt-1">
            Particle Auth + Universal Accounts
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-900 p-6 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow">
          <div>
            <h2 className="text-lg font-semibold">Owner Address (EOA)</h2>
            <p className="text-sm text-blue-400 font-mono break-all">
              {address}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="self-start sm:self-center bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            Disconnect
          </button>
        </div>

        {/* Account Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Smart Accounts */}
          <div className="bg-gray-900 p-6 rounded-lg space-y-4 shadow">
            <h2 className="text-xl font-semibold">
              Universal Account Addresses
            </h2>
            <div>
              <p className="text-sm text-gray-400">EVM</p>
              <p className="text-sm text-blue-400 font-mono break-all">
                {accountInfo.evmSmartAccount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Solana</p>
              <p className="text-sm text-blue-400 font-mono break-all">
                {accountInfo.solanaSmartAccount}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gray-900 p-6 rounded-lg shadow flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold mb-2">Universal Balance</h2>
            <h3 className="text-xs mb-2 text-gray-400">
              Aggregated primary assets from every chain
            </h3>
            <p className="text-3xl font-bold text-green-400">
              ${primaryAssets?.totalAmountInUSD.toFixed(4) || "0.00"}
            </p>
          </div>
        </div>

        {/* Transaction Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow text-center space-y-3">
            <h3 className="text-lg font-semibold">Custom Contract Call</h3>
            <p className="text-sm text-gray-400">
              Send a cross-chain contract call to Base.
            </p>
            <button
              onClick={handleTransaction}
              disabled={!connected || !universalAccount}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send Custom Transaction
            </button>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg shadow text-center space-y-3">
            <h3 className="text-lg font-semibold">Transfer Transaction</h3>
            <p className="text-sm text-gray-400">
              Send $0.1 USDT on Arbitrum using any token.
            </p>
            <button
              onClick={handleTransferTransaction}
              disabled={!connected || !universalAccount}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send Transfer Transaction
            </button>
          </div>
        </div>

        {/* Latest Transaction - Shown Only If Exists */}
        {transactionUrl && (
          <div className="bg-gray-900 p-4 rounded-lg text-center shadow">
            <p className="text-sm text-gray-400 mb-2">Latest Transaction</p>
            <a
              href={transactionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline break-all"
            >
              {transactionUrl}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
