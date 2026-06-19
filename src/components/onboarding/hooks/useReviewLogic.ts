import { useState } from 'react';
import { Camera as CapCamera, CameraResultType } from '@capacitor/camera';

interface UseReviewLogicProps {
  gender: 'female' | 'male' | null;
  setGender: (gender: 'female' | 'male' | null) => void;
  role: 'citizen' | 'protector' | 'guardian' | null;
  setRole: (role: 'citizen' | 'protector' | 'guardian' | null) => void;
  name: string;
  phone: string;
  setPhotoUrl: (url: string) => void;
}

export function useReviewLogic({ gender, setGender, role, setRole, name, phone, setPhotoUrl }: UseReviewLogicProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleGenderChange = (newGender: 'female' | 'male') => {
    setGender(newGender);
    if (newGender === 'male' && role === 'citizen') {
      setRole(null);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 70,
        width: 200,
        height: 200,
        allowEditing: false,
        resultType: CameraResultType.DataUrl
      });
      if (image.dataUrl) {
        setPhotoUrl(image.dataUrl);
      }
    } catch (error) {
      console.warn("Camera capture cancelled/failed:", error);
    }
  };

  const getSafePhotoSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('capacitor:') || url.startsWith('ionic:')) {
      return url;
    }
    return `data:image/jpeg;base64,${url}`;
  };

  const isRoleCompatible = (g: typeof gender, r: typeof role) => {
    if (g === 'male' && r === 'citizen') return false;
    return true;
  };

  const isFormValid = name.trim() !== '' && 
                      phone.length >= 10 && 
                      gender !== null && 
                      role !== null && 
                      isRoleCompatible(gender, role);

  return {
    isEditing,
    setIsEditing,
    handleGenderChange,
    handleCapturePhoto,
    getSafePhotoSrc,
    isFormValid
  };
}
