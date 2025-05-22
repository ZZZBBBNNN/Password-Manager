# Password Manager

<p>
  <!-- iOS -->
  <a href="https://itunes.apple.com/app/apple-store/id982107779">
    <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  </a>
  <!-- Android -->
  <a href="https://play.google.com/store/apps/details?id=host.exp.exponent&referrer=blankexample">
    <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  </a>
  <!-- Web -->
  <a href="https://docs.expo.dev/workflow/web/">
    <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
  </a>
</p>


# Project Setup Guide

This project includes a backend server powered by Docker and a frontend application built with Node.js.

---

## 📦 Server Setup

1. Open a terminal and navigate to the `server` directory:

    ```bash
    cd server
    ```

2. Start the server:

    ```bash
    docker-compose up -d
    ```

    Or start with rebuild:

    ```bash
    docker-compose up -d --build
    ```

3. View server logs:

    ```bash
    docker-compose logs app
    ```

    Or follow logs in real-time:

    ```bash
    docker-compose logs -f app
    ```

4. Test server health status:

    ```bash
    curl http://localhost:3000/health
    ```

5. Stop the server:

    ```bash
    docker-compose down
    ```

---

## 💻 Frontend Setup

1.change config.js:
    
    ```bash
    cmd check your ipaddress
    cd component
    change API_BASE_URL : 'http://192.168.0.234:3000',  
    ```

2. Open another terminal and navigate to the `component` directory:

    ```bash
    cd component
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Start the frontend application:

    ```bash
    npm start
    ```

---

## ✅ Requirements

- Docker and Docker Compose installed
- Node.js and npm installed

