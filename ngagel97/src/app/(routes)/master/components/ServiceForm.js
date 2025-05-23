"use client";

import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  styled,
  TextareaAutosize as BaseTextareaAutosize,
} from "@mui/material";
import { useForm } from "react-hook-form";
import Joi from "joi";
import { useRouter } from "next/navigation";
import AddonCheckboxes from "./AddonCheckboxes";

const Textarea = styled(BaseTextareaAutosize)(
  ({ theme }) => `
    box-sizing: border-box;
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 8px 12px;
    border-radius: 5px;
    color: ${theme.palette.mode === "dark" ? "#C7D0DD" : "#1C2025"};
    background: ${theme.palette.mode === "dark" ? "#1C2025" : "#fff"};
    border: 1px solid ${theme.palette.mode === "dark" ? "#434D5B" : "#DAE2ED"};
    box-shadow: 0 2px 2px ${
      theme.palette.mode === "dark" ? "#1C2025" : "#F3F6F9"
    };

    &:hover {
      border-color: #3399FF;
    }

    &:focus {
      border-color: #3399FF;
      box-shadow: 0 0 0 3px ${
        theme.palette.mode === "dark" ? "#0072E5" : "#b6daff"
      };
    }

    &:focus-visible {
      outline: 0;
    }
  `
);

export default function ServiceForm({ mode = "add", id }) {
  const [error, setError] = useState("");
  const [lastImageUrl, setLastImageUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
    setValue,
  } = useForm();

  const schema = Joi.object({
    nama: Joi.string().min(3).required().messages({
      "string.base": `"Name" Must be Text`,
      "string.empty": `"Name" Can't be empty`,
      "string.min": `"Name" Minimum Character is {#limit}`,
    }),
    harga: Joi.number().min(100).positive().required().messages({
      "number.base": `Price must be a number`,
      "number.min": `Price must be more than Rp 100,-`,
      "number.positive": `Price can't be less than Rp 0,-`,
      "number.empty": `Price should not be empty`,
    }),
    deskripsi: Joi.string().required().messages({
      "string.base": `"Description" Must be a Text`,
      "string.empty": `"Description" Can't be Empty`,
    }),
  });

  const fetchServiceData = async (id) => {
    try {
      const res = await fetch(`/api/jasa/${id}`);
      if (res.ok) {
        const data = await res.json();
        setValue("nama", data.nama);
        setValue("harga", data.harga);
        setValue("deskripsi", data.deskripsi);
        setLastImageUrl(data.gambar);
        setSelectedAddons(data.addOns);
      } else {
        throw new Error("Gagal mengambil data.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const uploadImage = async (file, lastUrl) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    // let filepath = lastUrl.replace(
    //   "https://mnyziu33qakbhpjn.public.blob.vercel-storage.com/",
    //   ""
    // );
    await fetch(`/api/upload?key=${filepath}`, {
      method: "DELETE",
    });

    const res = await fetch(`/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    } else {
      const data = await res.json();
      throw new Error(data.error || "Upload gagal");
    }
  };

  const onSubmit = async (data) => {
    const validation = schema.validate(data, { abortEarly: false });

    if (validation.error) {
      validation.error.details.forEach((err) => {
        setFormError(err.context.key, { message: err.message });
      });
      return;
    }

    setError("");

    let imageUrl = lastImageUrl;

    try {
      if (selectedFile) {
        if (lastImageUrl) {
          imageUrl = await uploadImage(selectedFile, lastImageUrl);
        } else {
          imageUrl = await uploadImage(selectedFile, "");
        }
      }

      const method = mode === "add" ? "POST" : "PUT";
      const endpoint = mode === "add" ? "/api/jasa" : `/api/jasa/${id}`;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          addOns: selectedAddons,
          gambar: imageUrl,
        }),
      });
      if (res.ok) {
        alert(`Service ${mode === "add" ? "added" : "updated"} successfully!`);
        router.push("/master/service");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Service submission failed");
      }
    } catch (error) {
      setError("Failed to save Service changes. Please try again.");
    }
  };

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchServiceData(id);
    }
  }, [mode, id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        marginTop={5}
      >
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: 3,
            borderRadius: 2,
            marginTop: 2,
          }}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          gap={2}
          width="100%"
        >
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              textAlign: "center",
              width: "100%",
            }}
          >
            <Typography variant="h4" gutterBottom>
              {mode === "add" ? "ADD SERVICE" : "EDIT SERVICE"}
            </Typography>
          </Box>
          <Typography variant="body1">Name</Typography>
          <TextField
            label="Insert Service Name"
            variant="outlined"
            fullWidth
            value={watch("nama") || ""}
            {...register("nama")}
            error={!!errors.nama}
            helperText={errors.nama?.message}
          />

          <Typography variant="body1">Price</Typography>
          <TextField
            label="Insert Service Price"
            variant="outlined"
            fullWidth
            type="number"
            value={watch("harga") || ""}
            {...register("harga")}
            error={!!errors.harga}
            helperText={errors.harga?.message}
          />

          <Typography variant="body1">Description</Typography>
          <Textarea
            minRows={4}
            placeholder="InsertService Description"
            value={watch("deskripsi") || ""}
            {...register("deskripsi")}
            style={{ borderColor: errors.deskripsi ? "red" : undefined }}
          />
          {errors.deskripsi && (
            <Typography color="error">{errors.deskripsi.message}</Typography>
          )}

          <Typography variant="body1">Upload Picture</Typography>
          <input type="file" accept="image/*" onChange={handleFileChange} />

          <AddonCheckboxes
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ backgroundColor: "#493628" }}
          >
            Submit
          </Button>

          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </Box>
    </Container>
  );
}
