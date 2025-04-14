"use client";

import React from "react";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
// embedded wallet start
import { EntryPosition, wallet } from "@particle-network/connectkit/wallet";
// embedded wallet end
// evm start
import { mainnet } from "@particle-network/connectkit/chains";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";
// evm end

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_APP_ID as string;
const walletConnectProjectId = process.env
  .NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

if (!projectId || !clientKey || !appId) {
  throw new Error("Please configure the Particle project in .env first!");
}

const config = createConfig({
  projectId,
  clientKey,
  appId,
  appearance: {
    //  optional, sort wallet connectors
    connectorsOrder: ["passkey", "social", "wallet"],
    recommendedWallets: [
      { walletId: "metaMask", label: "Recommended" },
      { walletId: "coinbaseWallet", label: "Popular" },
    ],
    language: "en-US",
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: ["google", "apple", "twitter", "github"], // Optional, restricts the types of social logins supported
    }),
    // evm start
    evmWalletConnectors({
      metadata: {
        name: "Universal Accouts Quickstart",
      },
      walletConnectProjectId: walletConnectProjectId,
      multiInjectedProviderDiscovery: true,
    }),

    // evm end
  ],
  plugins: [
    // embedded wallet start
    wallet({
      visible: false,
      entryPosition: EntryPosition.BR,
    }),
    // embedded wallet end
  ],
  chains: [mainnet],
});

// Wrap your application with this component.
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
