const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dtkflsuva/image/upload';
const UPLOAD_PRESET = 'lovealert_preset';

export const uploadPhoto = async (photoUri) => {
  try {
    console.log('📤 Début upload vers Cloudinary...');
    console.log('URI photo:', photoUri);

    // Vérifier que l'URI est valide
    if (!photoUri) {
      console.log('❌ Aucune URI fournie');
      return null;
    }

    // Récupérer le blob
    const response = await fetch(photoUri);
    if (!response.ok) {
      console.log('❌ Impossible de lire le fichier:', response.status);
      return null;
    }
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'profile.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);

    const uploadResponse = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await uploadResponse.json();
    console.log('📦 Réponse Cloudinary:', data);

    if (data.secure_url) {
      console.log('✅ Photo uploadée:', data.secure_url);
      return data.secure_url;
    } else {
      console.log('❌ Cloudinary error:', data.error?.message || JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.log('❌ Erreur upload:', err.message);
    return null;
  }
};