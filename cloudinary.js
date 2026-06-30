// Configuración de Cloudinary
// Reemplaza con tu cloud name y upload preset (sin firmar / unsigned)
const CLOUDINARY_CLOUD_NAME = "TU_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "TU_UPLOAD_PRESET";

/**
 * Sube una imagen a Cloudinary y devuelve la URL segura.
 * @param {File} file - Archivo de imagen seleccionado por el usuario
 * @returns {Promise<string>} URL pública de la imagen
 */
export async function uploadPhotoToCloudinary(file) {
  if (!file) throw new Error("No se proporcionó ningún archivo");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "gimnasio-guerra/usuarios");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "Error al subir la foto");
  }

  const data = await response.json();
  return data.secure_url;
}
