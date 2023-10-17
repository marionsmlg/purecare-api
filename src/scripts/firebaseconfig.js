import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.PROJECT_ID,
  storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: `G-${process.env.MEASUREMENT_ID}`,
};

export const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
