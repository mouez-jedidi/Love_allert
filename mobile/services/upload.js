import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const CLOUDINARY_URL =
  'https://api.cloudinary.com/v1_1/dtkflsuva/image/upload';

const UPLOAD_PRESET = 'lovealert_preset';

/* -------------------------------------------
   📦 IMAGE COMPRESSION (mobile only)
-------------------------------------------- */
const compressImage = async (uri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // reduce size
      {
        compress: 0.7, // quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (err) {
    console.log('⚠️ Compression failed, using original image');
    return uri;
  }
};

/* -------------------------------------------
   🚀 UPLOAD WITH PROGRESS (XHR)
-------------------------------------------- */
const uploadWithProgress = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', CLOUDINARY_URL);

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } catch (e) {
        reject(e);
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));

    // 📊 Progress tracking
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round(
            (event.loaded / event.total) * 100
          );
          onProgress(percent);
        }
      };
    }

    xhr.send(formData);
  });
};

/* -------------------------------------------
   📤 MAIN FUNCTION
-------------------------------------------- */
export const uploadPhoto = async (
  photoUri,
  onProgress = () => {}
) => {
  try {
    console.log('📤 Starting upload...');

    if (!photoUri) {
      console.log('❌ No photo provided');
      return null;
    }

    // 1️⃣ Compress image (mobile only)
    let finalUri = photoUri;

    if (Platform.OS !== 'web') {
      finalUri = await compressImage(photoUri);
    }

    // 2️⃣ Prepare FormData
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // 🌐 WEB
      const response = await fetch(finalUri);
      const blob = await response.blob();
      formData.append('file', blob, 'photo.jpg');
    } else {
      // 📱 MOBILE
      formData.append('file', {
        uri: finalUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
    }

    formData.append('upload_preset', UPLOAD_PRESET);

    // 3️⃣ Upload with progress
    console.log('📦 Uploading to Cloudinary...');

    const res = await uploadWithProgress(formData, onProgress);

    // 4️⃣ Handle response
    if (res?.secure_url) {
      console.log('✅ Upload success:', res.secure_url);
      return res.secure_url;
    } else {
      console.log('❌ Cloudinary error:', res?.error?.message || res);
      return null;
    }
  } catch (err) {
    console.log('❌ Upload error:', err.message);

    // 🔁 simple retry once
    try {
      console.log('🔁 Retrying upload...');
      return await uploadPhoto(photoUri, onProgress);
    } catch (retryErr) {
      console.log('❌ Retry failed:', retryErr.message);
      return null;
    }
  }
};