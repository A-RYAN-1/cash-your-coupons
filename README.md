# Cash Your Coupons

Cash Your Coupons is a mobile application built using **React Native Expo** that allows users to buy, sell, and exchange unused promo codes and coupons securely. The app leverages **Google Firebase** for backend and database management, while **Tailwind CSS** is used for styling.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Setup](#project-setup)
- [Backend & Database](#backend--database)
- [Frontend (React Native Expo)](#frontend-react-native-expo)
- [Usage](#usage)
- [Contributing](#contributing)
- [Project Demo](#project-demo)

## Tech Stack

This project uses the following technologies:

- **Frontend**: React Native Expo
- **Backend & Database**: Google Firebase

## Project Setup

To set up the project locally, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/A-RYAN-1/cash-your-coupons.git
    cd cash-your-coupons
    ```

2. **Install dependencies**:
   - Recheck once, may vary from version to version
    ```bash
    npm install
    ```

4. **Set up Firebase**:
    - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
    - Enable Firestore Database and Authentication as needed.
    - Obtain the Firebase configuration file (`firebaseConfig.js`) and place it in the project root.

5. **Start the development server**:
    ```bash
    npx expo start
    ```

6. **Run the app on a simulator or physical device**:
   - In emulator device enter this url after running Expo app on it (Metro waiting on exp://192.168.72.253:8081)
   - In physical device, ccan the QR code above with Expo Go (Android) or the Camera app (iOS)

## Backend & Database

The app uses **Google Firebase** as the backend and database service.

### Firebase Features Used:
- **Firestore Database**: Stores coupons, users and transactiosns details, provides gmail login features for authentication.

## Frontend (React Native Expo)

The frontend is built using **React Native Expo**, providing a cross-platform experience for both Android and iOS.

### Key Features:
1. **User Authentication**: Sign up and login using email/password or Google authentication.
2. **Buy, Sell, and Exchange Coupons**: Users can list coupons for sale or exchange.

### Future Scope
1. **Secure Transactions**: Coupons are validated before being sold.
2. **Real-time Notifications**: Users get notified when someone purchases or requests a coupon.
& Many More

### Styling
The app uses **Tailwind CSS** for responsive and modern UI design.

## Usage

1. Start the backend services (Firebase Firestore and Authentication).
2. Run the mobile app using Expo (`npx expo start`).
3. Register or log in to access the platform.
4. List, buy, or exchange coupons securely.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## Project Demo

[https://drive.google.com/file/d/1c3ywBtM5AUz0moGEfjxMTs7bzOrMOA80/view?usp=drive_link](https://drive.google.com/file/d/17VIVAS1M29GQ5aed3kBSksLTQmICN4Jt/view?usp=sharing)
