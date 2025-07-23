# Universal Accounts Quickstart

This starter project demonstrates how to integrate Particle Network’s Universal Accounts into a Next.js app. It includes a basic Web3 authentication flow using Particle Auth.

For a full walkthrough of the implementation, refer to the [Universal Accounts Quickstart](https://developers.particle.network/universal-accounts/cha/web-quickstart) Guide on Particle Docs.

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/particle-network/universal-accounts-quickstart.git
cd ua-quickstart
```

2. Install dependencies

```bash
npm install
# or
yarn
```

3. Set Up Environment Variables

First, create a project in the [Particle Dashboard](https://dashboard.particle.network/) to get the required credentials.

> The same project keys are used for both Particle Auth and Universal Accounts.

In this example, we use Particle Auth for user authentication. However, you can use any EOA-compatible provider or signer. Regardless of your choice, you’ll still need to create a project in the Particle Dashboard and initialize Universal Accounts using the project credentials.

Create a .env file in the root of the ua-quickstart directory and add the following variables:

```bash
NEXT_PUBLIC_PROJECT_ID=""
NEXT_PUBLIC_CLIENT_KEY=""
NEXT_PUBLIC_APP_ID=""
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

## Additional Resources

Find the full documentation for [Universal Accounts](https://uasdev.mintlify.app/universal-accounts/cha/overview) on Particle Docs.
