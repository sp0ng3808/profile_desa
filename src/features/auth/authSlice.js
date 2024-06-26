import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import axios from "axios";

const secretKey = "l630bfaYZQeSXGWMAYKSvaTSD0K7ngd2";

export const check = createAsyncThunk(
  "auth/check",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      if (!error.response) {
        throw error;
      }
      return rejectWithValue(error.response.data);
    }
  }
);

export const LoginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      await axios.get("/sanctum/csrf-cookie", {
        withCredentials: true,
      });

      const response = await axios.post(
        "/api/login",
        { email, password },
        {
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN"),
          },
          withCredentials: true,
        }
      );

      if (response.status !== 200) {
        return rejectWithValue(response.data.message || "Login failed");
      }

      const data = response.data;

      const encryptedToken = CryptoJS.AES.encrypt(
        data.access_token,
        secretKey
      ).toString();

      Cookies.set("access_token", encryptedToken, {
        expires: 7,
        secure: true,
      });

      return data;
    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: Cookies.get("access_token") || null,
    loading: false,
    isSuccess: false,
    isError: false,
    message: null,
    isMe: false,
  },
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      Cookies.remove("access_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(check.pending, (state) => {
        state.loading = true;
      })
      .addCase(check.fulfilled, (state, action) => {
        state.loading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.meta.arg;
      })
      .addCase(check.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message =
          action.payload?.message || "Failed to authenticate user";
      });

    builder
      .addCase(LoginUser.pending, (state) => {
        state.loading = true;
        state.isError = false;
        state.message = null;
      })
      .addCase(LoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user || { email: action.meta.arg.email };
        state.isSuccess = true;
      })
      .addCase(LoginUser.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message = action.payload?.message || "Login failed";

        if (action.payload && action.payload.status === 419) {
          Cookies.remove("access_token");
        }
      });
  },
});

export const { reset, logout } = authSlice.actions;

export default authSlice.reducer;
