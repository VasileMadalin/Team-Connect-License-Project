import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Buffer } from "buffer";
import loader from "../assets/loader.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { setAvatarRoute } from "../utils/APIRoutes";
import generateAvatar from "github-like-avatar-generator";

export default function SetAvatar() {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [compressedImage, setCompressedImage] = useState(null);


  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
      navigate("/login");
  }, []);

  const handleChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(file);
      setImagePreview(reader.result);
      resizeImage(file);
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = (file) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setCompressedImage(dataUrl);
    };

    img.src = URL.createObjectURL(file);
  };

  // componenta foarte importanta care face legatura cu api ul spre backend
  const setProfilePicture = async () => {
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar", toastOptions);
    } else {
      const user = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      console.log(imagePreview);

      let imageToSend;

      if (selectedAvatar === -1) {
        imageToSend = compressedImage;
      } else {
        imageToSend = avatars[selectedAvatar];
      }
      const { data } = await axios.post(`${setAvatarRoute}/${user.USER_ID}`, {
        image: imageToSend,
      });

      if (data.isSet) {
        user.isAvatarImageSet = true;
        user.avatarImage = data.image;
        user.sendNotification = true;

        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(user)
        );
        navigate("/");
      } else {
        toast.error("Error setting avatar. Please try again.", toastOptions);
      }
    }
  };

  useEffect(async () => {
    const data = [];
    let i = 0;
    
    
    for (let i = 0; i < 9; i++) {
      let avatar = generateAvatar({
        blocks: 6,
        width: 100
      });
  
      data.push((avatar.base64).substring(26));
    }

    setAvatars(data);
    
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading ? (
        <Container>
          <img src={loader} alt="loader" className="loader" />
        </Container>
      ) : (
        <Container>
          <div className="upload">
            <div className="title-container">
              <h1>Pick an Avatar as your profile picture or upload your own image</h1>
            </div>
            
            <input type="file" className="submit-btn" onChange={handleChange} />
          </div>

          <div className="avatars">
            {avatars.map((avatar, index) => {
              return (
                <div
                  className={`avatar ${
                    selectedAvatar === index ? "selected" : ""
                  }`}
                >
                  <img
                    src={`data:image/svg+xml;base64,${avatar}`}
                    alt="avatar"
                    key={avatar}
                    onClick={() => setSelectedAvatar(index)}
                  />
                </div>
              );
            })}
            <div
              className={`avatar ${
                selectedAvatar === -1 ? "selected" : ""
              }`}
            >
              {compressedImage && (<div className="image-preview">
                                <img 
                                src={compressedImage} 
                                alt="Preview" 
                                onClick={() => setSelectedAvatar(-1)} />
                                </div>)}
            </div>
            
          </div>

          
          <button onClick={setProfilePicture} className="submit-btn">
            Set as Profile Picture
          </button>          

          <ToastContainer />
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 3rem;
  background-color: #f8f8ff;
  height: 100vh;
  width: 100vw;

  .loader {
    max-inline-size: 100%;
  }

  .upload {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .title-container {
    h1 {
      color: black;
    }
  }
  .avatars {
    width: 30%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    border-style: dotted;
    gap: 2rem;

    .avatar {
      border: 0.4rem solid transparent;
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.5s ease-in-out;
      img {
        height: 6rem;
        border-radius: 50%;
        transition: 0.5s ease-in-out;
      }
    }
    .selected {
      border: 0.4rem solid #4e0eff;
    }
  }
  .submit-btn {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    
    &:hover {
      background-color: #4e0eff;
    }
  }
  .image-preview {
    background-color: white;
    border-radius: 50%;
    overflow: hidden;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }  
`;

