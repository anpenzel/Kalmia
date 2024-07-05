import React, { createContext, useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../utlis/toast";
import { CookiesDataSave, checkUserLoginned, getTokenFromCookies, getUser } from "../utlis/CookiesManagement";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [token,setToken] = useState("")
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log("token getting ...");
    let token = getTokenFromCookies()
    setToken(token);
  },[]);


  const fetchUserData = async (token) => {
    try {
      const response = await fetch('${""}/userData', {
        method: "GET",
        headers: {
          Authorization: "Bearer ${token}",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // setUser(userData);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
    } finally {
      setLoading(false);
    }
  };

  // const login = async (username, password) => {
  //   try {
  //     const {data, status} = await axios.post(
  //       "/auth/jwt/create",
  //       {
  //         username,
  //         password,
  //       },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (status === 200) {
  //       const status = data.status;
  //       const token = data.token;
        
  //       CookiesDataSave(status, token);
  //       toastSuccess("Login Succesfully");
  //       navigate("/dashboard", { replace: true });
  //     } 
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  // const logout = async () => {
  //   try {
  //     await fetch("${process.env.NEXT_PUBLIC_BACKEND_URL}/logout", {
  //       method: "POST",
  //       headers: {
  //         Authorization: "Bearer ${localStorage.getItem('token')}",
  //       },
  //     });

  //     localStorage.removeItem("token");
  //     // setUser(null);
  //   } catch (error) {
  //     console.error("Logout error:", error);
  //     throw error;
  //   }
  // };

  // const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{ loading ,user, setUser , token , setToken}}
    >
      {children}
    </AuthContext.Provider>
  );
};
