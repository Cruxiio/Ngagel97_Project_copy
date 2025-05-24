"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Grid2,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // Import the back icon
import * as pdfjsLib from "pdfjs-dist";
import HelpPopover from "../../components/HelpPopover";
import CenterLoading from "../../components/CenterLoading";

const CartDetail = () => {
  const { id } = useParams(); // id = index cart
  const router = useRouter(); // Use useRouter for navigation
  const [cartItem, setCartItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [lastFileUrl, setLastFileUrl] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [notes, setNotes] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [filteredAddOnList, setFilteredAddOnList] = useState([]);
  const [service, setService] = useState(null);
  const [addOnList, setAddOnList] = useState([]);
  const [serviceImage, setserviceImage] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [sub, setSub] = useState(0);
  const [loaded, setLoaded] = useState(false);

  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  // Fetch Cart Data
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const cartRes = await fetch(`/api/cart/${id}`);
        if (!cartRes.ok) throw new Error("Failed to fetch cart details");
        const cartData = await cartRes.json();

        if (cartData.success) {
          const cartItemData = cartData.data; // Cart data
          setCartItem(cartItemData);
          setQuantity(cartItemData.qty || 1);
          setLastFileUrl(cartItemData.items.file || null);
          setPageCount(cartItemData.lembar || null);
          setNotes(cartItemData.notes || "");
          // Pre-set selected add-ons based on cart data
          setSelectedAddOns(cartItemData.addOns || []);
          setSub(cartItemData.subtotal || 0); // Set initial subtotal from cartItemData.subtotal

          // After fetching cart data, get the service using idJasa from cart
          fetchServiceData(cartItemData.jasaId);
        } else {
          throw new Error(cartData.message || "Cart item not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [id]);

  const fetchServiceData = async (idJasa) => {
    try {
      const response = await fetch(`/api/jasa/${idJasa}`);
      if (!response.ok) throw new Error("Failed to fetch service details");
      const data = await response.json();
      setService(data);
      setserviceImage(data.gambar);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const res = await fetch("/api/addon");
        if (!res.ok) throw new Error("Failed to fetch add-ons");
        const data = await res.json();
        setAddOnList(data);
      } catch (err) {
        setError("Error fetching add-ons: " + err.message);
      }
    };

    fetchAddOns();
  }, []);

  // Memoize filtered add-ons to avoid reprocessing on every render
  const memoizedFilteredAddOns = useMemo(() => {
    if (service && service.addOns) {
      return addOnList.filter((addon) => service.addOns.includes(addon._id));
    }
    return [];
  }, [service, addOnList]);

  useEffect(() => {
    setFilteredAddOnList(memoizedFilteredAddOns);
    setLoaded(true);
  }, [memoizedFilteredAddOns]);

  useEffect(() => {
    // Periksa apakah cartItem, pageCount, dan quantity sudah ada dan valid
    if (cartItem && pageCount !== null && quantity !== null) {
      calculateSubtotal(); // Calculate subtotal only when all required data is available
    }
    validateForm();
  }, [cartItem, pageCount, quantity, selectedAddOns, filteredAddOnList]); // Re-run when any of these values change

  const calculateSubtotal = () => {
    if (!cartItem) return;

    // Filter add-ons yang dipilih
    const faon = filteredAddOnList.filter((item) =>
      selectedAddOns.find((it) => it.addOnId == item._id)
    );

    let subAddOn = 0;

    // Hitung subtotal add-ons
    for (const aon of faon) {
      if (aon.tipeHarga === "lembar") {
        subAddOn += aon.harga * pageCount * quantity;
      } else {
        subAddOn += aon.harga * quantity;
      }
    }

    // Hitung subtotal utama (harga jasa * pageCount * quantity) + add-on
    const subtotal =
      Number.parseInt(cartItem.harga || 0) * (pageCount || 1) * quantity +
      subAddOn;

    setSub(subtotal); // Update the subtotal
  };

  const validateForm = () => {
    const isValid = uploadedFile !== null && quantity > 0;
    setIsFormValid(isValid);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        event.target.value = null;
        return;
      }

      setUploadedFile(file);

      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          setPageCount(pdf.numPages);
        } catch (err) {
          setError("Failed to read the PDF file.");
        }
      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  const toggleAddOn = (addon) => {
    setSelectedAddOns((prev) => {
      // Check if the add-on is already selected
      const isAlreadySelected = prev.some((a) => a.addOnId === addon._id);

      if (isAlreadySelected) {
        // If selected, remove from selectedAddOns
        return prev.filter((a) => a.addOnId !== addon._id);
      } else {
        // If not selected, add to selectedAddOns
        return [
          ...prev,
          { addOnId: addon._id, nama: addon.nama, harga: addon.harga },
        ];
      }
    });
  };

  const updateFile = async (file, lastUrl) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`/api/upload?key=${lastUrl}`, {
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
      throw new Error(data.error || "Failed to upload the PDF file.");
    }
  };

  const handleUpdateCart = async () => {
    try {
      let newFileUrl = await updateFile(uploadedFile, lastFileUrl);

      let faon = filteredAddOnList.filter((item) =>
        selectedAddOns.find((it) => it.addOnId == item._id)
      );
      let subAddOn = 0;

      for (const aon of faon) {
        if (aon.tipeHarga == "lembar") {
          subAddOn += aon.harga * pageCount * quantity;
        } else {
          subAddOn += aon.harga * quantity;
        }
      }

      const updatedCartData = {
        qty: quantity,
        lembar: pageCount,
        file: uploadedFile ? newFileUrl : lastFileUrl,
        notes: notes,
        subtotal: parseInt(sub),
        addOns: faon.map((i) => {
          return {
            addOnId: i._id,
            nama: i.nama,
            harga: i.harga,
            qty: i.tipeHarga == "lembar" ? quantity * pageCount : quantity,
            tipeHarga: i.tipeHarga,
            subtotal:
              i.tipeHarga == "lembar"
                ? parseInt(i.harga * quantity * pageCount)
                : parseInt(i.harga * quantity),
          };
        }),
      };

      const res = await fetch(`/api/cart/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedCartData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update cart");
      }

      // Navigate to another page after success, if needed
      router.push(`/cart`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    router.push("/cart"); // Navigate back to /cart
  };

  if (loading) {
    return <CenterLoading />;
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!cartItem) return <Typography>No data available</Typography>;

  return (
    <Container sx={{ marginTop: 4 }}>
      <Card>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: "relative" }}>
              <IconButton
                onClick={handleBack}
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  color: "white",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <CardMedia
                component="img"
                image={serviceImage}
                alt={cartItem.nama}
                sx={{ height: 400, width: 400, objectFit: "contain" }}
              />
            </Box>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <CardContent>
              <Typography variant="h4">{cartItem.nama}</Typography>
              <Typography gutterBottom>Price: Rp {cartItem.harga}</Typography>

              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                fullWidth
                sx={{ marginBottom: 2 }}
              />

              <Typography>Upload File:</Typography>
              <TextField
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                fullWidth
                sx={{ marginBottom: 2 }}
              />
              {
                <Typography variant="body2" sx={{ marginTop: 1 }}>
                  Pages: {pageCount}
                </Typography>
              }

              {filteredAddOnList.map((addon) => (
                <FormControlLabel
                  key={addon._id}
                  control={
                    <Checkbox
                      onChange={() => toggleAddOn(addon)}
                      checked={selectedAddOns.some(
                        (a) => a.addOnId === addon._id
                      )}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <Typography>
                        <b>{addon.nama}</b> - Rp {addon.harga}/{" "}
                        {addon.tipeHarga}
                      </Typography>
                      <HelpPopover
                        nama={addon.nama}
                        image={addon.gambar}
                        description={addon.deskripsi}
                      />
                    </Box>
                  }
                />
              ))}

              <TextField
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                sx={{ marginTop: 2 }}
              />

              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mt={2}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateCart}
                  sx={{ marginTop: 2 }}
                >
                  Update Cart
                </Button>
                <Typography variant="h6" sx={{ marginLeft: 2 }}>
                  Subtotal: Rp {sub.toLocaleString("id-ID")}
                </Typography>
              </Box>
            </CardContent>
          </Grid2>
        </Grid2>
      </Card>
    </Container>
  );
};

export default CartDetail;
