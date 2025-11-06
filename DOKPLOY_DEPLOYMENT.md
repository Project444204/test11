# 3D Hand - Dokploy Deployment Guide

## 📋 Overview

This is a Next.js application with Three.js and React Three Fiber for 3D hand visualization. This guide will help you deploy it to Dokploy using Docker Compose.

## 🚀 Deployment Steps

### 1. In Dokploy Dashboard:
- Create a new **Project**
- Choose type: **Docker Compose**
- Enter your Git repository URL
- Dokploy will handle everything automatically!

### 2. Environment Variables (Optional):

If you need to configure environment variables, add them in Dokploy dashboard:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. Automatic Setup:
- ✅ Dependencies will be installed automatically
- ✅ Application will be built automatically
- ✅ Dokploy handles routing automatically
- ✅ SSL will be configured automatically by Dokploy

## 📁 Files Structure

```
3d-hand/
├── Dockerfile                 ✅ Created
├── docker-compose.yml         ✅ Created
├── .dockerignore              ✅ Created
├── next.config.ts             ✅ Updated (standalone output)
└── DOKPLOY_DEPLOYMENT.md      ✅ This file
```

## ⚠️ Important Notes

1. **Port Configuration**: Port 3000 is exposed internally only. Dokploy handles external routing automatically - **DO NOT** configure ports in docker-compose.yml for Dokploy deployments

2. **Next.js Standalone**: The configuration uses Next.js standalone output mode for optimal Docker performance

3. **Build Process**: The Dockerfile uses multi-stage build for optimal image size:
   - Stage 1: Install dependencies
   - Stage 2: Build the application
   - Stage 3: Production runtime

4. **Node Version**: Uses Node.js 20 Alpine for smaller image size

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Ensure `next.config.ts` has `output: 'standalone'`

### Application Not Starting
- Check Dokploy logs for errors
- Verify that `.next` folder was built correctly
- Ensure `package.json` has correct build scripts

### Port Already Allocated Error
- **Solution**: Remove `ports` section from docker-compose.yml (already done)
- Dokploy handles routing automatically - no need to expose ports manually

### Out of Memory During Build
- Increase Dokploy server memory allocation
- Or use a larger build instance

## 📝 Post-Deployment Checklist

- [ ] Application builds successfully
- [ ] Application starts without errors
- [ ] Domain configured with SSL in Dokploy
- [ ] Application accessible via domain
- [ ] 3D models loading correctly

## 🎨 Features

- Next.js 15.5.2
- React 19.1.0
- Three.js 0.180.0
- React Three Fiber
- TypeScript support
- Tailwind CSS 4

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Dokploy Documentation](https://dokploy.com/docs)

