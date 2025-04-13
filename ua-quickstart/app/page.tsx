"use client";

import { ConnectButton, useAccount } from "@particle-network/connectkit";

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">
          Universal Accounts Quickstart
        </h1>

        <div className="mb-12 space-y-4">
          <p className="text-lg text-gray-300">
            This is a quickstart for adding Universal Accounts to a basic
            Particle Connect project.
          </p>
          <p className="text-gray-400">
            Use Particle Connect as login method and signer.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          {!isConnected ? (
            <div className="py-4">
              <ConnectButton label="Log in" />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Connected EOA</h2>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="font-mono text-sm text-blue-400 break-all">
                  {address}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
