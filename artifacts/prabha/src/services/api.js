const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO: replace each mock function with the real PRABHA backend call.
export async function sendOtp(phone) { await wait(); return { ok: true, phone, demoOtp: "123456" }; }
export async function verifyOtp(phone, otp) { await wait(280); return { ok: otp === "123456", phone }; }
export async function createUser(profile) { await wait(320); return { ...profile, id: `PRB-${Math.floor(100000 + Math.random() * 899999)}` }; }
export async function submitMentorDocuments(files, profile) { await wait(650); return { status: "pending", files, profile }; }
export async function getMentorStatus() { await wait(180); return localStorage.getItem("prabha-mentor-status") || "pending"; }
export async function setMentorStatus(status) { localStorage.setItem("prabha-mentor-status", status); return status; }
export async function getOpportunities(profile) {
  await wait(300);
  const place = profile?.location || "your district";
  const skill = profile?.skills?.[0] || "your skills";
  return [
    { rank: 1, emoji: "🏫", name: "School Uniform Stitching", desc: "Demand peaks before June and December school terms.", startup: "₹8,000", time: "8 hrs/wk", demand: "High 🔥", scheme: "Mudra Shishu up to ₹50,000", mentor: "Meena K.", whyFits: [`Your ${skill} skill can begin from home.`, `${place} has regular school demand.`, "You can start with a small first order."] },
    { rank: 2, emoji: "🌾", name: "Millet Snack Production", desc: "Three nearby buyers are looking for local millet snacks.", startup: "₹12,000", time: "10 hrs/wk", demand: "Growing 📈", scheme: "PMFME 35% subsidy", mentor: "Sunita V.", whyFits: ["Local ingredients keep first batches simple.", "Small packs are easy to test with buyers.", "Flexible hours work around family time."] },
    { rank: 3, emoji: "🌿", name: "Herbal & Home Remedy Products", desc: "A steady market for trusted, locally made wellness products.", startup: "₹5,000", time: "5 hrs/wk", demand: "Steady 📊", scheme: "PM Vishwakarma up to ₹3 Lakh + tool kit", mentor: "Asha P.", whyFits: ["You can learn one product at a time.", "Low startup cost keeps risk gentle.", "Local stories help build customer trust."] },
  ];
}
export async function getMentorsForUser(profile) { await wait(240); return [
  { id: "meena", avatar: "👩🏽‍🌾", name: "Meena K.", domains: "Textiles · Orders", languages: "Tamil · English", years: 8, rating: "4.8", slots: ["09:30", "12:00", "17:30"] },
  { id: "sunita", avatar: "👩🏽‍🍳", name: "Sunita V.", domains: "Food · Pricing", languages: "Hindi · English", years: 15, rating: "4.9", slots: ["10:00", "14:30", "18:00"] },
  { id: "asha", avatar: "👩🏽‍🔬", name: "Asha P.", domains: "Wellness · Markets", languages: "Gujarati · Hindi", years: 10, rating: "4.7", slots: ["08:30", "13:00", "16:00"] },
]}; 
export async function getMentorRequests() { await wait(260); return [
  { id: "r1", entrepreneur: "Kavya", village: "Mandya", skill: "Food products", mode: "Phone" },
  { id: "r2", entrepreneur: "Radha", village: "Koppal", skill: "Tailoring", mode: "Chat" },
]; }
export async function acceptMentorRequest(id) { await wait(260); return { id, accepted: true }; }
export async function bookMentorSlot(mentorId, slot) { await wait(420); return { id: `booking-${Date.now()}`, mentorId, slot, status: "requested" }; }
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
export async function submitReadiness(answers) { await wait(500); return { score: answers.reduce((sum, answer) => sum + Number(answer || 0), 0) }; }
export async function connectGoogleCalendar() { await wait(500); return { connected: true }; }
export async function getSchemes() { await wait(160); return [
  { id: "mudra", emoji: "💰", name: "Mudra Shishu", benefit: "Up to ₹50,000", docs: ["Aadhaar card", "Bank details", "Simple business plan"] },
  { id: "vishwakarma", emoji: "🛠️", name: "PM Vishwakarma", benefit: "Up to ₹3 lakh + tool kit", docs: ["Aadhaar card", "Skill proof", "Bank details"] },
  { id: "pmegp", emoji: "🏭", name: "PMEGP", benefit: "Up to ₹10 lakh", docs: ["Project report", "Identity proof", "Bank details"] },
  { id: "pmfme", emoji: "🥣", name: "PMFME", benefit: "35% subsidy", docs: ["Food business plan", "FSSAI plan", "Bank details"] },
  { id: "udyogini", emoji: "🌱", name: "Udyogini", benefit: "Support for women", docs: ["Income proof", "Address proof", "Business plan"] },
  { id: "standup", emoji: "🚀", name: "Stand Up India", benefit: "Loans for new ventures", docs: ["Business plan", "Identity proof", "Bank details"] },
  { id: "nrml", emoji: "🤲", name: "DAY-NRLM", benefit: "SHG enterprise support", docs: ["SHG details", "Identity proof", "Bank details"] },
] }
export async function getLearnerCourses() { await wait(180); return [
  { emoji: "🧵", title: "Start with your skill", duration: 18 },
  { emoji: "💰", title: "Price your first product", duration: 24 },
  { emoji: "📱", title: "Find your first customer", duration: 16 },
] }