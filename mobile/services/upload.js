const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dtkflsuva/image/upload';
const UPLOAD_PRESET = 'lovealert_preset';

export const uploadPhoto = async (photoUri) => {
  try {
    console.log('📤 Starting upload...');

    const response = await fetch(photoUri);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'profile.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);

    const uploadResponse = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await uploadResponse.json();

    if (data.secure_url) {
      console.log('✅ Photo uploaded:', data.secure_url);
      return data.secure_url;
    } else {
      console.log('❌ Cloudinary error:', JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.log('❌ Upload error:', err.message);
    return null;
  }
};