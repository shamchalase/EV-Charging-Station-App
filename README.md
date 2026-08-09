# ⚡ VoltCharge - EV Charging Station & Smart Network App

[![React Native](https://img.shields.io/badge/React_Native-0.72.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_49-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Navigation](https://img.shields.io/badge/React_Navigation-v6-6B52AE?style=for-the-badge&logo=react)](https://reactnavigation.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-05B66B.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A modern, full-featured **Electric Vehicle (EV) Charging Station Finder and Slot Reservation Mobile Application** built with **React Native** and **Expo**. 

VoltCharge connects EV drivers to nearby charging hubs across major networks (**Tesla Superchargers, Tata Power EZ Charge, Mahindra Electric, MG ChargePoint, and Shell Recharge**), offering real-time port availability, instant slot booking, energy cost estimators, and a live charging session simulator.

---

## 🌟 Key Features

### 🔐 1. Sleek EV Driver Authentication
- Modern dark/light glassmorphism UI with high-voltage emerald styling.
- Form inputs for Email/Username & Password with secure visibility toggle.
- **1-Click Quick Demo Login** for instant access without manual typing.
- Connected Driver & Vehicle status preview.

### 🗺️ 2. Smart Hub Exploration & Live Search
- **Instant Search**: Filter hubs dynamically by station name, address, city, or brand.
- **Brand & Network Filters**: Seamlessly toggle between **Tesla**, **Tata Power**, **Mahindra**, **MG**, and **All Stations**.
- **Speed & Availability Badges**: Filter by **60kW+ DC Fast Chargers** and **Available Now**.
- **Connected EV Telemetry**: Real-time connected vehicle banner showing battery percentage (`78%`), remaining range (`284 km`), and max DC charging speed (`50 kW`).

### ⚡ 3. Detailed Station Specs & Dynamic Routing
- **Dynamic Station Profiles**: High-resolution cover images, live operating status (`Open 24/7`), total ports vs free ports (`6/8 Available`).
- **Interactive Port Selector**: View and select individual charging bays (e.g. `Port 01: 250 kW CCS-2 / NACS`, `Port 05: 150 kW Fast DC`, `Port 07: 22 kW AC Type-2`).
- **Duration & Energy Estimator**: Choose slot duration (`15m`, `30m`, `45m`, `60m`) with instant projections for energy delivered (`+25 kWh`), added range (`+175 km`), and estimated cost (`₹450`).
- **Amenities Grid**: Café & Lounge, Clean Restrooms, High-Speed Wi-Fi, 24/7 Security, and EV Diagnostics.
- **Directions & Share**: Quick button to open navigation and share hub details with friends.

### 🎟️ 4. Digital QR Booking Pass
- Generates a verified digital reservation pass with custom booking reference code (`VC-XXXXXX`).
- Station address, reserved bay number, vehicle model, and slot duration.
- Visual QR code for contactless check-in at charger terminals.

### 🔋 5. Live Charging Session Simulator
- Interactive charging mode with animated battery percentage dial (`78% ➔ 100%`).
- Real-time telemetry feed: live kW delivery, delivered energy (`kWh`), elapsed time (`s`), and running session cost in `₹`.
- Instant session completion alert and receipt summary.

### 👤 6. Driver Profile & Eco Impact
- View wallet balance (`₹1,450`), total kWh charged (`218.4 kWh`), and lifetime CO₂ emissions offset (`136.8 kg`).

---

## 📱 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (v0.72.3)
- **Tooling & Runtime**: [Expo](https://expo.dev/) (SDK 49)
- **Navigation**: [@react-navigation/native](https://reactnavigation.org/) & [@react-navigation/stack](https://reactnavigation.org/docs/stack-navigator/) (v6)
- **Icons**: [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons, MaterialCommunityIcons, FontAwesome5)
- **Safe Area**: [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- **Styling**: Vanilla React Native StyleSheet with custom Design Tokens & Theme System

---

## 📂 Project Structure

```
EV-Charging-Station-App/
├── App.js                      # Root Navigation Container & Stack Configuration
├── app.json                    # Expo Project Configuration & App Metadata
├── babel.config.js             # Babel Compiler Config
├── package.json                # Project Dependencies & Scripts
│
├── assets/                     # App Icons, Splash Screens & Station Photography
│   ├── adaptive-icon.png
│   ├── charginStationTesla.jpeg
│   ├── chargingStationMahindra.jpeg
│   ├── chargingStationMorris.jpeg
│   ├── chargingStationTata.jpeg
│   └── locationIcon.png
│
├── Components/                 # Reusable UI Components & Design System
│   ├── card.js                 # Premium EV Station Card Component
│   ├── data.js                 # Realistic EV Hub Dataset, Ports, & Driver Profile
│   └── theme.js                # Design Tokens (Colors, Typography, Shadows, Radii)
│
└── Screens/                    # Application Screens
    ├── Login.js                # Driver Authentication & Demo Access Screen
    ├── Home.js                 # Hub Discovery, Search, Filters & Vehicle Banner
    └── IndividualPage.js       # Station Details, Port Picker, QR Pass & Simulator
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- [Expo Go App](https://expo.dev/client) on iOS or Android (or Android Studio / Xcode simulator)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/arnavgoel18/EV-Charging-Station-App.git
   cd EV-Charging-Station-App
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on Device or Simulator**:
   - Scan the terminal QR code with **Expo Go** (Android) or **Camera App** (iOS).
   - Press `a` in terminal to run on Android Emulator.
   - Press `i` in terminal to run on iOS Simulator.
   - Press `w` in terminal to run in Web Browser.

---

## 🛠️ Key Fixes & Improvements in this Release

- 🐞 **Fixed Invalid Import**: Resolved broken `import { ..., A }` from `react-native` in `Home.js`.
- 🧹 **Removed Dead Code**: Deleted temporary artifacts (`tempCodeRunnerFile.js`) and cleaned up Stack Navigation.
- 🎨 **Resolved Blank Screen**: Eliminated empty initial state (`cardsToMap = []`), ensuring all nearby stations render immediately upon app launch.
- 🔄 **Fixed Dynamic Data Flow**: Implemented parameter passing from `Home` to `IndividualPage` (`route.params.station`), replacing static hardcoded Tesla data with dynamic multi-brand hub data.
- 🔋 **Live Interactivity**: Added port selection, session cost calculation, digital QR ticket generation, and charging simulation.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
