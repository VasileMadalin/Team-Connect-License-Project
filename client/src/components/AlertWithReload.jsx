import React, { useState, useEffect } from "react";
import Logout from "./Logout";

const styles = {
  alert: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "20px",
    border: "1px solid #f5c6cb",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  button: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "5px 10px",
    marginLeft: "10px",
    cursor: "pointer",
  },
};

function AlertWithReload({msg}) {
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    if (showAlert === true) {
      alert('Please reload the page');
      setShowAlert(false);
    }
  });

  function reloadPage() {
    window.location.reload();
  }

  return (
    <div>
      { msg === "same" ? (
        <div className="alert" style={styles.alert}>
          <p>Your account has been suspended. Please leave the page</p>
        </div>
      ) : (<div className="alert" style={styles.alert}>
            <p>The contacts have been updated. Please reload the page.</p>
            <button style={styles.button} onClick={reloadPage}>Reload Page</button>
          </div>)
      }
    </div>
  );
}

export default AlertWithReload;
