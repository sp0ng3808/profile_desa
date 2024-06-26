import React, { useEffect, useState } from "react";
import App from "../Templates/App";
import axios from "axios";
import getToken from "../../GetToken";
import Navbar from "../Templates/Navbar";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { Button } from "flowbite-react";
import { Label, TextInput, FileInput, Toast } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";

export const HeaderEdit = () => {
  const [content, setContent] = useState(null);
  const [idContent, setIdContent] = useState();
  const [formData, setFormData] = useState({
    title: { url: "", text: "" },
    navs: [],
  });
  const [logoFile, setLogoFile] = useState(null);

  const secretKey = "l630bfaYZQeSXGWMAYKSvaTSD0K7ngd2";
  const encryptedToken = Cookies.get("access_token");
  const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
  const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = decryptedToken;
        if (!token) {
          console.error("No decrypted token available.");
          return;
        }

        const response = await axios.get("/api/content/header", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentItem = response.data.content[0];
        const parsedContent = JSON.parse(contentItem.content);
        setIdContent(contentItem.id);
        setContent(parsedContent);
        setFormData(parsedContent);
      } catch (error) {
        console.error("Error fetching header content:", error);
      }
    };

    fetchContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    setFormData((prevState) => {
      let updatedData = { ...prevState };
      let tempData = updatedData;

      for (let i = 0; i < keys.length - 1; i++) {
        tempData = tempData[keys[i]];
      }

      tempData[keys[keys.length - 1]] = value;

      return updatedData;
    });
  };

  const handleNavChange = (index, e) => {
    const { name, value } = e.target;
    const updatedNavs = formData.navs.map((nav, i) =>
      i === index ? { ...nav, [name]: value } : nav
    );
    setFormData((prevState) => ({
      ...prevState,
      navs: updatedNavs,
    }));
  };

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Token tidak tersedia atau tidak valid.");
      }

      // Membuat objek FormData untuk mengirimkan data dan file
      const formDataToSend = new FormData();

      // Menambahkan text title
      formDataToSend.append("title[text]", formData.title.text);

      // Menambahkan file logo jika ada
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      // Menambahkan navigasi
      formData.navs.forEach((nav, index) => {
        formDataToSend.append(`navs[${index}][title]`, nav.title);
        formDataToSend.append(`navs[${index}][url]`, nav.url);
      });

      // Mengirim data ke API dengan metode PUT
      await axios.put(`/api/content/header/${idContent}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Menampilkan pesan sukses
      setToastMessage("Header berhasil diupdate!");
      setToastType("success");
      setShowToast(true);
    } catch (error) {
      console.error("Error updating header:", error);

      // Menampilkan pesan error
      setToastMessage("Gagal mengupdate header");
      setToastType("error");
      setShowToast(true);
    }
  };

  return (
    <>
      <App>
        <Navbar>Edit Header</Navbar>
        <main className="flex-1 justify-center p-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            {content ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <Label
                    className="block mb-2 font-medium text-gray-900 dark:text-white"
                    htmlFor="logo"
                  >
                    Logo
                  </Label>
                  <FileInput
                    id="logo"
                    name="logo"
                    onChange={handleLogoChange}
                  />
                </div>
                <div className="mb-5">
                  <Label
                    htmlFor="base-input"
                    className="block mb-2 font-medium text-gray-900 dark:text-white"
                  >
                    Title
                  </Label>
                  <TextInput
                    type="text"
                    id="base-input"
                    name="title.text"
                    value={formData.title.text}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Label
                      htmlFor="small-input"
                      className="block mb-2 font-medium text-gray-900 dark:text-white"
                    >
                      Nav Title
                    </Label>
                    <Label
                      htmlFor="small-input"
                      className="block mb-2 font-medium text-gray-900 dark:text-white"
                    >
                      Href
                    </Label>
                  </div>
                  {formData.navs.map((nav, index) => (
                    <div className="grid grid-cols-2 gap-4 mb-4" key={index}>
                      <TextInput
                        type="text"
                        id={`nav-title-${index}`}
                        name="title"
                        value={nav.title}
                        onChange={(e) => handleNavChange(index, e)}
                      />
                      <TextInput
                        type="text"
                        id={`nav-url-${index}`}
                        name="url"
                        value={nav.url}
                        onChange={(e) => handleNavChange(index, e)}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Button
                    type="submit"
                    className="group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] focus:z-10 focus:outline-none border border-transparent bg-blue-700 text-white focus:ring-4 focus:ring-blue-300 enabled:hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 rounded-lg"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            ) : (
              <p>Loading content...</p>
            )}
          </div>
        </main>
        {showToast && (
          <Toast
            className="fixed top-5 w-auto right-5 border border-gray-300 shadow-md"
            onClick={() => setShowToast(false)}
          >
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-500 dark:bg-cyan-800 dark:text-cyan-200">
              {toastType === "success" ? (
                <HiCheck className="text-green-500 w-5 h-5" />
              ) : (
                <HiX className="text-red-500 w-5 h-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toastMessage}</div>
          </Toast>
        )}
      </App>
    </>
  );
};

export default HeaderEdit;
