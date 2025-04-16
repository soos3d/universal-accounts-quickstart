# Universal Accounts Quickstart

This starter project demonstrates how to integrate Particle Network’s Universal Accounts into a Next.js app. It includes a basic Web3 authentication flow using Particle Auth.

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/soos3d/universal-accounts-quickstart.git
cd ua-quickstart
```


2. Install dependencies

```bash
npm install
# or
yarn
```


> ⚠️ The Universal Accounts SDK is currently private. Contact the Particle Network team to request access.

3. Set up environment variables

Create a .env file in the ua-quickstart directory and add the following:

```bash
NEXT_PUBLIC_PROJECT_ID=""
NEXT_PUBLIC_CLIENT_KEY=""
NEXT_PUBLIC_APP_ID=""
NEXT_PUBLIC_UA_PROJECT_ID=""
```


You can find these values in your [Particle Dashboard](https://dashboard.particle.network/) when setting up Particle Auth. Remember that this is only an example and you can use the SDK with any EOA-based provider or signer.

> Contact the Particle Team to request access a Universal Accounts project ID.

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

## Additional Resources

For a full walkthrough of the implementation, refer to the [Universal Accounts Quickstart](https://uasdev.mintlify.app/universal-accounts/cha/web-quickstart) Guide on Particle Docs.
