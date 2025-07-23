"use client";

import { useConnect, useEthereum } from "@particle-network/authkit";
import {
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  IAssetsResponse,
  UniversalAccount,
} from "@particle-network/universal-account-sdk";
import { Interface, parseEther, toBeHex } from "ethers";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

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
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Universal Accounts Quickstart</h1>
          <p className={styles.subtitle}>Particle Auth + Universal Accounts</p>
        </div>

        {!connected ? (
          <div className={styles.actionCard}>
            <p className={styles.actionDescription}>
              Login to get started with Universal Accounts
            </p>
            <button onClick={handleLogin} className={styles.actionButton}>
              Login
            </button>
          </div>
        ) : (
          <>
            {/* Connection Status */}
            <div className={styles.connectionStatus}>
              <div className={styles.addressContainer}>
                <h2>Owner Address (EOA)</h2>
                <p className={styles.address}>{address}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className={styles.disconnectButton}
              >
                Disconnect
              </button>
            </div>

            {/* Account Summary */}
            <div className={styles.accountGrid}>
              {/* Smart Accounts */}
              <div className={styles.accountCard}>
                <h2 className={styles.accountTitle}>
                  Universal Account Addresses
                </h2>
                <div>
                  <p className={styles.accountLabel}>EVM</p>
                  <p className={styles.accountAddress}>
                    {accountInfo.evmSmartAccount}
                  </p>
                </div>
                <div>
                  <p className={styles.accountLabel}>Solana</p>
                  <p className={styles.accountAddress}>
                    {accountInfo.solanaSmartAccount}
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div className={styles.balanceCard}>
                <h2 className={styles.balanceTitle}>Universal Balance</h2>
                <h3 className={styles.balanceSubtitle}>
                  Aggregated primary assets from every chain
                </h3>
                <p className={styles.balanceAmount}>
                  ${primaryAssets?.totalAmountInUSD.toFixed(4) || "0.00"}
                </p>
              </div>
            </div>

            {/* Transaction Actions */}
            <div className={styles.accountGrid}>
              <div className={styles.actionCard}>
                <h3 className={styles.actionTitle}>Custom Contract Call</h3>
                <p className={styles.actionDescription}>
                  Send a cross-chain contract call to Base.
                </p>
                <button
                  onClick={handleTransaction}
                  disabled={!universalAccount}
                  className={styles.actionButton}
                >
                  Send Custom Transaction
                </button>
              </div>

              <div className={styles.actionCard}>
                <h3 className={styles.actionTitle}>Transfer Transaction</h3>
                <p className={styles.actionDescription}>
                  Buy $1 USDT on Arbitrum using any token.
                </p>
                <button
                  onClick={handleTransferTransaction}
                  disabled={!universalAccount}
                  className={styles.actionButton}
                >
                  Send Transfer Transaction
                </button>
              </div>
            </div>

            {/* Latest Transaction - Shown Only If Exists */}
            {transactionUrl && (
              <div className={styles.transactionCard}>
                <p className={styles.transactionLabel}>Latest Transaction</p>
                <a
                  href={transactionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.transactionLink}
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
