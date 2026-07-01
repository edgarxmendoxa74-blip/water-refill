# GCash Payment Image Upload - Quick Start Guide

## Feature Summary
Admin users can now upload QR codes and payment images for GCash (and all other payment methods) through an intuitive image management interface.

---

## 📸 UI Changes

### Before (Old UI)
```
Payment Method: GCash
Account: 09123456789
Name: John Doe

[Simple file input]
```

### After (New UI)
```
═══════════════════════════════════════════════════════════════
Payment Method: GCash
Account: 09123456789
Name: John Doe

┌─────────────────────────────────────────────────────────────┐
│ 📷 QR Code/Payment Image                         [Remove]    │
│                                                              │
│             ┌──────────────────┐                            │
│             │                  │                            │
│             │   [QR Image]     │  180x180px                │
│             │                  │                            │
│             └──────────────────┘                            │
│                                                              │
│ Update Image                                                │
│ [Choose File Button] ──────────────────────────            │
│ Recommended: PNG/JPG, Max 5MB. Auto-compressed.            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Add GCash QR Code

### Step 1: Go to Admin Dashboard
- Login to Admin Portal
- Navigate to **"Payment Methods"** tab in sidebar

### Step 2: Edit Payment Method
- Find the **"GCash"** payment method card
- Click the **Edit icon** (pencil)

### Step 3: Upload QR Code
1. Scroll to the **"QR Code/Payment Image"** section
2. Click **"Choose Image"** button (or drag file)
3. Select your GCash QR code PNG/JPG file
4. Watch as image compresses automatically
5. See success message: **"QR Code/Image uploaded successfully!"**
6. Click **"Save Changes"** to finalize

### Step 4: Verify
- Close edit mode
- See your QR code image displayed (180x180px)
- Image is now stored in database

---

## 🎯 Different Scenarios

### Scenario 1: Adding Image to New Payment Method
```
1. Click "Add Method" button
2. Fill: Name, Account #, Account Name
3. Click "Save Method"
4. Immediately click Edit on the new method
5. Upload image to QR Code section
6. Save
```

### Scenario 2: Replacing Existing Image
```
1. Click Edit on payment method
2. Current image shown with X button
3. Click file input or drag new image
4. Old image replaced, new one compressed
5. Save Changes
```

### Scenario 3: Removing Image
**In View Mode:**
- Click "Remove" button under image
- Confirm deletion
- Image removed, card returns to "Add QR Code" state

**In Edit Mode:**
- Click X button on image thumbnail
- Image deleted from edit form
- Save Changes to confirm

---

## 📊 Technical Specs

| Aspect | Detail |
|--------|--------|
| **Formats** | PNG, JPG, WebP, GIF |
| **Max Original Size** | No strict limit (browser dependent) |
| **Auto Compressed To** | 600px width × proportional height |
| **Quality** | 0.8 (80%) - optimal for QR codes |
| **Storage** | Supabase base64 in `qr_url` field |
| **Processing** | Client-side compression, instant |

---

## 💡 Tips & Tricks

### For Best Results:
✅ Use clear, well-lit QR code photos
✅ Square images work best (QR codes are square)
✅ PNG format preferred for QR codes
✅ 500x500px or larger source recommended
✅ Good contrast (dark QR on white background)

### What Gets Stored:
- ✅ Base64 encoded image (efficient)
- ✅ Automatically compressed (saves space)
- ✅ Synced to Supabase (persistent)
- ✅ Accessible in future edits

### Mobile Friendly:
📱 Upload works on mobile browsers
📱 Images display properly on phones
📱 Touch-friendly file selection

---

## ⚡ Features at a Glance

| Feature | Status |
|---------|--------|
| Upload images | ✅ Yes |
| Auto-compress | ✅ Yes |
| Replace images | ✅ Yes |
| Remove images | ✅ Yes |
| Multiple images per method | ⏳ Future |
| Drag-and-drop | ⏳ Future |
| Image cropping tool | ⏳ Future |
| QR code generator | ⏳ Future |

---

## 🔍 Where Images Appear

### Admin Dashboard
- Payment Methods tab → GCash card → QR image visible (180x180px)

### Customer-Facing (Future)
- Could be displayed on checkout page (not yet implemented)
- Could show in payment instructions

---

## ❓ FAQ

**Q: What if I upload the wrong image?**
A: Click "Remove" or the X button to delete, then upload the correct image.

**Q: Can I upload images for other payment methods?**
A: Yes! This works for any payment method (GCash, PayMaya, Bank Transfer, etc.)

**Q: What happens to the image if I delete the payment method?**
A: Image is automatically deleted along with the payment method.

**Q: Is my image saved if I don't click "Save Changes"?**
A: Only if you're uploading in Edit mode and clicking "Save Changes". In View mode, changes save immediately.

**Q: Can I use a screenshot of my QR code?**
A: Yes, any image format is supported.

**Q: How large can the image be?**
A: Original size doesn't matter - automatically compressed to 600px width before storage.

---

## 🎓 Video Walkthrough (Text Version)

```
ADMIN DASHBOARD FLOW:

1. Login → Admin Portal (/admin/dashboard)
2. Sidebar → Click "Payment Methods"
3. Find "GCash" card
4. Click pencil icon (Edit)
5. Scroll to blue "QR Code/Payment Image" box
6. Click "Choose Image" or drag PNG file
7. Watch compression animation
8. Success notification appears
9. Click "Save Changes" button
10. ✅ Done! QR code now visible on GCash card
```

---

## 🆘 Troubleshooting

**Problem: Upload button doesn't work**
- Solution: Check browser console (F12) for errors
- Solution: Ensure Supabase is connected
- Solution: Try with a different image file

**Problem: Image looks pixelated**
- Solution: This is normal for QR codes at this quality
- Solution: Upload a higher quality source image

**Problem: Upload very slow**
- Solution: Wait for compression to complete
- Solution: Try with a smaller image file
- Solution: Check internet connection

**Problem: "Error uploading image" message**
- Solution: Check Supabase database status
- Solution: Ensure image file is valid format
- Solution: Try a different image

---

## 📝 Notes for Developers

- Implementation in: `src/pages/AdminDashboard.jsx`
- New functions: `handleFileUpload()`, `removeQRImage()`
- Uses existing `compressImage()` utility
- Stores in Supabase `payment_settings.qr_url`
- Base64 encoding for persistence
- No new dependencies added

---

## 🎉 What's Next?

Stay tuned for upcoming features:
- 📁 Multiple images per payment method
- 🖱️ Drag-and-drop upload areas
- ✂️ Built-in image cropping tool
- 🔄 QR code auto-generator
- 📱 Mobile app integration

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
