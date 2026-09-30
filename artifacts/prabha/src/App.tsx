import { useEffect, useMemo, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
// @ts-ignore JavaScript modules intentionally stay swappable mock services.
import { makeTranslator, languages } from "./i18n/translations";
// @ts-ignore JavaScript modules intentionally stay swappable mock services.
import { useVoice } from "./hooks/useVoice";
// @ts-ignore JavaScript modules intentionally stay swappable quiz data.
import { quiz, quizQuestions } from "./data/quiz";
// @ts-ignore JavaScript mock service layer intentionally has no backend types.
import {
  acceptMentorRequest,
  bookMentorSlot,
  connectGoogleCalendar,
  createUser,
  getChatReply,
  getLearnerCourses,
  getMentorRequests,
  getMentorStatus,
  getMentorsForUser,
  getOpportunities,
  getSchemes,
  sendOtp,
  setMentorStatus,
  submitMentorDocuments,
  submitReadiness,
  verifyOtp,
// @ts-ignore
} from "./services/api";
import "./index.css";

const skills = ["🧵 Tailoring", "🍲 Cooking", "🧶 Weaving", "🌾 Farming", "💅 Beauty", "🏺 Pottery", "📿 Jewellery", "📚 Teaching", "🌿 Herbal", "🎨 Art"];
const resources = ["🧵 Sewing Machine", "🔥 Kitchen", "🌾 Land", "🐄 Livestock", "📱 Smartphone", "Nothing yet"];
const schemesFallback: any[] = [];
const languageOptions = languages as { code: string; label: string; short: string }[];

function SpeakButton({ text, t, lang, id = "listen" }: { text: string; t: (key: string, vars?: any) => string; lang: string; id?: string }) {
  const { speak } = useVoice();
  return <button className="icon-button" type="button" aria-label={t("listen")} data-testid={`button-${id}`} onClick={() => speak(text, lang)} title={t("listen")}>🔊</button>;
}

function VoiceButton({ t, lang, onResult, id }: { t: (key: string, vars?: any) => string; lang: string; onResult: (value: string) => void; id: string }) {
  const { startListening, isListening, isSupported } = useVoice();
  if (!isSupported) return <span className="field-hint" data-testid={`hint-${id}`}>{t("voiceHint")}</span>;
  return <button className="icon-button" type="button" aria-label={t("listen")} data-testid={`button-${id}`} onClick={() => startListening(lang, onResult)}>{isListening ? "⏺️" : "🎤"}</button>;
}

function Topbar({ t, title, onBack, lang, onLanguage }: { t: any; title: string; onBack?: () => void; lang: string; onLanguage: (lang: string) => void }) {
  const { update } = useApp();
  return <header className="topbar">
    {onBack ? <button className="icon-button" type="button" data-testid="button-back" aria-label={t("back")} onClick={onBack}>←</button> : <span style={{ width: 56 }} />}
    <strong className="topbar-title">{title}</strong>
    <button className="icon-button" type="button" aria-label={t("language")} data-testid="button-language" onClick={() => { const next = lang === "en" ? "hi" : lang === "hi" ? "kn" : "en"; onLanguage(next); update({ lang: next }); }}>🌐</button>
  </header>;
}

function BottomNav({ active, t, onNavigate, role = "entrepreneur" }: { active: string; t: any; onNavigate: (screen: string) => void; role?: string }) {
  const items = role === "mentor"
    ? [["mentor-home", "📥", "mentorRequests"], ["mentees", "💬", "mentees"], ["calendar", "📅", "calendar"], ["profile", "👤", "profile"]]
    : [["home", "🏠", "home"], ["schemes", "📋", "schemes"], ["mentors", "🤝", "mentors"], ["profile", "👤", "profile"]];
  return <nav className="bottom-nav" aria-label={t("home")} data-testid="nav-bottom">{items.map(([screen, icon, key]) =>
    <button className={`nav-item ${active === screen ? "active" : ""}`} type="button" key={screen} data-testid={`nav-${screen}`} onClick={() => onNavigate(screen)}><span>{icon}</span>{t(key)}</button>)}</nav>;
}

function Shell({ children, t, title, lang, onLanguage, onBack, nav, active, onNavigate, role }: any) {
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title={title} lang={lang} onLanguage={onLanguage} onBack={onBack} />{children}</div>{nav && <BottomNav active={active} t={t} onNavigate={onNavigate} role={role} />}</div>;
}

function Splash({ t, lang, setLang, onContinue }: any) {
  const { speak } = useVoice();
  return <main className="splash dark-surface"><div className="splash-inner">
    <div className="brand-mark">PRABHA</div><div className="brand-native">प्रभा</div><p className="tagline">{t("brandTagline")}</p><SpeakButton t={t} lang={lang} text={`${t("welcome")}. ${t("brandTagline")}`} id="splash-listen" />
    <span className="eyebrow">{t("chooseLanguage")}</span>
    <div className="language-grid">{languageOptions.map((item) => <button className={`language-pill ${lang === item.code ? "selected" : ""}`} type="button" data-testid={`button-language-${item.code}`} key={item.code} onClick={() => { setLang(item.code); speak(item.code === "hi" ? "PRABHA में आपका स्वागत है" : item.code === "kn" ? "PRABHA ಗೆ ಸ್ವಾಗತ" : "Welcome to PRABHA", item.code === "hi" ? "hi" : item.code === "kn" ? "kn" : "en"); }}>{item.label}{lang === item.code ? " ✓" : ""}</button>)}</div>
    <button className="btn btn-primary btn-wide" type="button" disabled={!lang} data-testid="button-lets-go" onClick={onContinue}>{t("letsGo")}</button>
  </div></main>;
}

function RoleScreen({ t, lang, onChoose }: any) {
  const roles = [["entrepreneur", "🌾", "entrepreneur", "entrepreneurDesc", "role-card"], ["mentor", "🤝", "mentor", "mentorDesc", "role-card mentor"], ["learner", "📚", "learner", "learnerDesc", "role-card learner"]];
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title="PRABHA" lang={lang} onLanguage={() => undefined} /><div className="hero-card"><span className="eyebrow">{t("welcome")}</span><div className="section-heading"><h1>{t("whoAreYou")}</h1><SpeakButton t={t} lang={lang} text={t("whoAreYou")} /></div><p>{t("readyToBegin")}</p></div><div className="role-grid">{roles.map(([value, icon, title, desc, cls]) => <button className={cls} type="button" key={value} data-testid={`button-role-${value}`} onClick={() => onChoose(value)}><h2>{icon} {t(title)}</h2><p>{t(desc)}</p></button>)}</div></div></div>;
}

function Login({ t, lang, role, onBack, onDone }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const { startListening, isSupported } = useVoice();
  const send = async () => { if (name.trim() && phone.length >= 10) { await sendOtp(phone); setStep(2); setError(""); } };
  const verify = async () => { const result = await verifyOtp(phone, otp.join("")); if (!result.ok) { setError(t("wrongOtp")); return; } const user = await createUser({ name, phone, role }); onDone(user); };
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title={t("welcome")} lang={lang} onLanguage={() => undefined} onBack={onBack} />
    <div className="card"><span className="eyebrow">{step === 1 ? t("step", { n: 1, total: 2 }) : t("step", { n: 2, total: 2 })}</span>
      {step === 1 ? <><div className="field"><label htmlFor="name">{t("yourName")}</label><div className="input-with-action"><input id="name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" autoComplete="name" />{isSupported && <button className="icon-button" type="button" data-testid="button-voice-name" onClick={() => startListening(lang, setName)}>🎤</button>}</div></div><div className="field"><label htmlFor="phone">{t("phone")}</label><input id="phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} data-testid="input-phone" /></div><button className="btn btn-primary btn-wide" type="button" data-testid="button-send-otp" disabled={!name.trim() || phone.length < 10} onClick={send}>{t("sendOtp")}</button></> :
      <><p className="muted">{t("otpSent", { phone })}</p><div className="otp-row">{otp.map((digit, index) => <input key={index} inputMode="numeric" maxLength={1} value={digit} aria-label={`${t("enterOtp")} ${index + 1}`} data-testid={`input-otp-${index}`} onChange={(e) => { const next = [...otp]; next[index] = e.target.value.replace(/\D/g, ""); setOtp(next); }} />)}</div>{error && <div className="error-note" role="alert" data-testid="status-otp-error">{error}</div>}<p className="muted small">{t("demoHint")}</p><button className="btn btn-primary btn-wide" type="button" data-testid="button-verify-otp" onClick={verify}>{t("verify")}</button><button className="btn btn-outline btn-wide" type="button" data-testid="button-resend-otp" onClick={send}>{t("resendOtp")}</button></>}
      <p className="field-hint" style={{ marginTop: 18 }}>🔒 {t("consent")}</p>
    </div></div></div>;
}

function EntrepreneurOnboarding({ t, lang, profile, onBack, onDone }: any) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ skills: profile.skills || [], location: profile.location || "", hours: profile.hours || "", resources: profile.resources || [], education: profile.education || "", family: profile.family || "", story: profile.story || "" });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: "skills" | "resources", value: string) => set(key, form[key].includes(value) ? form[key].filter((item: string) => item !== value) : [...form[key], value]);
  const detect = () => navigator.geolocation?.getCurrentPosition((position) => set("location", `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`), () => set("location", ""));
  const next = () => step < 5 ? setStep(step + 1) : onDone(form);
  const headings = ["chooseSkills", "village", "hours", "resources", "tellMore"];
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title={t("completeProfile")} lang={lang} onLanguage={() => undefined} onBack={onBack} /><div className="progress-dots">{[1, 2, 3, 4, 5].map((item) => <span key={item} className={`progress-dot ${item < step ? "done" : item === step ? "active" : ""}`} />)}</div><p className="muted">{t("step", { n: step, total: 5 })}</p><div className="card"><div className="section-heading"><h2>{t(headings[step - 1])}</h2><SpeakButton t={t} lang={lang} text={t(headings[step - 1])} id="onboarding-listen" /></div>
    {step === 1 && <><p className="muted">{t("chooseSkillsHint")}</p><div className="chip-grid">{skills.map((item) => <button className={`chip ${form.skills.includes(item) ? "selected" : ""}`} type="button" key={item} data-testid={`chip-skill-${item.slice(2)}`} onClick={() => toggle("skills", item)}>{item}</button>)}</div></>}
    {step === 2 && <><div className="field"><label htmlFor="village">{t("village")}</label><div className="input-with-action"><input id="village" value={form.location} onChange={(e) => set("location", e.target.value)} data-testid="input-village" /><button className="btn btn-outline" type="button" data-testid="button-detect-location" onClick={detect}>📍 {t("detectLocation")}</button></div>{form.location ? <span className="field-hint" data-testid="status-location">{t("locationCaptured")}</span> : <span className="field-hint">{t("locationDenied")}</span>}</div></>}
    {step === 3 && <div className="segmented">{["<5 hrs", "5–10 hrs", "10+ hrs"].map((item) => <button className={`chip ${form.hours === item ? "selected" : ""}`} type="button" key={item} data-testid={`button-hours-${item}`} onClick={() => set("hours", item)}>{item}</button>)}</div>}
    {step === 4 && <div className="chip-grid">{resources.map((item) => <button className={`chip ${form.resources.includes(item) ? "selected" : ""}`} type="button" key={item} data-testid={`chip-resource-${item.slice(2)}`} onClick={() => toggle("resources", item)}>{item}</button>)}</div>}
    {step === 5 && <><div className="field"><label>{t("education")}</label><div className="choice-grid">{["No formal schooling", "School", "College"].map((item) => <button className={`choice-card ${form.education === item ? "selected" : ""}`} type="button" key={item} data-testid={`choice-education-${item}`} onClick={() => set("education", item)}>{item}</button>)}</div></div><div className="field"><label>{t("family")}</label><div className="choice-grid">{["Supportive", "Needs time", "I decide"].map((item) => <button className={`choice-card ${form.family === item ? "selected" : ""}`} type="button" key={item} data-testid={`choice-family-${item}`} onClick={() => set("family", item)}>{item}</button>)}</div></div><div className="field"><label htmlFor="story">{t("tellMore")}</label><div className="input-with-action"><textarea id="story" value={form.story} placeholder={t("tellMoreHint")} onChange={(e) => set("story", e.target.value)} data-testid="input-story" /><VoiceButton t={t} lang={lang} id="voice-story" onResult={(value) => set("story", `${form.story} ${value}`)} /></div></div></>}
    <button className="btn btn-primary btn-wide" type="button" data-testid="button-onboarding-next" onClick={next}>{step === 5 ? t("findOpportunity") : t("next")}</button>
  </div></div></div>;
}

function OpportunityFinder({ t, lang, profile, onBack, onOpen }: any) {
  const [loading, setLoading] = useState(true); const [items, setItems] = useState<any[]>([]); const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => { getOpportunities(profile).then(setItems).finally(() => setLoading(false)); }, [profile]);
  useEffect(() => { if (!loading) return undefined; const timer = window.setInterval(() => setMessageIndex((current) => (current + 1) % 4), 800); return () => window.clearInterval(timer); }, [loading]);
  if (loading) return <main className="screen-wrap dark-surface"><div className="content-width loading-stage"><div><span className="loading-emoji">🔍</span><h1>{t("opportunityFinder")}</h1><p>{t(["analysing", "checkingDemand", "matchingSchemes", "opportunitiesReady"][messageIndex])}</p></div></div></main>;
  return <Shell t={t} title={t("opportunityFinder")} lang={lang} onLanguage={() => undefined} onBack={onBack}><p className="muted">{t("opportunityFinderHint")}</p><div className="section" style={{ display: "grid", gap: 14 }}>{items.map((item, index) => <div className={`card opportunity-card ${index === 0 ? "best" : index === 1 ? "good" : "warm"}`} key={item.rank} data-testid={`card-opportunity-${item.rank}`}><div className="opportunity-body"><div className="opportunity-title"><span className="rank">{item.rank}</span><div><h3>{item.emoji} {item.name}</h3><p className="muted">{item.desc}</p></div></div><div className="stat-grid"><div className="stat"><strong>{item.startup}</strong><span>₹ startup</span></div><div className="stat"><strong>{item.time}</strong><span>time</span></div><div className="stat"><strong>{item.demand}</strong><span>demand</span></div></div><p className="scheme-line">📋 {item.scheme} · 🤝 {item.mentor}</p><button className="btn btn-secondary btn-wide" type="button" data-testid={`button-explore-${item.rank}`} onClick={() => onOpen(item)}>{t("explore")}</button></div></div>)}</div></Shell>;
}

function OpportunityDetail({ t, lang, opportunity, onBack, onQuiz, onChat, onBook, onApply }: any) {
  const journey = [["🔍", "discover"], ["🤝", "mentorStep"], ["📋", "schemeStep"], ["📊", "ready"], ["🛒", "market"]];
  return <Shell t={t} title={`${opportunity.emoji} ${opportunity.name}`} lang={lang} onLanguage={() => undefined} onBack={onBack}><div className="card tint-card"><h2>{t("whyFits")}</h2><ul className="list">{opportunity.whyFits.map((reason: string) => <li key={reason}><span>✓</span>{reason}</li>)}</ul></div><div className="section"><div className="section-heading"><h2>{t("journey")}</h2><SpeakButton t={t} lang={lang} text={t("journey")} /></div><div className="journey">{journey.map(([icon, key], index) => <div className={`journey-step ${index < 2 ? "done" : index === 2 ? "active" : ""}`} key={key}><span>{icon}</span>{index < 2 ? "✓ " : ""}{t(key)}</div>)}</div></div><div className="section card"><h2>{t("matchedMentor")}</h2><p>👩🏽‍🌾 <strong>{opportunity.mentor}</strong></p><p className="muted">Textiles · Hindi · English · 8 years · ⭐ 4.8</p><div className="button-row"><button className="btn btn-outline" type="button" data-testid="button-connect-mentor" onClick={() => onChat("connection")}>📞 {t("connect")}</button><button className="btn btn-outline" type="button" data-testid="button-message-mentor" onClick={() => onChat("message")}>💬 {t("message")}</button><button className="btn btn-primary" type="button" data-testid="button-book-detail" onClick={onBook}>📅 {t("book")}</button></div></div><div className="section card scheme-card"><h2>📋 {opportunity.scheme}</h2><p className="benefit">₹50,000</p><span className="tag">{t("indicative")}</span><h3>{t("checklist")}</h3><ul className="list">{["Aadhaar card", "Bank details", "Simple business plan"].map((item) => <li key={item}>☐ {item}</li>)}</ul><button className="btn btn-primary btn-wide" type="button" data-testid="button-apply-detail" onClick={onApply}>{t("apply")}</button></div><div className="section card"><div className="section-heading"><h2>📊 {t("readiness")}</h2><SpeakButton t={t} lang={lang} text={t("readiness")} /></div><p className="muted">{t("readinessHint")}</p><button className="btn btn-secondary btn-wide" type="button" data-testid="button-start-quiz-detail" onClick={onQuiz}>{t("startQuizCaps")}</button></div><div className="section hero-card"><p>🛒 {t("esarasBanner")}</p></div></Shell>;
}

function Home({ t, lang, profile, score, onOpportunity, onQuiz, onChat, onNavigate }: any) {
  const name = profile.name || "friend";
  return <Shell t={t} title={t("home")} lang={lang} onLanguage={() => undefined} nav active="home" onNavigate={onNavigate}><div className="hero-card"><span className="eyebrow">{t("readyToBegin")}</span><h1>{t("hello", { name })}</h1><p>{t("nextStepText")}</p><button className="btn btn-primary" type="button" style={{ marginTop: 18 }} data-testid="button-ask-prabha" onClick={onChat}>🎤 {t("askPrabha")}</button></div><div className="section card tint-card"><div className="section-heading"><h2>{t("yourOpportunities")}</h2><span>🌾</span></div><p className="muted">{t("opportunityFinderHint")}</p><button className="btn btn-secondary btn-wide" type="button" data-testid="button-opportunity-finder" onClick={onOpportunity}>{t("opportunityFinder")} →</button></div><div className="section card"><div className="score-layout"><div className="score-ring">{score ?? "—"}</div><div><h2 style={{ margin: 0 }}>{t("readiness")}</h2><p className="muted">{t("readinessHint")}</p></div></div><button className="btn btn-outline btn-wide" type="button" data-testid="button-start-quiz-home" onClick={onQuiz}>{t("startQuiz")}</button></div><div className="section card"><span className="eyebrow">{t("nextStep")}</span><p>{t("nextStepText")}</p></div></Shell>;
}

function Schemes({ t, lang, onNavigate, onChat, onBack, onApply }: any) {
  const [items, setItems] = useState<any[]>(schemesFallback);
  useEffect(() => { getSchemes().then(setItems); }, []);
  return <Shell t={t} title={t("schemes")} lang={lang} onLanguage={() => undefined} onBack={onBack} nav active="schemes" onNavigate={onNavigate}><p className="muted">{t("schemesHint")}</p><button className="btn btn-secondary btn-wide" type="button" data-testid="button-ask-yojana" onClick={onChat}>📋 {t("askYojana")}</button><div className="section" style={{ display: "grid", gap: 12 }}>{items.map((scheme) => <div className="card scheme-card" key={scheme.id} data-testid={`card-scheme-${scheme.id}`}><h2>{scheme.emoji} {scheme.name}</h2><p className="benefit">{scheme.benefit}</p><span className="tag">{t("indicative")}</span><p className="muted small">{t("documents")}: {scheme.docs.join(" · ")}</p><button className="btn btn-primary" type="button" data-testid={`button-apply-${scheme.id}`} onClick={() => onApply(scheme)}>{t("apply")}</button></div>)}</div></Shell>;
}

function MentorList({ t, lang, onNavigate, onBack, onSelect }: any) {
  const [mentors, setMentors] = useState<any[]>([]);
  useEffect(() => { getMentorsForUser({}).then(setMentors); }, []);
  return <Shell t={t} title={t("mentors")} lang={lang} onLanguage={() => undefined} onBack={onBack} nav active="mentors" onNavigate={onNavigate}><p className="muted">{t("mentorHint")}</p><div className="section" style={{ display: "grid", gap: 12 }}>{mentors.map((mentor) => <button className="card" style={{ textAlign: "left" }} type="button" key={mentor.id} data-testid={`card-mentor-${mentor.id}`} onClick={() => onSelect(mentor)}><div className="opportunity-title"><span style={{ fontSize: "2rem" }}>{mentor.avatar}</span><div><h2 style={{ margin: 0 }}>{mentor.name}</h2><p className="muted">{mentor.domains}</p><p className="small">{mentor.languages} · {t("years", { n: mentor.years })} · ⭐ {mentor.rating}</p></div></div></button>)}</div></Shell>;
}

function Booking({ t, mentor, onClose, onBooked }: any) {
  const [mode, setMode] = useState("Phone"); const [slot, setSlot] = useState(mentor.slots[0]); const [date, setDate] = useState("2025-06-12"); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); const booking = await bookMentorSlot(mentor.id, `${date} · ${slot} · ${mode}`); setBusy(false); onBooked(booking); };
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal-card"><div className="section-heading"><h2>{t("book")} · {mentor.name}</h2><button className="icon-button" type="button" data-testid="button-close-booking" aria-label={t("close")} onClick={onClose}>×</button></div><p className="muted">{t("sessionType")}</p><div className="choice-grid">{[["Phone", "📞"], ["Chat", "💬"], ["Video", "📹"]].map(([value, icon]) => <button className={`choice-card ${mode === value ? "selected" : ""}`} type="button" key={value} data-testid={`choice-mode-${value}`} onClick={() => setMode(value)}>{icon} {t(value === "Phone" ? "phoneCall" : value.toLowerCase())}</button>)}</div><div className="field"><label htmlFor="date">{t("chooseDate")}</label><input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-booking-date" /></div><div className="field"><label>{t("chooseTime")}</label><div className="button-row">{mentor.slots.map((value: string) => <button className={`btn ${slot === value ? "btn-primary" : "btn-outline"}`} type="button" key={value} data-testid={`button-slot-${value}`} onClick={() => setSlot(value)}>{value}</button>)}</div></div><button className="btn btn-primary btn-wide" type="button" disabled={busy} data-testid="button-confirm-booking" onClick={submit}>{busy ? "…" : t("confirmBooking")}</button></div></div>;
}

function Quiz({ t, lang, onClose, onResult, onLearning }: any) {
  const [index, setIndex] = useState(0); const [answers, setAnswers] = useState<number[]>([]); const [score, setScore] = useState<number | null>(null); const q = quiz[index];
  const choose = async (value: number) => { const next = [...answers, value]; if (index < quiz.length - 1) setAnswers(next), setIndex(index + 1); else { const result = await submitReadiness(next); setAnswers(next); setScore(result.score); onResult(result.score); } };
  return <div className="modal-backdrop"><div className="modal-card" style={{ maxHeight: "92dvh", overflow: "auto" }}>{score === null ? <><div className="section-heading"><h2>{t("quizQuestion", { n: index + 1 })}</h2><button className="icon-button" type="button" data-testid="button-close-quiz" aria-label={t("close")} onClick={onClose}>×</button></div><div className="progress-bar"><span style={{ width: `${((index + 1) / 10) * 100}%` }} /></div><div className="section-heading" style={{ marginTop: 22 }}><h2>{quizQuestions[lang][index]}</h2><SpeakButton t={t} lang={lang} text={quizQuestions[lang][index]} id="quiz-listen" /></div><div style={{ display: "grid", gap: 10 }}>{(q.options[lang] as string[]).map((option: string, optionIndex: number) => <button className="choice-card" style={{ minHeight: 70 }} type="button" key={option} data-testid={`quiz-option-${index}-${optionIndex}`} onClick={() => choose(q.scores[optionIndex])}>{option}</button>)}</div></> : <QuizResult t={t} score={score} onClose={onClose} onLearning={onLearning} />}</div></div>;
}
function QuizResult({ t, score, onClose, onLearning }: any) {
  const ready = score >= 75; const almost = score >= 50;
  return <><div className={`card ${ready ? "status-approved" : almost ? "tint-card" : "status-rejected"}`}><div className="score-layout"><div className="score-ring">{score}</div><div><span className="eyebrow">{t("score")}</span><h2>{ready ? t("youreReady") : almost ? t("almostReady") : t("goodStart")}</h2></div></div></div>{ready ? <><p>{t("esarasBanner")}</p><button className="btn btn-primary btn-wide" type="button" data-testid="button-list-esaras" onClick={() => onClose("esAras")}>{t("listEsaras")}</button></> : almost ? <><h3>{t("retake")}</h3><ul className="list"><li>✓ {t("actionOne")}</li><li>✓ {t("actionTwo")}</li><li>✓ {t("actionThree")}</li></ul><button className="btn btn-outline btn-wide" type="button" data-testid="button-close-quiz-result" onClick={onClose}>{t("close")}</button></> : <><p>{t("actionOne")}</p><button className="btn btn-primary btn-wide" type="button" data-testid="button-start-learning" onClick={onLearning}>{t("startLearning")}</button></>}</>;
}

function Chat({ t, lang, onClose }: any) {
  const [messages, setMessages] = useState([{ from: "bot", text: t("chatWelcome") }]); const [input, setInput] = useState(""); const [typing, setTyping] = useState(false); const { startListening, speak } = useVoice();
  const send = async (text = input) => { if (!text.trim()) return; setMessages((current) => [...current, { from: "user", text }]); setInput(""); setTyping(true); const reply = await getChatReply(text, messages, lang); setMessages((current) => [...current, { from: "bot", text: reply }]); setTyping(false); };
  return <div className="chat-overlay"><div className="chat-panel"><div className="chat-header"><h2>📋 {t("chatTitle")}</h2><button className="icon-button" type="button" data-testid="button-close-chat" aria-label={t("close")} onClick={onClose}>×</button></div><div className="chat-messages">{messages.map((message, index) => <div className={`bubble ${message.from}`} key={`${message.text}-${index}`} data-testid={`message-${index}`}>{message.text}{message.from === "bot" && <button className="icon-button" style={{ display: "block", marginTop: 8 }} type="button" data-testid={`button-listen-message-${index}`} aria-label={t("listen")} onClick={() => speak(message.text, lang)}>🔊</button>}</div>)}{typing && <div className="typing">{t("typing")}</div>}</div><div className="suggestions">{[["loan", "loan"], ["whichScheme", "whichScheme"], ["registration", "registration"]].map(([key, query]) => <button className="suggestion" type="button" key={key} data-testid={`button-suggestion-${key}`} onClick={() => send(query)}>{t(key)}</button>)}</div><div className="chat-input"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("typeMessage")} data-testid="input-chat" onKeyDown={(e) => e.key === "Enter" && send()} /><button className="icon-button" type="button" data-testid="button-voice-chat" aria-label={t("listen")} onClick={() => startListening(lang, setInput)}>🎤</button><button className="icon-button" type="button" data-testid="button-send-chat" aria-label={t("submit")} onClick={() => send()}>➤</button></div></div></div>;
}

function MentorOnboarding({ t, lang, user, onBack, onDone }: any) {
  const [domains, setDomains] = useState<string[]>([]); const [spoken, setSpoken] = useState<string[]>([lang]); const [years, setYears] = useState(4); const [files, setFiles] = useState<File[]>([]); const [mode, setMode] = useState("Phone");
  const toggle = (list: string[], value: string, setter: any) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const submit = async () => { const result = await submitMentorDocuments(files, { name: user.name, domains, spoken, years, mode }); onDone(result.status); };
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title={t("mentorOnboarding")} lang={lang} onLanguage={() => undefined} onBack={onBack} /><div className="card"><div className="field"><label htmlFor="mentor-name">{t("mentorName")}</label><input id="mentor-name" defaultValue={user.name} data-testid="input-mentor-name" /></div><div className="field"><label>{t("domain")}</label><div className="chip-grid">{["Food", "Textiles", "Health", "Agri", "Digital", "Finance", "Legal", "Logistics"].map((item: string) => <button className={`chip ${domains.includes(item) ? "selected" : ""}`} type="button" key={item} data-testid={`chip-domain-${item}`} onClick={() => toggle(domains, item, setDomains)}>{item}</button>)}</div></div><div className="field"><label>{t("experience")}: <strong>{years}</strong></label><div className="button-row"><button className="icon-button" type="button" data-testid="button-years-down" onClick={() => setYears(Math.max(0, years - 1))}>−</button><button className="icon-button" type="button" data-testid="button-years-up" onClick={() => setYears(Math.min(40, years + 1))}>+</button></div></div><div className="field"><label>{t("spokenLanguages")}</label><div className="button-row">{languageOptions.map((item) => <button className={`btn ${spoken.includes(item.code) ? "btn-primary" : "btn-outline"}`} type="button" key={item.code} data-testid={`button-spoken-${item.code}`} onClick={() => toggle(spoken, item.code, setSpoken)}>{item.label}</button>)}</div></div><div className="field"><label>{t("helpMode")}</label><div className="choice-grid">{[["Phone", "📞"], ["Chat", "💬"], ["Video", "📹"]].map(([value, icon]) => <button className={`choice-card ${mode === value ? "selected" : ""}`} type="button" key={value} data-testid={`choice-help-${value}`} onClick={() => setMode(value)}>{icon} {t(value === "Phone" ? "phoneCall" : value.toLowerCase())}</button>)}</div></div><div className="field"><label htmlFor="mentor-files">{t("uploadDocuments")}</label><p className="field-hint">{t("uploadHint")}</p><input id="mentor-files" type="file" accept="image/*,.pdf" multiple capture="environment" data-testid="input-mentor-files" onChange={(e) => setFiles(Array.from(e.target.files || []))} />{files.map((file) => <div className="file-preview" key={file.name}>📄 {file.name}</div>)}</div><button className="btn btn-primary btn-wide" type="button" data-testid="button-submit-verification" onClick={submit}>{t("submitVerification")}</button></div></div></div>;
}

function MentorHome({ t, lang, user, onNavigate, onBack, onStatus, initialTab = "mentor-home" }: any) {
  const [tab, setTab] = useState(initialTab); const [requests, setRequests] = useState<any[]>([]); const [status, setStatus] = useState("pending"); const [calendar, setCalendar] = useState(false); const [dev, setDev] = useState(false);
  useEffect(() => { getMentorRequests().then(setRequests); getMentorStatus().then(setStatus); }, []);
  const changeStatus = async (next: string) => { await setMentorStatus(next); setStatus(next); onStatus(next); };
  if (status !== "approved") return <Shell t={t} title={t("verificationPending")} lang={lang} onLanguage={() => undefined} onBack={onBack}><div className={`card status-${status}`}><div style={{ fontSize: "3rem" }}>{status === "rejected" ? "🙏" : "🕊️"}</div><h2>{status === "rejected" ? t("verificationRejected") : t("verificationPending")}</h2><p>{t("verificationCopy")}</p>{status === "rejected" && <button className="btn btn-primary" type="button" data-testid="button-upload-again" onClick={() => onBack("mentor-onboarding")}>{t("uploadAgain")}</button>}</div><button className="dev-affordance" type="button" aria-label={t("developer")} data-testid="button-dev-menu" onClick={() => setDev(!dev)} />{dev && <div className="card section"><h3>{t("statusSwitcher")}</h3>{["pending", "approved", "rejected"].map((value) => <button className="btn btn-outline" style={{ margin: 4 }} type="button" key={value} data-testid={`button-status-${value}`} onClick={() => changeStatus(value)}>{t(value)}</button>)}</div>}</Shell>;
  return <Shell t={t} title={t(tab === "mentor-home" ? "mentorRequests" : tab)} lang={lang} onLanguage={() => undefined} nav active={tab} onNavigate={(next: string) => { setTab(next); onNavigate(next); }} role="mentor"><div className="card tint-card"><span className="eyebrow">{t("mentor")}</span><h2>{t("hello", { name: user.name })}</h2><p>{t("readyToBegin")}</p></div>{tab === "mentor-home" && <div className="section" style={{ display: "grid", gap: 12 }}>{requests.map((request) => <div className="card" key={request.id} data-testid={`card-request-${request.id}`}><h2>👩🏽 {request.entrepreneur}</h2><p className="muted">{request.village} · {request.skill} · {request.mode}</p><div className="button-row"><button className="btn btn-primary" type="button" data-testid={`button-accept-${request.id}`} onClick={() => { acceptMentorRequest(request.id); setRequests((items) => items.filter((item: any) => item.id !== request.id)); }}>{t("accept")}</button><button className="btn btn-outline" type="button" data-testid={`button-decline-${request.id}`} onClick={() => setRequests((items) => items.filter((item: any) => item.id !== request.id))}>{t("decline")}</button></div></div>)}</div>}{tab === "mentees" && <div className="section card"><div className="empty"><span className="emoji">💬</span><p>{t("mentorHint")}</p><button className="btn btn-outline" type="button" data-testid="button-voice-note">🎤 {t("voiceNote")}</button></div></div>}{tab === "calendar" && <div className="section"><div className="card">{calendar ? <p className="benefit">{t("calendarConnected")}</p> : <button className="btn btn-primary btn-wide" type="button" data-testid="button-connect-calendar" onClick={() => connectGoogleCalendar().then(() => setCalendar(true))}>📅 {t("calendarConnect")}</button>}</div><div className="card section"><h2>{t("upcoming")}</h2><p className="muted">{t("emptyBookings")}</p></div></div>}<button className="dev-affordance" type="button" aria-label={t("developer")} data-testid="button-dev-menu" onClick={() => setDev(!dev)} />{dev && <div className="card section"><h3>{t("statusSwitcher")}</h3>{["pending", "approved", "rejected"].map((value) => <button className="btn btn-outline" style={{ margin: 4 }} type="button" key={value} data-testid={`button-status-${value}`} onClick={() => changeStatus(value)}>{t(value)}</button>)}</div>}</Shell>;
}

function LearnerOnboarding({ t, lang, onBack, onDone }: any) {
  const [step, setStep] = useState(1); const [form, setForm] = useState<Record<string, string>>({}); const choose = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const lists = step === 1 ? [["homemaker", "🏠"], ["student", "📚"], ["dailyWage", "🌾"], ["employed", "💼"]] : step === 2 ? [["Food", "🍲"], ["Textiles", "🧵"], ["Digital", "📱"], ["Agri", "🌿"], ["Beauty", "💅"], ["Craft", "🏺"]] : step === 3 ? [["<5 hrs", "⏳"], ["5–10 hrs", "🕰️"], ["10+ hrs", "🌞"]] : [["video", "📹"], ["audio", "🎧"], ["reading", "📖"], ["live", "👩🏽‍🏫"]];
  const title = step === 1 ? "currentSituation" : step === 2 ? "dreamDomain" : step === 3 ? "hours" : "learningStyle";
  return <div className="screen-wrap"><div className="content-width"><Topbar t={t} title={t("learnerOnboarding")} lang={lang} onLanguage={() => undefined} onBack={onBack} /><div className="progress-dots">{[1, 2, 3, 4].map((item) => <span key={item} className={`progress-dot ${item < step ? "done" : item === step ? "active" : ""}`} />)}</div><div className="card"><div className="section-heading"><h2>{t(title)}</h2><SpeakButton t={t} lang={lang} text={t(title)} /></div><div className="choice-grid">{lists.map(([value, icon]) => <button className={`choice-card ${form[title] === value ? "selected" : ""}`} type="button" key={value} data-testid={`choice-learner-${value}`} onClick={() => choose(title, value)}>{icon} {t(value) || value}</button>)}</div><button className="btn btn-primary btn-wide" type="button" data-testid="button-learner-next" onClick={() => step < 4 ? setStep(step + 1) : onDone(form)}>{step === 4 ? t("learningPath") : t("next")}</button></div></div></div>;
}

function LearningPath({ t, lang, onBack, onNavigate }: any) {
  const [courses, setCourses] = useState<any[]>([]); useEffect(() => { getLearnerCourses().then(setCourses); }, []);
  return <Shell t={t} title={t("learningPath")} lang={lang} onLanguage={() => undefined} onBack={onBack} nav active="home" onNavigate={onNavigate} role="learner"><div className="hero-card"><span className="eyebrow">{t("learner")}</span><h1>{t("learningPath")}</h1><p>{t("readyToBegin")}</p></div><div className="section course-grid">{courses.map((course) => <div className="card course-card" key={course.title}><span className="course-emoji">{course.emoji}</span><div><h2 style={{ margin: 0 }}>{course.title}</h2><p className="muted">{t("minutes", { n: course.duration })}</p></div><button className="btn btn-primary" type="button" data-testid={`button-start-course-${course.title}`} onClick={() => undefined}>{t("start")}</button></div>)}</div></Shell>;
}

function Profile({ t, lang, user, profile, role, onLanguage, onLogout, onBack }: any) {
  const [confirm, setConfirm] = useState(false);
  return <Shell t={t} title={t("profile")} lang={lang} onLanguage={() => undefined} onBack={onBack}><div className="card tint-card"><div style={{ fontSize: "3rem" }}>👩🏽</div><h2>{user.name}</h2><p className="muted">{t("userId")}: {user.id}</p><p><strong>{t(role)}</strong></p></div><div className="section card"><h2>{t("language")}</h2><div className="button-row">{languageOptions.map((item) => <button className={`btn ${lang === item.code ? "btn-primary" : "btn-outline"}`} type="button" key={item.code} data-testid={`button-profile-language-${item.code}`} onClick={() => onLanguage(item.code)}>{item.label}{lang === item.code ? " ✓" : ""}</button>)}</div></div><div className="section card"><h2>{t("savedData")}</h2><p><strong>{t("location")}:</strong> {profile.location || "—"}</p><p><strong>{t("skills")}:</strong> {profile.skills?.join(", ") || "—"}</p><p><strong>{t("resourcesLabel")}:</strong> {profile.resources?.join(", ") || "—"}</p></div><button className="btn btn-secondary btn-wide" type="button" data-testid="button-logout" onClick={() => setConfirm(true)}>{t("signOut")}</button>{confirm && <div className="modal-backdrop"><div className="modal-card"><h2>{t("logoutConfirm")}</h2><div className="button-row"><button className="btn btn-outline" type="button" data-testid="button-cancel-logout" onClick={() => setConfirm(false)}>{t("cancel")}</button><button className="btn btn-secondary" type="button" data-testid="button-confirm-logout" onClick={onLogout}>{t("logoutYes")}</button></div></div></div>}</Shell>;
}

function Main() {
  const { state, update, logout } = useApp(); const t = useMemo(() => makeTranslator(state.lang), [state.lang]); const [chat, setChat] = useState(false); const [quizOpen, setQuizOpen] = useState(false); const [apply, setApply] = useState<any>(null); const [bookingMentor, setBookingMentor] = useState<any>(null); const [toast, setToast] = useState(""); const [mentorStatus, setMentorStatus] = useState("pending");
  const setScreen = (screen: string) => update({ screen });
  const setLang = (lang: string) => update({ lang });
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const nav = (screen: string) => setScreen(screen);
  const handleHome = () => state.role === "mentor" ? setScreen("mentor-home") : state.role === "learner" ? setScreen("learning-path") : setScreen("home");
  const renderScreen = () => {
    switch (state.screen) {
      case "splash": return <Splash t={t} lang={state.lang} setLang={setLang} onContinue={() => setScreen("role")} />;
      case "role": return <RoleScreen t={t} lang={state.lang} onChoose={(role: string) => update({ role, screen: "login" })} />;
      case "login": return <Login t={t} lang={state.lang} role={state.role} onBack={() => setScreen("role")} onDone={(user: any) => update({ user, screen: state.role === "entrepreneur" ? "entrepreneur-onboarding" : state.role === "mentor" ? "mentor-onboarding" : "learner-onboarding" })} />;
      case "entrepreneur-onboarding": return <EntrepreneurOnboarding t={t} lang={state.lang} profile={state.profile} onBack={() => setScreen("login")} onDone={(profile: any) => update({ profile, screen: "opportunity-finder" })} />;
      case "opportunity-finder": return <OpportunityFinder t={t} lang={state.lang} profile={state.profile} onBack={() => setScreen("home")} onOpen={(opportunity: any) => update({ opportunity, screen: "opportunity-detail" })} />;
      case "opportunity-detail": return <OpportunityDetail t={t} lang={state.lang} opportunity={state.opportunity} onBack={() => setScreen("opportunity-finder")} onQuiz={() => setQuizOpen(true)} onChat={(kind: string) => notify(kind === "connection" ? t("connectionSent") : t("chatTitle"))} onBook={() => setBookingMentor({ id: "meena", avatar: "👩🏽‍🌾", name: state.opportunity.mentor, slots: ["09:30", "12:00", "17:30"] })} onApply={() => setApply(state.opportunity.scheme)} />;
      case "home": return <Home t={t} lang={state.lang} profile={{ ...state.user, ...state.profile }} score={state.readinessScore} onOpportunity={() => setScreen("opportunity-finder")} onQuiz={() => setQuizOpen(true)} onChat={() => setChat(true)} onNavigate={nav} />;
      case "schemes": return <Schemes t={t} lang={state.lang} onNavigate={nav} onBack={handleHome} onChat={() => setChat(true)} onApply={setApply} />;
      case "mentors": return <MentorList t={t} lang={state.lang} onNavigate={nav} onBack={handleHome} onSelect={setBookingMentor} />;
      case "profile": return <Profile t={t} lang={state.lang} user={state.user} profile={state.profile} role={state.role} onLanguage={setLang} onLogout={logout} onBack={handleHome} />;
      case "mentor-onboarding": return <MentorOnboarding t={t} lang={state.lang} user={state.user} onBack={() => setScreen("login")} onDone={(status: string) => { setMentorStatus(status); setScreen("mentor-home"); }} />;
      case "mentor-home": case "mentees": case "calendar": return <MentorHome t={t} lang={state.lang} user={state.user} initialTab={state.screen} onNavigate={nav} onBack={(screen = "login") => setScreen(screen)} onStatus={(status: string) => setMentorStatus(status)} />;
      case "learner-onboarding": return <LearnerOnboarding t={t} lang={state.lang} onBack={() => setScreen("login")} onDone={(profile: any) => update({ profile, screen: "learning-path" })} />;
      case "learning-path": return <LearningPath t={t} lang={state.lang} onBack={() => setScreen("login")} onNavigate={nav} />;
      default: return <Splash t={t} lang={state.lang} setLang={setLang} onContinue={() => setScreen("role")} />;
    }
  };
  return <div className="prabha-app">{renderScreen()}{state.role === "entrepreneur" && ["home", "schemes", "mentors", "profile", "opportunity-detail"].includes(state.screen) && <button className="floating-chat bounce-chat" type="button" data-testid="button-floating-chat" aria-label={t("chatTitle")} onClick={() => setChat(true)}>📋</button>}{chat && <Chat t={t} lang={state.lang} onClose={() => setChat(false)} />}{quizOpen && <Quiz t={t} lang={state.lang} onClose={(action?: string) => { setQuizOpen(false); if (action === "esAras") setApply(t("officialPortal")); }} onResult={(score: number) => update({ readinessScore: score })} onLearning={() => { setQuizOpen(false); setScreen("learner-onboarding"); }} />}{bookingMentor && <Booking t={t} mentor={bookingMentor} onClose={() => setBookingMentor(null)} onBooked={() => { setBookingMentor(null); notify(t("bookingSuccess")); }} />}{apply && <div className="modal-backdrop"><div className="modal-card"><h2>{t("applyPortal")}</h2><p>{typeof apply === "string" ? apply : t("officialPortal")}</p><div className="button-row"><button className="btn btn-outline" type="button" data-testid="button-close-apply" onClick={() => setApply(null)}>{t("later")}</button><button className="btn btn-primary" type="button" data-testid="button-open-portal" onClick={() => { setApply(null); notify(t("applyPortal")); }}>{t("officialPortal")}</button></div></div></div>}{toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}</div>;
}

export default function App() {
  return <AppProvider><Main /></AppProvider>;
}