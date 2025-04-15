# Universal Accounts Quickstart

A starter repository demonstrating how to integrate Particle Network's Universal Accounts into a Next.js application. This project showcases a simple implementation of Web3 authentication using Particle Connect.

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-username/universal-accounts-quickstart.git
cd universal-accounts-quickstart/ua-quickstart
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Create a `.env` file in the `ua-quickstart` directory with the following variables:

```env
NEXT_PUBLIC_PROJECT_ID=your_particle_project_id
NEXT_PUBLIC_CLIENT_KEY=your_particle_client_key
NEXT_PUBLIC_APP_ID=your_particle_app_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id  # Optional
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Check the Universal Accounts Quickstart on the [Particle Docs](https://particle.network/docs/) to have a full rundown of the implementation.