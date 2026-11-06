import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, writeBatch, onSnapshot, query, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const app = initializeApp({
  apiKey: 'AIzaSyBy_FGpgaOn5PmR6qkBuFTJj-Wg_GQcEH4',
  authDomain: 'xv-ivanna-aa920.firebaseapp.com',
  projectId: 'xv-ivanna-aa920',
  appId: '1:347193806636:web:5774f4a26c42300929a689'
}, 'galeria-ivanna');
const db = getFirestore(app);
const photos = collection(db, 'fotosFiesta');
const code = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();
const input = document.querySelector('#foto-fiesta');
const status = document.querySelector('#fotos-estado');
const wall = document.querySelector('#fotos-muro');

function photoCard(snapshot, download = false) {
  const url = snapshot.data().jpeg;
  if (!url?.startsWith('data:image/jpeg;base64,')) return document.createTextNode('');
  const image = document.createElement('img');
  image.src = url;
  image.loading = 'lazy';
  image.alt = 'Foto de la fiesta de Ivanna';
  if (!download) return image;
  const link = document.createElement('a');
  link.href = url;
  link.download = 'XV-Ivanna-' + snapshot.id + '.jpg';
  link.append(image, document.createTextNode('Descargar'));
  return link;
}

onSnapshot(query(photos, orderBy('fecha', 'desc'), limit(24)), snapshot => {
  wall.replaceChildren(...snapshot.docs.map(photo => photoCard(photo)));
}, () => { status.textContent = 'La galería todavía no está disponible.'; });

if (/^[A-Z0-9-]{3,40}$/.test(code)) {
  getDoc(doc(db, 'invitados', code)).then(snapshot => {
    document.querySelector('#publicar-foto').hidden = !snapshot.exists();
  }).catch(() => { status.textContent = 'No se pudo verificar tu invitación.'; });
}

async function compress(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 900 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.75, .6, .45, .3]) {
      const jpeg = canvas.toDataURL('image/jpeg', quality);
      if (jpeg.length <= 350000) return jpeg;
    }
    throw new Error('Imagen demasiado grande');
  } finally {
    URL.revokeObjectURL(url);
  }
}

input.addEventListener('change', async () => {
  const file = input.files[0];
  if (!file) return;
  const button = document.querySelector('#publicar-foto');
  button.disabled = true;
  status.textContent = 'Subiendo tu foto…';
  try {
    if (file.size > 20000000) throw new Error('Archivo demasiado grande');
    const jpeg = await compress(file);
    const photo = doc(photos);
    const batch = writeBatch(db);
    batch.set(photo, { jpeg, fecha: serverTimestamp() });
    batch.set(doc(db, 'permisosFotosFiesta', photo.id), { codigo: code });
    await batch.commit();
    status.textContent = '¡Tu foto ya se publicó!';
  } catch {
    status.textContent = 'No se pudo publicar. Prueba con una foto JPG o PNG de hasta 20 MB.';
  } finally {
    input.value = '';
    button.disabled = false;
  }
});

document.querySelector('#publicar-foto').onclick = () => input.click();
document.querySelector('#descargar-fotos').onclick = async () => {
  const adminWall = document.querySelector('#fotos-descargas');
  try {
    await signInWithPopup(getAuth(app), new GoogleAuthProvider());
    const snapshot = await getDocs(query(photos, orderBy('fecha', 'desc')));
    adminWall.replaceChildren(...snapshot.docs.map(photo => photoCard(photo, true)));
    if (snapshot.empty) adminWall.textContent = 'Todavía no hay fotos para descargar.';
  } catch {
    adminWall.textContent = 'Ingresa con la cuenta de administración autorizada.';
  }
};
