# Shindara Style Hub

A modern e-commerce platform for Shindara Fashion World - your destination for affordable Nigerian fashion.

## About

Shindara Style Hub is a contemporary fashion e-commerce store offering premium Nigerian fashion at affordable prices. Shop our curated collection of traditional and modern designs for men and women.

## Technologies

This project is built with:

- **Vite** - Fast build tool and development server
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **React Query** - Data fetching and state management
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or bun

### Installation

1. Clone the repository:
```sh
git clone https://github.com/Donsirmuel/shindara-style-hub.git
```

2. Navigate to the project directory:
```sh
cd shindara-style-hub
```

3. Install dependencies:

**Using npm:**
```sh
npm install
```

**Using yarn:**
```sh
yarn install
```

**Using bun (fastest):**
```sh
bun install
```

4. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

### Troubleshooting Installation Errors

For detailed troubleshooting steps, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

If you encounter errors during `npm install`, try these solutions:

#### SSL/TLS Cipher Errors
If you see `ERR_SSL_CIPHER_OPERATION_FAILED` or similar SSL errors:

1. **Clear npm cache:**
   ```sh
   npm cache clean --force
   ```

2. **Try with strict-ssl disabled (Windows users):**
   
   Edit the `.npmrc` file in the project root and uncomment this line:
   ```
   strict-ssl=false
   ```
   
   Then run:
   ```sh
   npm install
   ```

3. **Use alternative package managers:**
   - **Bun** (recommended for Windows): `bun install`
   - **Yarn**: `yarn install`

#### Permission Errors (EPERM) on Windows
If you see `EPERM: operation not permitted` errors:

1. **Close all applications** that might be accessing the `node_modules` folder (VS Code, terminal windows, etc.)

2. **Run as Administrator:**
   - Right-click on your terminal (Command Prompt or PowerShell)
   - Select "Run as Administrator"
   - Navigate to the project directory
   - Run `npm install`

3. **Delete node_modules and try again:**
   ```sh
   # Close all editors and terminals first
   rmdir /s /q node_modules
   npm cache clean --force
   npm install
   ```

4. **Use alternative package manager:**
   ```sh
   # Using bun (often works better on Windows)
   bun install
   ```

#### General Tips
- Ensure you have a stable internet connection
- Try using a VPN if you're behind a restrictive firewall
- Update npm to the latest version: `npm install -g npm@latest`
- Restart your computer and try again

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

Build the project for production:

```sh
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## License

All rights reserved - Shindara Fashion World
