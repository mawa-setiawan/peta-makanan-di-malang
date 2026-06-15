import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = window.MALANG_FOOD_MAP_FIREBASE_CONFIG || {};
const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !String(firebaseConfig.apiKey).includes("ISI_") &&
  !String(firebaseConfig.projectId).includes("ISI_")
);

const MALANG_CENTER = [-7.96662, 112.63263];
const MALANG_BOUNDS = [
  [-8.075, 112.505],
  [-7.865, 112.755]
];

const AREAS = ["Klojen", "Lowokwaru", "Blimbing", "Sukun", "Kedungkandang"];
const CATEGORIES = [
  "Bakso & mie",
  "Nasi & lalapan",
  "Soto/rawon/sup",
  "Jajanan pasar",
  "Kopi & dessert",
  "Seafood",
  "Ayam/bebek",
  "Vegetarian",
  "Lainnya"
];

const elements = {
  authGate: document.getElementById("authGate"),
  appShell: document.getElementById("appShell"),
  setupWarning: document.getElementById("setupWarning"),
  loginButton: document.getElementById("loginButton"),
  logoutButton: document.getElementById("logoutButton"),
  authMessage: document.getElementById("authMessage"),
  userChip: document.getElementById("userChip"),
  addPointButton: document.getElementById("addPointButton"),
  mapHint: document.getElementById("mapHint"),
  searchInput: document.getElementById("searchInput"),
  areaFilter: document.getElementById("areaFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  popularList: document.getElementById("popularList"),
  totalPlaces: document.getElementById("totalPlaces"),
  placeList: document.getElementById("placeList"),
  detailEmpty: document.getElementById("detailEmpty"),
  detailContent: document.getElementById("detailContent"),
  detailBody: document.getElementById("detailBody"),
  closeDetailButton: document.getElementById("closeDetailButton"),
  commentForm: document.getElementById("commentForm"),
  commentText: document.getElementById("commentText"),
  commentsList: document.getElementById("commentsList"),
  placeDialog: document.getElementById("placeDialog"),
  placeForm: document.getElementById("placeForm"),
  cancelDialogButton: document.getElementById("cancelDialogButton"),
  selectedPointText: document.getElementById("selectedPointText"),
  placeNameInput: document.getElementById("placeNameInput"),
  foodNameInput: document.getElementById("foodNameInput"),
  areaInput: document.getElementById("areaInput"),
  categoryInput: document.getElementById("categoryInput"),
  priceInput: document.getElementById("priceInput"),
  halalInput: document.getElementById("halalInput"),
  descriptionInput: document.getElementById("descriptionInput"),
  photoInput: document.getElementById("photoInput"),
  savePlaceButton: document.getElementById("savePlaceButton"),
  formMessage: document.getElementById("formMessage")
};

let app;
let auth;
let db;
let storage;
let currentUser = null;
let map;
let addMode = false;
let selectedLatLng = null;
let selectedPlaceId = null;
let unsubscribePlaces = null;
let unsubscribeComments = null;
let allPlaces = [];
let markers = new Map();
let markerLayer;

fillSelect(elements.areaFilter, ["Semua area", ...AREAS], ["", ...AREAS]);
fillSelect(elements.categoryFilter, ["Semua kategori", ...CATEGORIES], ["", ...CATEGORIES]);
fillSelect(elements.areaInput, AREAS, AREAS);
fillSelect(elements.categoryInput, CATEGORIES, CATEGORIES);

if (!firebaseConfigured) {
  elements.setupWarning.hidden = false;
  elements.loginButton.disabled = true;
  elements.authMessage.textContent = "Konfigurasi Firebase belum diisi, jadi login belum bisa dipakai.";
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  bindAuth();
}

bindUi();

function bindAuth() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
      elements.authGate.classList.add("hidden");
      elements.appShell.classList.remove("hidden");
      renderUserChip(user);
      initMapOnce();
      subscribePlacesOnce();
      setTimeout(() => map?.invalidateSize(), 120);
    } else {
      elements.authGate.classList.remove("hidden");
      elements.appShell.classList.add("hidden");
      cleanupRealtime();
    }
  });
}

function bindUi() {
  elements.loginButton.addEventListener("click", async () => {
    if (!firebaseConfigured) return;
    elements.authMessage.textContent = "Membuka login Google...";
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      elements.authMessage.textContent = "";
    } catch (error) {
      elements.authMessage.textContent = readableError(error);
    }
  });

  elements.logoutButton.addEventListener("click", () => signOut(auth));

  elements.addPointButton.addEventListener("click", () => {
    addMode = !addMode;
    elements.addPointButton.textContent = addMode ? "Batalkan tambah titik" : "Tambah titik kuliner";
    elements.mapHint.textContent = addMode
      ? "Mode tambah aktif. Klik lokasi kuliner di peta."
      : "Mode tambah belum aktif.";
    document.body.classList.toggle("adding-mode", addMode);
  });

  elements.searchInput.addEventListener("input", renderAll);
  elements.areaFilter.addEventListener("change", renderAll);
  elements.categoryFilter.addEventListener("change", renderAll);

  elements.closeDetailButton.addEventListener("click", clearDetail);
  elements.cancelDialogButton.addEventListener("click", closePlaceDialog);

  elements.placeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await savePlace();
  });

  elements.commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveComment();
  });
}

function initMapOnce() {
  if (map) return;

  map = L.map("map", {
    center: MALANG_CENTER,
    zoom: 13,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: MALANG_BOUNDS,
    maxBoundsViscosity: 1
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const bounds = L.latLngBounds(MALANG_BOUNDS);
  L.rectangle(bounds, {
    color: "#d95d18",
    weight: 1,
    fillOpacity: 0.02,
    dashArray: "6 8"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  map.on("click", (event) => {
    if (!addMode) return;
    const latlng = event.latlng;
    if (!isInsideMalangBounds(latlng.lat, latlng.lng)) {
      elements.mapHint.textContent = "Titik di luar batas Kota Malang. Pilih lokasi yang masih di area peta.";
      return;
    }
    openPlaceDialog(latlng);
  });
}

function subscribePlacesOnce() {
  if (unsubscribePlaces) return;
  const placesQuery = query(collection(db, "places"), orderBy("createdAt", "desc"), limit(500));
  unsubscribePlaces = onSnapshot(placesQuery, (snapshot) => {
    allPlaces = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderAll();
  }, (error) => {
    elements.placeList.textContent = readableError(error);
  });
}

function cleanupRealtime() {
  if (unsubscribePlaces) unsubscribePlaces();
  if (unsubscribeComments) unsubscribeComments();
  unsubscribePlaces = null;
  unsubscribeComments = null;
  allPlaces = [];
  markers.clear();
}

function renderAll() {
  const filtered = getFilteredPlaces();
  renderMarkers(filtered);
  renderPlaceList(filtered);
  renderPopularList(filtered);
  elements.totalPlaces.textContent = `${filtered.length} titik`;

  if (selectedPlaceId && !allPlaces.some((place) => place.id === selectedPlaceId)) {
    clearDetail();
  }
}

function renderMarkers(places) {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  markers.clear();

  for (const place of places) {
    if (typeof place.lat !== "number" || typeof place.lng !== "number") continue;

    const marker = L.marker([place.lat, place.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="food-marker">${categoryEmoji(place.category)}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    });

    marker.bindPopup(`
      <div class="popup-card">
        <strong>${escapeHtml(place.placeName || "Tempat kuliner")}</strong>
        <div>${escapeHtml(titleCase(place.foodName || "Makanan"))}</div>
        <small>${escapeHtml(place.area || "Malang")} · ${escapeHtml(place.category || "Kuliner")}</small>
      </div>
    `);

    marker.on("click", () => selectPlace(place.id));
    marker.addTo(markerLayer);
    markers.set(place.id, marker);
  }
}

function renderPlaceList(places) {
  if (!places.length) {
    elements.placeList.className = "place-list empty-state";
    elements.placeList.textContent = "Belum ada kontribusi yang cocok dengan filter.";
    return;
  }

  elements.placeList.className = "place-list";
  elements.placeList.innerHTML = "";

  for (const place of places.slice(0, 80)) {
    const button = document.createElement("button");
    button.className = "place-item";
    button.innerHTML = `
      <div class="item-title">${escapeHtml(place.placeName || "Tempat kuliner")}</div>
      <div>${escapeHtml(titleCase(place.foodName || "Makanan"))}</div>
      <div class="item-meta">
        <span class="meta-pill">${escapeHtml(place.area || "Malang")}</span>
        <span class="meta-pill">${escapeHtml(place.category || "Kuliner")}</span>
        ${place.priceRange ? `<span class="meta-pill">${escapeHtml(place.priceRange)}</span>` : ""}
      </div>
    `;
    button.addEventListener("click", () => selectPlace(place.id, true));
    elements.placeList.appendChild(button);
  }
}

function renderPopularList(places) {
  if (!places.length) {
    elements.popularList.className = "popular-list empty-state";
    elements.popularList.textContent = "Belum ada data.";
    return;
  }

  const groups = new Map();
  for (const place of places) {
    const food = normalizeFoodName(place.foodName || "Makanan");
    const area = place.area || "Malang";
    const key = `${area}::${food}`;
    const current = groups.get(key) || { food, area, count: 0, sampleId: place.id };
    current.count += 1;
    groups.set(key, current);
  }

  const sorted = [...groups.values()].sort((a, b) => b.count - a.count || a.food.localeCompare(b.food)).slice(0, 12);
  elements.popularList.className = "popular-list";
  elements.popularList.innerHTML = "";

  for (const item of sorted) {
    const button = document.createElement("button");
    button.className = "popular-item";
    button.innerHTML = `
      <div class="item-title">${escapeHtml(titleCase(item.food))}</div>
      <div class="item-meta">
        <span class="meta-pill">${escapeHtml(item.area)}</span>
        <span class="meta-pill">${item.count} kontribusi</span>
      </div>
    `;
    button.addEventListener("click", () => selectPlace(item.sampleId, true));
    elements.popularList.appendChild(button);
  }
}

function getFilteredPlaces() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const area = elements.areaFilter.value;
  const category = elements.categoryFilter.value;

  return allPlaces.filter((place) => {
    const haystack = [place.placeName, place.foodName, place.description, place.area, place.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (area && place.area !== area) return false;
    if (category && place.category !== category) return false;
    return true;
  });
}

function selectPlace(placeId, fly = false) {
  const place = allPlaces.find((entry) => entry.id === placeId);
  if (!place) return;
  selectedPlaceId = placeId;

  elements.detailEmpty.classList.add("hidden");
  elements.detailContent.classList.remove("hidden");
  renderPlaceDetail(place);
  subscribeComments(place.id);

  const marker = markers.get(place.id);
  if (marker) {
    marker.openPopup();
  }
  if (fly && map && typeof place.lat === "number" && typeof place.lng === "number") {
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
  }
}

function renderPlaceDetail(place) {
  const photoHtml = Array.isArray(place.photoUrls) && place.photoUrls.length
    ? `<div class="detail-photos">${place.photoUrls.slice(0, 8).map((url) => `<img src="${escapeAttribute(url)}" alt="Foto ${escapeAttribute(place.foodName || "kuliner")}" loading="lazy" />`).join("")}</div>`
    : `<p class="empty-state">Belum ada foto untuk titik ini.</p>`;

  const authorPhoto = place.author?.photoURL ? `<img src="${escapeAttribute(place.author.photoURL)}" alt="" />` : "";
  const authorName = place.author?.displayName || "Kontributor";

  elements.detailBody.innerHTML = `
    <p class="eyebrow">${escapeHtml(place.area || "Kota Malang")}</p>
    <h2>${escapeHtml(place.placeName || "Tempat kuliner")}</h2>
    <h3>${escapeHtml(titleCase(place.foodName || "Makanan"))}</h3>
    <div class="item-meta">
      <span class="meta-pill">${escapeHtml(place.category || "Kuliner")}</span>
      ${place.priceRange ? `<span class="meta-pill">${escapeHtml(place.priceRange)}</span>` : ""}
      <span class="meta-pill">${place.halalFriendly ? "Muslim friendly" : "Cek lagi halal"}</span>
    </div>
    <div class="author-row">${authorPhoto}<span>Ditambahkan oleh ${escapeHtml(authorName)} · ${formatDate(place.createdAt)}</span></div>
    ${photoHtml}
    ${place.description ? `<p>${escapeHtml(place.description)}</p>` : ""}
  `;
}

function subscribeComments(placeId) {
  if (unsubscribeComments) unsubscribeComments();

  const commentsQuery = query(
    collection(db, "places", placeId, "comments"),
    orderBy("createdAt", "desc"),
    limit(80)
  );

  unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderComments(comments);
  }, (error) => {
    elements.commentsList.textContent = readableError(error);
  });
}

function renderComments(comments) {
  if (!comments.length) {
    elements.commentsList.className = "comments-list empty-state";
    elements.commentsList.textContent = "Belum ada komentar. Jadilah yang pertama memberi pengalaman.";
    return;
  }

  elements.commentsList.className = "comments-list";
  elements.commentsList.innerHTML = "";

  for (const comment of comments) {
    const div = document.createElement("div");
    div.className = "comment-item";
    const photo = comment.author?.photoURL ? `<img src="${escapeAttribute(comment.author.photoURL)}" alt="" />` : "";
    div.innerHTML = `
      <div class="comment-head">${photo}<span>${escapeHtml(comment.author?.displayName || "Kontributor")}</span><span class="muted">${formatDate(comment.createdAt)}</span></div>
      <p>${escapeHtml(comment.text || "")}</p>
    `;
    elements.commentsList.appendChild(div);
  }
}

function clearDetail() {
  selectedPlaceId = null;
  elements.detailEmpty.classList.remove("hidden");
  elements.detailContent.classList.add("hidden");
  elements.detailBody.innerHTML = "";
  elements.commentsList.innerHTML = "";
  if (unsubscribeComments) unsubscribeComments();
  unsubscribeComments = null;
}

function openPlaceDialog(latlng) {
  selectedLatLng = latlng;
  elements.placeForm.reset();
  elements.halalInput.checked = true;
  const guessedArea = guessArea(latlng.lat, latlng.lng);
  elements.areaInput.value = guessedArea;
  elements.categoryInput.value = CATEGORIES[0];
  elements.selectedPointText.textContent = `Titik: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)} · perkiraan area ${guessedArea}`;
  elements.formMessage.textContent = "";
  elements.placeDialog.showModal();
}

function closePlaceDialog() {
  elements.placeDialog.close();
  selectedLatLng = null;
}

async function savePlace() {
  if (!currentUser || !selectedLatLng) return;

  const files = [...elements.photoInput.files].slice(0, 4);
  const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
  if (tooLarge) {
    elements.formMessage.textContent = `Foto ${tooLarge.name} terlalu besar. Maksimal 5 MB per foto.`;
    return;
  }

  elements.savePlaceButton.disabled = true;
  elements.formMessage.textContent = files.length ? "Menyimpan data dan mengunggah foto..." : "Menyimpan data...";

  try {
    const payload = {
      placeName: elements.placeNameInput.value.trim(),
      foodName: normalizeFoodName(elements.foodNameInput.value),
      area: elements.areaInput.value,
      category: elements.categoryInput.value,
      priceRange: elements.priceInput.value.trim(),
      halalFriendly: elements.halalInput.checked,
      description: elements.descriptionInput.value.trim(),
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng,
      photoUrls: [],
      author: userPayload(currentUser),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const placeRef = await addDoc(collection(db, "places"), payload);

    const photoUrls = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase();
      const storagePath = `places/${placeRef.id}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
      photoUrls.push(await getDownloadURL(storageRef));
    }

    if (photoUrls.length) {
      await updateDoc(doc(db, "places", placeRef.id), {
        photoUrls,
        updatedAt: serverTimestamp()
      });
    }

    elements.formMessage.textContent = "Berhasil disimpan.";
    addMode = false;
    elements.addPointButton.textContent = "Tambah titik kuliner";
    elements.mapHint.textContent = "Kontribusi berhasil. Kamu bisa tambah titik lain kapan saja.";
    closePlaceDialog();
    setTimeout(() => selectPlace(placeRef.id, true), 400);
  } catch (error) {
    elements.formMessage.textContent = readableError(error);
  } finally {
    elements.savePlaceButton.disabled = false;
  }
}

async function saveComment() {
  if (!currentUser || !selectedPlaceId) return;
  const text = elements.commentText.value.trim();
  if (!text) return;

  const button = elements.commentForm.querySelector("button");
  button.disabled = true;

  try {
    await addDoc(collection(db, "places", selectedPlaceId, "comments"), {
      text,
      author: userPayload(currentUser),
      createdAt: serverTimestamp()
    });
    elements.commentText.value = "";
  } catch (error) {
    alert(readableError(error));
  } finally {
    button.disabled = false;
  }
}

function renderUserChip(user) {
  const photo = user.photoURL ? `<img src="${escapeAttribute(user.photoURL)}" alt="" />` : "";
  elements.userChip.innerHTML = `${photo}<span>${escapeHtml(user.displayName || user.email || "Pengguna")}</span>`;
}

function fillSelect(select, labels, values) {
  select.innerHTML = "";
  labels.forEach((label, index) => {
    const option = document.createElement("option");
    option.value = values[index];
    option.textContent = label;
    select.appendChild(option);
  });
}

function guessArea(lat, lng) {
  if (lat > -7.943 && lng < 112.642) return "Lowokwaru";
  if (lat > -7.956 && lng >= 112.642) return "Blimbing";
  if (lat < -8.000 && lng < 112.642) return "Sukun";
  if (lat < -7.982 && lng >= 112.642) return "Kedungkandang";
  return "Klojen";
}

function isInsideMalangBounds(lat, lng) {
  return lat >= MALANG_BOUNDS[0][0] &&
    lat <= MALANG_BOUNDS[1][0] &&
    lng >= MALANG_BOUNDS[0][1] &&
    lng <= MALANG_BOUNDS[1][1];
}

function normalizeFoodName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : "")
    .join(" ");
}

function userPayload(user) {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email || "Pengguna",
    email: user.email || "",
    photoURL: user.photoURL || ""
  };
}

function categoryEmoji(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("bakso") || value.includes("mie")) return "🍜";
  if (value.includes("nasi") || value.includes("lalapan")) return "🍚";
  if (value.includes("soto") || value.includes("rawon") || value.includes("sup")) return "🥣";
  if (value.includes("jajanan")) return "🥟";
  if (value.includes("kopi") || value.includes("dessert")) return "☕";
  if (value.includes("seafood")) return "🐟";
  if (value.includes("ayam") || value.includes("bebek")) return "🍗";
  if (value.includes("vegetarian")) return "🥗";
  return "🍽️";
}

function formatDate(timestamp) {
  if (!timestamp) return "baru saja";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "baru saja";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function readableError(error) {
  const message = error?.message || String(error);
  if (message.includes("auth/unauthorized-domain")) {
    return "Domain belum diizinkan di Firebase Authentication. Tambahkan domain GitHub Pages kamu di Authorized domains.";
  }
  if (message.includes("permission-denied")) {
    return "Akses ditolak oleh Firebase Rules. Cek firestore.rules dan storage.rules.";
  }
  if (message.includes("storage/unauthorized")) {
    return "Upload gambar ditolak oleh Storage Rules. Cek aturan Storage dan pastikan sudah login.";
  }
  return message;
}
