import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyBy_FGpgaOn5PmR6qkBuFTJj-Wg_GQcEH4",
  authDomain: "xv-ivanna-aa920.firebaseapp.com",
  projectId: "xv-ivanna-aa920",
  storageBucket: "xv-ivanna-aa920.firebasestorage.app",
  messagingSenderId: "347193806636",
  appId: "1:347193806636:web:5774f4a26c42300929a689"
};
const db = getFirestore(initializeApp(firebaseConfig));
const $ = id => document.getElementById(id);
const CODIGO = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();
const ref = /^[A-Z0-9-]{3,40}$/.test(CODIGO) ? doc(db, 'invitados', CODIGO) : null;
if (!ref) pintar(null);
else getDoc(ref).then(x => pintar(x.exists() ? x.data() : null))
  .catch(() => { $('cargando').textContent = 'No se pudo cargar. Recarga la página.'; });

function pintar(d) {
  $('cargando').hidden = true;
  if (!d) { $('error').hidden = false; return; }
  const mesas = (String(d.mesa || '').match(/\d+/g) || []).map(Number);
  $('hola').textContent = 'Hola, ' + d.nombre;
  $('nb').textContent = d.boletos;
  $('mesasTxt').innerHTML = mesas.length ? (mesas.length > 1 ? 'Mesas: ' : 'Mesa: ') + '<b>' + mesas.join(', ') + '</b>' : 'Mesa por asignar';
  const sel = $('num');
  for (let i = 1; i <= d.boletos; i++) sel.add(new Option(i + (i === 1 ? ' boleto' : ' boletos'), i));
  if (d.usados >= 1) sel.value = d.usados;
  mostrarEstado(d.confirmo, d.usados);
  $('inv').hidden = false;
}
function mostrarEstado(c, n) {
  $('estado').textContent = c === 'Sí' ? 'Confirmaste ' + n + (n == 1 ? ' boleto.' : ' boletos.') + ' Puedes cambiarlo cuando quieras.'
    : c === 'No' ? 'Registramos que no podrás asistir. Si cambias de opinión, vuelve a confirmar.' : '';
}
async function enviar(asiste) {
  const n = asiste ? Number($('num').value) : 0;
  if (asiste && (!Number.isSafeInteger(n) || n < 1 || n > $('num').options.length)) return;
  $('bsi').disabled = $('bno').disabled = $('num').disabled = true; $('estado').textContent = 'Guardando…';
  try {
    await updateDoc(ref, { confirmo: asiste ? 'Sí' : 'No', usados: n, fecha: serverTimestamp() });
    $('estado').textContent = asiste ? '¡Listo! Confirmamos ' + n + (n == 1 ? ' boleto. Nos vemos en la fiesta.' : ' boletos. Nos vemos en la fiesta.') : 'Gracias por avisarnos. Te vamos a extrañar.';
  } catch (e) { $('estado').textContent = 'No se pudo guardar. Intenta de nuevo.'; }
  $('bsi').disabled = $('bno').disabled = $('num').disabled = false;
}
$('bsi').onclick = () => enviar(true);
$('bno').onclick = () => enviar(false);

