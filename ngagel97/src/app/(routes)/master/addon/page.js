"use client";

import React, { useState, useEffect } from "react";
import Grid2 from "@mui/material/Grid2";
import {
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Box,
  Tooltip,
  IconButton,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import DeleteIcon from "@mui/icons-material/Delete";
import CenterLoading from "../../(public)/components/CenterLoading";

const AddOnPage = () => {
  const [addOns, setAddOns] = useState([]);
  const [filteredAddOns, setFilteredAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const response = await fetch("/api/addon");
        const data = await response.json();
        setAddOns(data);
        setFilteredAddOns(data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Gagal mengambil data add-ons:", error);
      }
    };

    fetchAddOns();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = addOns.filter((addon) =>
        addon.nama.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredAddOns(filtered);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, addOns]);

  const handleDelete = async (id) => {
    const confirmed = confirm("Apakah Anda yakin ingin menghapus add-on ini?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/addon/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Gagal menghapus data add-on.");
      }

      setAddOns((prevAddOns) =>
        prevAddOns.filter((addon) => addon.idAddon !== id)
      );
    } catch (error) {
      console.error("Gagal menghapus add-on:", error);
    }
  };

  if (loading) {
    return <CenterLoading />;
  }

  return (
    <div style={{ padding: "20px", backgroundColor: "#D6C0B3" }}>
      <Box
        sx={{
          backgroundColor: "#AB886D",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: "white",
              textTransform: "uppercase",
              marginTop: "10px",
            }}
          >
            Add-ons
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* <Button
              variant="contained"
              color="primary"
              onClick={() => {
                window.location.href = "/master/addon/add";
              }}
              sx={{
                textTransform: "none",
                backgroundColor: "#493628",
                fontSize: "16px",
                padding: "12px 36px",
                "&:hover": {
                  backgroundColor: "#493628",
                },
              }}
            >
              Add Add-on
            </Button> */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Typography
                variant="body1"
                component="span"
                sx={{ fontWeight: "bold", color: "white" }}
              >
                Search:
              </Typography>
              <TextField
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search"
                sx={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Box>
          </Box>
        </div>
      </Box>

      {/* Daftar Add-On */}
      <Grid2
        container
        spacing={3}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        {filteredAddOns.map((addon) => (
          <Grid2 key={addon.idAddon} xs={12} sm={12} md={6}>
            <Card
              sx={{
                width: 1200,
                margin: "auto",
                display: "grid",
                gridTemplateColumns: "180px auto",
                gap: "16px",
                alignItems: "center",
                padding: "16px",
              }}
            >
              {/* Image Section */}
              {addon.gambar ? (
                <Image
                  src={addon.gambar}
                  alt={addon.nama || "Gambar Addon"}
                  width={180}
                  height={180}
                  style={{
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <Image
                  src="/image/380x200.png" // Placeholder image
                  alt="Gambar Addon"
                  width={180}
                  height={180}
                  style={{
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}

              {/* Content Section */}
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexGrow: 1,
                }}
              >
                {/* Text Details */}
                <div>
                  <Typography variant="h6" component="div" gutterBottom>
                    {addon.nama}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Harga: Rp {addon.harga},-
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipe Harga: {addon.tipeHarga}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontStyle: "italic",
                      marginTop: "8px",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    Deskripsi: {addon.deskripsi || "Deskripsi tidak tersedia"}
                  </Typography>
                </div>

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                    gap: "10px",
                    marginTop: "auto", // Push to the bottom
                  }}
                >
                  <Link href={`/master/addon/${addon.idAddon}`} passHref>
                    <Button variant="contained" color="primary" size="small">
                      Detail
                    </Button>
                  </Link>
                  <Tooltip title="Delete">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(addon.idAddon);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    </div>
  );
};

export default AddOnPage;
