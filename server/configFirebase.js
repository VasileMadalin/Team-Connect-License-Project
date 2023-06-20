const firebase = require("firebase");
const firebaseConfig = {
  apiKey: "AIzaSyCL8yQvg_5K2B5JG5D65B0ZUeyc4LSzSwI",
  authDomain: "license-image-store.firebaseapp.com",
  projectId: "license-image-store",
  storageBucket: "license-image-store.appspot.com",
  messagingSenderId: "432663646176",
  appId: "1:432663646176:web:8bc63bc7d95929d957e585",
  measurementId: "G-84XMSVSJ8T"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const UserAvatar = db.collection("UserAvatar");

module.exports = UserAvatar;
