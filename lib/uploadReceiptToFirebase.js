import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export async function uploadReceiptToFirebase(file, uid, year, month) {
  const storage = getStorage();
  const filename = `${year}/${month}/${uid}/${uuidv4()}`;
  const storageRef = ref(storage, `receipts/${filename}`);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  return downloadUrl;
}