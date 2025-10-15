# Troubleshooting Guide

This document provides solutions to common issues you might encounter when working with Shindara Style Hub.

## Installation Issues

### SSL/TLS Errors (ERR_SSL_CIPHER_OPERATION_FAILED)

**Error Message:**
```
npm error code ERR_SSL_CIPHER_OPERATION_FAILED
npm error E02D0000:error:1C800066:Provider routines:ossl_gcm_stream_update:cipher operation failed
```

**Solutions:**

#### Option 1: Use Alternative Package Manager (Recommended)

The easiest solution is to use **Bun** or **Yarn** instead of npm:

**Install with Bun (fastest, works great on Windows):**
```sh
# Install Bun first (if not installed)
# Windows (PowerShell):
powershell -c "irm bun.sh/install.ps1|iex"

# Then install dependencies:
bun install
```

**Install with Yarn:**
```sh
# Install Yarn first (if not installed)
npm install -g yarn

# Then install dependencies:
yarn install
```

#### Option 2: Modify .npmrc Configuration

1. Open the `.npmrc` file in the project root
2. Find the line `# strict-ssl=false`
3. Remove the `#` to uncomment it:
   ```
   strict-ssl=false
   ```
4. Save the file and run:
   ```sh
   npm cache clean --force
   npm install
   ```

#### Option 3: Update npm and Node.js

Sometimes updating npm and Node.js can resolve SSL issues:

```sh
# Update npm to latest version
npm install -g npm@latest

# Or update Node.js to the latest LTS version from https://nodejs.org
```

#### Option 4: Clear npm Cache

```sh
npm cache clean --force
npm cache verify
npm install
```

#### Option 5: Use a VPN or Different Network

If you're behind a corporate firewall or restrictive network:
- Try using a VPN
- Try a different internet connection (mobile hotspot, different WiFi)
- Check if your antivirus/firewall is blocking npm

### Permission Errors (EPERM) on Windows

**Error Message:**
```
npm warn cleanup Failed to remove some directories
Error: EPERM: operation not permitted, rmdir 'C:\...\node_modules\...'
```

**Solutions:**

#### Solution 1: Close All Applications
1. Close **all** instances of:
   - VS Code or any code editor
   - Terminal/Command Prompt/PowerShell windows
   - File Explorer windows in the project directory
   - Any running development servers
2. Wait a few seconds
3. Open a fresh terminal and run `npm install`

#### Solution 2: Run as Administrator
1. Close all applications accessing the project
2. Right-click on **Command Prompt** or **PowerShell**
3. Select **"Run as Administrator"**
4. Navigate to your project:
   ```sh
   cd "C:\path\to\shindara-style-hub"
   ```
5. Run:
   ```sh
   npm install
   ```

#### Solution 3: Manual Cleanup
1. Close all applications
2. Delete the `node_modules` folder manually:
   - Open File Explorer
   - Navigate to the project folder
   - Delete the `node_modules` folder (this might take a while)
   - If deletion fails, restart your computer and try again
3. Run:
   ```sh
   npm cache clean --force
   npm install
   ```

#### Solution 4: Use Robocopy (Windows)
If manual deletion fails:
```cmd
# Run in Command Prompt as Administrator
robocopy node_modules null /MIR /R:1 /W:1
rmdir /s /q node_modules
npm install
```

#### Solution 5: Disable Windows Defender/Antivirus Temporarily
Sometimes antivirus software locks files in `node_modules`:
1. Temporarily disable Windows Defender or your antivirus
2. Delete `node_modules` and run `npm install`
3. Re-enable your antivirus
4. Add the project folder to the antivirus exclusion list

## Build Issues

### Build Fails or Produces Errors

**Check for Missing Dependencies:**
```sh
npm install
npm run build
```

**Clear Build Cache:**
```sh
# Remove dist folder
rm -rf dist  # Linux/Mac
rmdir /s /q dist  # Windows CMD

# Rebuild
npm run build
```

### Development Server Won't Start

**Port Already in Use:**
```sh
# The app uses port 8080 by default
# Check if another process is using it
netstat -ano | findstr :8080  # Windows
lsof -i :8080  # Mac/Linux

# Kill the process or change the port in vite.config.ts
```

## Development Issues

### Hot Reload Not Working

1. Check that your development server is running: `npm run dev`
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Restart the development server
4. Check if you have modified `vite.config.ts` incorrectly

### TypeScript Errors

**Update TypeScript:**
```sh
npm install -D typescript@latest
```

**Clear TypeScript Cache:**
```sh
# Remove tsconfig.tsbuildinfo if it exists
rm -f tsconfig.tsbuildinfo
```

## General Tips

### Best Practices for Windows Users

1. **Use Bun instead of npm** - It's faster and has better Windows compatibility
2. **Always close editors before running npm install**
3. **Run terminals as Administrator when needed**
4. **Keep your antivirus exclusions updated**
5. **Use shorter path names** - Windows has a 260-character path limit

### Network Issues

If you experience slow downloads or timeouts:

1. **Increase timeout values** - Already configured in `.npmrc`
2. **Use a mirror registry:**
   ```sh
   # Add to .npmrc
   registry=https://registry.npmmirror.com/
   ```
3. **Check your internet connection stability**
4. **Try during off-peak hours**

### Getting Help

If none of these solutions work:

1. Check the [GitHub Issues](https://github.com/Donsirmuel/shindara-style-hub/issues)
2. Create a new issue with:
   - Your operating system and version
   - Node.js and npm versions (`node --version`, `npm --version`)
   - Complete error message
   - Steps you've already tried
3. Include the output of:
   ```sh
   npm --version
   node --version
   npm config list
   ```

## Quick Command Reference

```sh
# Install dependencies
npm install          # or: bun install / yarn install

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules  # or: rmdir /s /q node_modules (Windows)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Bun Documentation](https://bun.sh/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Node.js Downloads](https://nodejs.org/)
