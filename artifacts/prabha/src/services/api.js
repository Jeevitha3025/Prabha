import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";

// ─── 1. FIREBASE EMAIL AUTH ───────────────────────────────────────────────────

export async function registerUser(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return { ok: true, uid: cred.user.uid, email };
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { ok: true, uid: cred.user.uid, email };
}

// Legacy stubs kept so no other import breaks
export async function sendOtp() { throw new Error("Phone auth disabled"); }
export async function verifyOtp() { return { ok: false }; }

// ─── 2. FIRESTORE — User storage with unique UID ─────────────────────────────

export async function createUser({ name, phone, role }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const userRef = doc(db, "users", uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid,
      name,
      phone,
      role,
      createdAt: serverTimestamp(),
    });
  }

  return { id: uid, name, phone, role };
}

export async function saveProfile(profile) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "users", uid), {
    profile,
    updatedAt: serverTimestamp(),
  });
}

// ─── 3. MENTOR VERIFICATION ──────────────────────────────────────────────────
// After submit: go to Firebase Console → Firestore → users → {uid}
// Change verificationStatus from "pending" to "approved" manually.

export async function submitMentorDocuments(files, profile) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const urls = await Promise.all(
    Array.from(files).map(async (file) => {
      const fileRef = ref(storage, `mentor-docs/${uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    })
  );

  await setDoc(
    doc(db, "users", uid),
    {
      mentorProfile: { ...profile, docUrls: urls },
      verificationStatus: "pending",
      verificationSubmittedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { status: "pending" };
}

export async function getMentorStatus() {
  const uid = auth.currentUser?.uid;
  if (!uid) return "pending";
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().verificationStatus ?? "pending" : "pending";
}

// Real-time listener — call this in useEffect, return the unsubscribe fn
export function listenMentorStatus(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback(snap.data().verificationStatus ?? "pending");
  });
}

// Dev helper only — in production you do this from Firebase Console
export async function setMentorStatus(status) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "users", uid), { verificationStatus: status });
  return status;
}

// ─── 4. MENTOR MATCHING ──────────────────────────────────────────────────────

const DOMAIN_MAP = {
  "🧵 Tailoring":    "Textiles",
  "🧶 Weaving":      "Textiles",
  "🍲 Cooking":      "Food",
  "🌾 Farming":      "Agri",
  "🌿 Herbal":       "Health",
  "🏺 Pottery":      "Craft",
  "📿 Jewellery":    "Craft",
  "🎨 Art":          "Craft",
  "💅 Beauty":       "Beauty",
  "🖥️ Digital":      "Digital",
  "📷 Photography":  "Digital",
};

const MENTOR_FALLBACK = [
  { id: "meena",  avatar: "👩🏽‍🌾", name: "Meena K.",  domains: "Textiles · Orders",  languages: "Tamil · English",   years: 8,  rating: "4.8", slots: ["09:30","12:00","17:30"] },
  { id: "sunita", avatar: "👩🏽‍🍳", name: "Sunita V.", domains: "Food · Pricing",     languages: "Hindi · English",   years: 15, rating: "4.9", slots: ["10:00","14:30","18:00"] },
  { id: "asha",   avatar: "👩🏽‍🔬", name: "Asha P.",   domains: "Wellness · Markets", languages: "Gujarati · Hindi",  years: 10, rating: "4.7", slots: ["08:30","13:00","16:00"] },
];

export async function getMentorsForUser(profile) {
  const skills = profile?.skills || [];
  const wantedDomains = [...new Set(skills.map((s) => DOMAIN_MAP[s] || "Other"))];

  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "mentor"),
      where("verificationStatus", "==", "approved")
    );
    const snap = await getDocs(q);
    if (snap.empty) return MENTOR_FALLBACK;

    return snap.docs
      .map((d) => {
        const data = d.data();
        const mp = data.mentorProfile || {};
        const domainList = mp.domains || [];
        return {
          id: d.id,
          avatar: "👩🏽",
          name: data.name,
          domains: domainList.join(" · "),
          languages: (mp.spoken || []).join(" · "),
          years: mp.years || 0,
          rating: "4.8",
          slots: ["09:30", "12:00", "17:30"],
          _overlap: domainList.filter((dom) => wantedDomains.includes(dom)).length,
        };
      })
      .sort((a, b) => b._overlap - a._overlap);
  } catch {
    return MENTOR_FALLBACK;
  }
}

// ─── 5. PERSONALISED ROADMAPS ─────────────────────────────────────────────────

const CATALOGUE = [
  { id: "uniform",  emoji: "🏫", name: "School Uniform Stitching",    desc: "Demand peaks before June and December school terms.",          startup: "₹8,000",  time: "8 hrs/wk",  demand: "High 🔥",     scheme: "Mudra Shishu up to ₹50,000",        mentor: "Meena K.",  skillTags: ["Tailoring","Weaving"],  resourceTags: ["Sewing Machine"], minHours: 5,  whyFits: ["Your tailoring skill can begin from home.", "", "You can start with a small first order."] },
  { id: "millet",   emoji: "🌾", name: "Millet Snack Production",      desc: "Three nearby buyers are looking for local millet snacks.",    startup: "₹12,000", time: "10 hrs/wk", demand: "Growing 📈",  scheme: "PMFME 35% subsidy",                 mentor: "Sunita V.", skillTags: ["Cooking"],             resourceTags: ["Kitchen","Land"],  minHours: 5,  whyFits: ["Local ingredients keep first batches simple.", "", "Flexible hours work around family time."] },
  { id: "herbal",   emoji: "🌿", name: "Herbal & Home Remedy Products", desc: "A steady market for trusted, locally made wellness products.", startup: "₹5,000",  time: "5 hrs/wk",  demand: "Steady 📊",   scheme: "PM Vishwakarma up to ₹3 Lakh",      mentor: "Asha P.",   skillTags: ["Herbal"],              resourceTags: ["Land"],            minHours: 0,  whyFits: ["You can learn one product at a time.", "", "Local stories help build customer trust."] },
  { id: "pottery",  emoji: "🏺", name: "Handmade Pottery & Décor",      desc: "Growing urban demand for handmade home décor.",               startup: "₹6,000",  time: "6 hrs/wk",  demand: "Growing 📈",  scheme: "PM Vishwakarma up to ₹3 Lakh",      mentor: "Priya M.",  skillTags: ["Pottery","Art"],       resourceTags: [],                  minHours: 0,  whyFits: ["Your craft skill translates directly.", "", "Urban buyers pay premium for handmade goods."] },
  { id: "beauty",   emoji: "💅", name: "Home-based Beauty Services",    desc: "High repeat-customer rate in local neighbourhoods.",          startup: "₹4,000",  time: "5 hrs/wk",  demand: "High 🔥",     scheme: "Mudra Shishu up to ₹50,000",        mentor: "Deepa R.",  skillTags: ["Beauty"],              resourceTags: [],                  minHours: 0,  whyFits: ["Start from home with minimal setup.", "", "Word-of-mouth grows quickly in your area."] },
  { id: "digital",  emoji: "🖥️", name: "Digital Services & Data Entry", desc: "Remote work opportunities via freelance platforms.",          startup: "₹0",      time: "10 hrs/wk", demand: "High 🔥",     scheme: "PMEGP up to ₹10 lakh",              mentor: "Kavita S.", skillTags: ["Digital","Photography"], resourceTags: ["Laptop","Smartphone"], minHours: 5, whyFits: ["Use skills you already have.", "", "Start for free on Upwork or Fiverr."] },
];

function scoreOpp(opp, profile) {
  let score = 0;
  const skills    = (profile.skills    || []).map((s) => s.replace(/^[^ ]+ /, ""));
  const resources = (profile.resources || []).map((r) => r.replace(/^[^ ]+ /, ""));
  const hours     = profile.hours?.startsWith("10") ? 10 : profile.hours?.startsWith("5") ? 5 : 0;
  opp.skillTags.forEach((t)    => { if (skills.some((s)    => s.includes(t))) score += 3; });
  opp.resourceTags.forEach((t) => { if (resources.some((r) => r.includes(t))) score += 2; });
  if (hours >= opp.minHours) score += 1;
  return score;
}

export async function getOpportunities(profile) {
  const place = profile?.location || "your district";
  return [...CATALOGUE]
    .map((o) => ({ ...o, _score: scoreOpp(o, profile) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
    .map((o, i) => ({
      ...o,
      rank: i + 1,
      whyFits: [o.whyFits[0], `${place} has demand for this product.`, o.whyFits[2]],
    }));
}

// ─── Remaining mocks (unchanged) ─────────────────────────────────────────────

export async function getMentorRequests() {
  return [
    { id: "r1", entrepreneur: "Kavya", village: "Mandya", skill: "Food products", mode: "Phone" },
    { id: "r2", entrepreneur: "Radha", village: "Koppal", skill: "Tailoring",     mode: "Chat"  },
  ];
}
export async function acceptMentorRequest(id) {
  return { id, accepted: true };
}

export async function bookMentorSlot(mentorId, slot) {
  return {
    id: `booking-${Date.now()}`,
    mentorId,
    slot,
    status: "requested",
  };
}

export async function submitReadiness(answers) {
  return {
    score: answers.reduce((s, a) => s + Number(a || 0), 0),
  };
}

export async function connectGoogleCalendar() {
  return { connected: true };
}

export async function getChatReply(message, history = [], lang = "en-IN", profile = {}) {
  try {
    const response = await fetch("http://localhost:8080/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        language: lang,
        profile,
      }),
    });

    if (!response.ok) {
      throw new Error(`Yojana Mitra API error: ${response.status}`);
    }

    const data = await response.json();

    return data.answer;
  } catch (error) {
    console.error("Yojana Mitra error:", error);

    return {
      reply:
        "Sorry, I couldn't connect to Yojana Mitra right now. Please try again.",
      schemes: [],
    };
  }
}

export async function getSchemes() {
  return [
    { id: "mudra",       emoji: "💰", name: "Mudra Shishu",   benefit: "Up to ₹50,000",         docs: ["Aadhaar card", "Bank details", "Simple business plan"] },
    { id: "vishwakarma", emoji: "🛠️", name: "PM Vishwakarma", benefit: "Up to ₹3 lakh + tool kit", docs: ["Aadhaar card", "Skill proof", "Bank details"] },
    { id: "pmegp",       emoji: "🏭", name: "PMEGP",          benefit: "Up to ₹10 lakh",        docs: ["Project report", "Identity proof", "Bank details"] },
    { id: "pmfme",       emoji: "🥣", name: "PMFME",          benefit: "35% subsidy",           docs: ["Food business plan", "FSSAI plan", "Bank details"] },
    { id: "udyogini",    emoji: "🌱", name: "Udyogini",       benefit: "Support for women",     docs: ["Income proof", "Address proof", "Business plan"] },
    { id: "standup",     emoji: "🚀", name: "Stand Up India", benefit: "Loans for new ventures", docs: ["Business plan", "Identity proof", "Bank details"] },
    { id: "nrml",        emoji: "🤲", name: "DAY-NRLM",       benefit: "SHG enterprise support", docs: ["SHG details", "Identity proof", "Bank details"] },
  ];
}

export async function getLearnerCourses() {
  return [
    { emoji: "🧵", title: "Start with your skill",    duration: 18 },
    { emoji: "💰", title: "Price your first product", duration: 24 },
    { emoji: "📱", title: "Find your first customer", duration: 16 },
  ];
}