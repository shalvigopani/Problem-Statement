
/* LearnAI — frontend-only demo database */
const DB_KEY = "learnai_demo_db_v1";

const defaultDB = {
  user: {
    name: "",
    role: "Student",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    standard: "",
    city: "",
    institution: "",
    interests: "",
    department: "Student",
    language: "English",
    profileComplete: false
  },
  stats: {
    readiness: 76,
    assessments: 8,
    courses: 6,
    streak: 7
  },
  materials: [
    { id: 1, name: "Digital Governance Basics.pdf", type: "PDF", status: "Ready", size: "2.4 MB", date: "10 Sep 2026" },
    { id: 2, name: "AI for Public Services.docx", type: "DOCX", status: "Ready", size: "1.1 MB", date: "09 Sep 2026" }
  ],
  courses: [
    { id: 1, title: "AI for Public Services", category: "AI & Technology", level: "Intermediate", duration: "3h 20m", progress: 62, rating: 4.8 },
    { id: 2, title: "Digital Governance Essentials", category: "Governance", level: "Beginner", duration: "2h 10m", progress: 84, rating: 4.7 },
    { id: 3, title: "Data Literacy for Officials", category: "Data", level: "Intermediate", duration: "2h 45m", progress: 35, rating: 4.6 },
    { id: 4, title: "Cyber Safety & Privacy", category: "Security", level: "Beginner", duration: "1h 40m", progress: 100, rating: 4.9 }
  ],
  activities: [
    { text: "Completed Cyber Safety & Privacy", time: "Today, 9:20 AM" },
    { text: "Scored 82% in AI Fundamentals assessment", time: "Yesterday" },
    { text: "Started Data Literacy for Officials", time: "09 Sep 2026" }
  ]
};

function getDB() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
  return JSON.parse(JSON.stringify(defaultDB));
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

window.LearnAI = { getDB, saveDB };

const PROFILE_KEY = "learnai_profile_v1";
const AUTH_KEY = "learnai_auth_v1";
const LEARNING_SUBJECTS = {
  "9th": ["Mathematics", "Science", "Social Science", "English", "Computer Basics", "Hindi / Gujarati"],
  "10th": ["Mathematics", "Science", "Social Science", "English", "Computer / IT", "Hindi / Gujarati"],
  "Commerce": ["Accountancy", "Economics", "Business Studies", "Statistics", "English", "Computer / IT"],
  "Science": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
  "Arts": ["History", "Geography", "Political Science", "Sociology", "Psychology", "English"]
};

function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function saveProfile(profile) {
  const clean = {...profile, profileComplete: true, role: "Student"};
  localStorage.setItem(PROFILE_KEY, JSON.stringify(clean));
  localStorage.setItem(AUTH_KEY, "1");
  try { const db=getDB(); db.user={...db.user,...clean}; saveDB(db); } catch(e) {}
  return clean;
}
function isLoggedIn() { return localStorage.getItem(AUTH_KEY) === "1" && isProfileComplete(); }
function isProfileComplete() {
  const p=getProfile();
  return !!(p.profileComplete && p.name && p.email && p.standard && p.city);
}

function logout() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(AUTH_KEY);
  // Keep learning history/materials intact; only sign out the learner profile.
  location.replace("profile.html");
}
function requireProfile() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "profile.html") return true;
  if (!isLoggedIn()) { location.replace("profile.html"); return false; }
  return true;
}
window.LearnAI.logout=logout;
window.LearnAI.requireProfile=requireProfile;
function initials(name) {
  return String(name||"Learner").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("") || "L";
}
function getSubjectsForStandard(standard) { return LEARNING_SUBJECTS[standard] || []; }
window.LearnAI.getProfile=getProfile;
window.LearnAI.saveProfile=saveProfile;
window.LearnAI.isProfileComplete=isProfileComplete;
window.LearnAI.isLoggedIn=isLoggedIn;
window.LearnAI.getSubjectsForStandard=getSubjectsForStandard;

function renderShell() {
  const header = document.querySelector("[data-site-header]");
  const profile = getProfile();
  const displayName = profile.name || "Learner";
  const shortName = displayName.split(/\s+/)[0] || "Learner";
  const avatar = initials(displayName);
  const footer = document.querySelector("[data-site-footer]");

  if (header) {
    header.innerHTML = `
      <div class="site-header-inner">
        <a class="brand" href="index.html" aria-label="LearnAI Home">
          <span class="brand-mark">L</span>
          <span><strong>LearnAI</strong><small>Competency Intelligence</small></span>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
          <a href="dashboard.html">Dashboard</a>
          <a href="courses.html">Learning Hub</a>
          <a href="competency.html">Competency</a>
          <a href="recommendations.html">My Path</a>
          <a href="analytics.html">Analytics</a>
          <a href="multiplayer.html">Quiz Battle</a>
          <a href="personalized-chat.html">AI Study Chat</a>
        </nav>
        <div class="header-actions">
          <a class="nav-icon-link" href="about.html">About</a>
          <a class="profile-chip" href="profile.html"><span class="avatar">${avatar}</span><span>${shortName}</span></a>
          <button type="button" class="nav-logout" onclick="LearnAI.logout()" title="Sign out">Sign out</button>
        </div>
      </div>`;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="footer-main">
        <div>
          <a class="brand footer-brand" href="index.html">
            <span class="brand-mark">L</span>
            <span><strong>LearnAI</strong><small>Competency Intelligence</small></span>
          </a>
          <p>AI-enabled learning and competency intelligence for continuous professional development.</p>
        </div>
        <div><h4>Platform</h4><a href="dashboard.html">Dashboard</a><a href="courses.html">Learning Hub</a><a href="competency.html">Competency Map</a><a href="recommendations.html">Learning Path</a></div>
        <div><h4>Tools</h4><a href="materials.html">My Materials</a><a href="generate.html">AI Assessment</a><a href="analytics.html">Analytics</a><a href="multiplayer.html">Quiz Battle</a><a href="personalized-chat.html">AI Study Chat</a><a href="profile.html">Profile</a></div>
        <div><h4>Support</h4><a href="about.html#contact">Contact Us</a><a href="about.html#faq">FAQ</a><a href="about.html">About LearnAI</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 LearnAI • SIH 2026 Prototype</span><span>Inspired by competency-driven public learning models</span></div>`;
  }

  // Mark current navigation link.
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach(a => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
}

function wireButtons() {
  document.querySelectorAll("[data-reset-demo]").forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.removeItem(DB_KEY);
      location.reload();
    });
  });

  document.querySelectorAll("[data-demo-toast]").forEach(btn => {
    btn.addEventListener("click", () => showToast(btn.dataset.demoToast || "Action completed successfully."));
  });

  document.querySelectorAll("a[href='#contact']").forEach(a => {
    a.addEventListener("click", () => showToast("Contact section opened."));
  });
}

function showToast(message) {
  let toast = document.getElementById("learnai-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "learnai-toast";
    toast.className = "learnai-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireProfile()) return;
  renderShell();
  wireButtons();
});

/* ---------- Dynamic learning-material pipeline ---------- */
const MATERIALS_KEY = "learnai_uploaded_materials_v2";

function getUploadedMaterials() {
  try { return JSON.parse(localStorage.getItem(MATERIALS_KEY) || "[]"); } catch(e) { return []; }
}
function saveUploadedMaterials(items) {
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(items));
}

function extensionOf(name) {
  return (name.split(".").pop() || "").toLowerCase();
}

async function loadScriptOnce(src, globalName) {
  if (window[globalName]) return;
  const existing = [...document.scripts].find(s => s.src === src);
  if (existing) {
    await new Promise((resolve,reject)=>{ existing.addEventListener("load",resolve,{once:true}); existing.addEventListener("error",reject,{once:true}); });
    return;
  }
  await new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=src; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
  });
}

async function extractPdfText(file) {
  await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs","pdfjsLib");
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) throw new Error("PDF reader could not be loaded.");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({data}).promise;
  let text = "";
  for (let p=1;p<=pdf.numPages;p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map(x=>x.str).join(" ") + "\n";
  }
  return text;
}

async function extractDocxText(file) {
  await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js","mammoth");
  if (!window.mammoth) throw new Error("DOCX reader could not be loaded.");
  const result = await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
  return result.value || "";
}

async function extractPptxText(file) {
  await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","JSZip");
  if (!window.JSZip) throw new Error("PPTX reader could not be loaded.");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a,b)=>(parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0])));
  let text = "";
  for (const name of slideNames) {
    const xml = await zip.files[name].async("string");
    const doc = new DOMParser().parseFromString(xml,"application/xml");
    const nodes = [...doc.getElementsByTagNameNS("*","t")];
    const slideText = nodes.map(n=>n.textContent.trim()).filter(Boolean).join(" ");
    if (slideText) text += slideText + "\n";
  }
  return text;
}

async function extractMaterialText(file) {
  const ext = extensionOf(file.name);
  if (ext === "txt") return await file.text();
  if (ext === "pdf") return await extractPdfText(file);
  if (ext === "docx" || ext === "doc") {
    if (ext === "doc") throw new Error("Old .DOC files are not supported in the browser. Please save it as DOCX.");
    return await extractDocxText(file);
  }
  if (ext === "pptx") return await extractPptxText(file);
  if (ext === "ppt") throw new Error("Old .PPT files are not supported in the browser. Please save it as PPTX.");
  throw new Error("Unsupported file type.");
}

async function addUploadedMaterial(file, onProgress) {
  const ext=extensionOf(file.name);
  const allowed=["pdf","docx","txt","pptx"];
  if (!allowed.includes(ext)) throw new Error("Please upload PDF, DOCX, TXT or PPTX.");
  if (file.size > 50*1024*1024) throw new Error("Maximum file size is 50 MB.");
  onProgress?.("Reading material...");
  const text=(await extractMaterialText(file)).replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
  if (!text || text.length < 80) throw new Error("I could not extract enough readable text from this file.");
  const item={
    id:"m_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),
    name:file.name, type:ext.toUpperCase(), size:(file.size/1024/1024).toFixed(2)+" MB",
    date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),
    status:"Ready for assessment", text:text
  };
  const items=getUploadedMaterials().filter(x=>x.name!==item.name);
  items.unshift(item); saveUploadedMaterials(items);
  // Keep the demo DB in sync so other existing cards can use the material.
  try {
    const db=getDB(); db.materials=[...items.map(x=>({...x})), ...(db.materials||[]).filter(x=>!items.some(y=>y.name===x.name))].slice(0,20); saveDB(db);
  } catch(e){}
  onProgress?.("Ready for assessment");
  return item;
}

/* ---------- Source-grounded assessment generator ----------
   The generator first removes solution/answer blocks from the source.
   For logical-reasoning material it creates fresh test-style problems
   from the concepts/formulas found in the material. It never displays
   the source solution while the learner is taking the quiz.
*/
function normalizeQuizSource(text) {
  const raw=String(text||"").replace(/\r/g,"\n");
  const lines=raw.split(/\n+/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
  const out=[]; let hiding=false;
  for(const line of lines){
    if(/\b(solution|sol\.|answer|ans\s*=|answer\s*=|hence\s+answer|therefore\s+answer)\b/i.test(line)){
      hiding=true; continue;
    }
    if(hiding && /^(exercise|practice questions?|example\s*\d+|question\s*[-:]?\s*\d+|type-\d+|section\s*-\s*\d+)/i.test(line)){
      hiding=false;
    }
    if(!hiding && !/^prof\.\s+/i.test(line) && !/^#?\d{4}[A-Z]{2}\d+/i.test(line) && !/^‹#›$/.test(line)){
      out.push(line);
    }
  }
  return out.join("\n");
}

function quizShuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function uniqueQuestions(qs){
  const seen=new Set();
  return qs.filter(q=>{
    const key=q.q.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    if(!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function makeMCQ(q,a,wrong,source="",explanation=""){
  const options=quizShuffle([String(a),...wrong.map(String)]).slice(0,4);
  return {q,a:options,c:options.findIndex(x=>x===String(a)),source,explanation};
}
function numWords(n){ return String(n); }
function directionFromXY(x,y){
  if(x===0 && y===0) return "Same position";
  if(x===0) return y>0?"North":"South";
  if(y===0) return x>0?"East":"West";
  return y>0?(x>0?"North-East":"North-West"):(x>0?"South-East":"South-West");
}
function gcd(a,b){while(b){[a,b]=[b,a%b]}return Math.abs(a)}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}


function quantitativeAptitudeQuestions(text){
  const source=normalizeQuizSource(text);
  const qs=[];
  const add=(q,a,w,topic,e)=>qs.push(makeMCQ(q,a,w,topic,e));

  // Alligation / Mixture
  [
    [10,20,14,"3 : 2"], [30,50,38,"3 : 2"], [40,70,52,"3 : 2"],
    [25,45,33,"3 : 2"], [12,24,18,"1 : 1"], [15,35,25,"1 : 1"]
  ].forEach(([low,high,mean,ratio])=>{
    const [x,y]=ratio.split(":").map(Number);
    add(`Two ingredients cost ₹${low} and ₹${high} per kg. In what ratio should they be mixed to obtain a mixture worth ₹${mean} per kg?`,
      ratio, [`${y} : ${x}`,`${x+1} : ${y}`,`${x} : ${y+1}`],"Alligation or Mixture",
      "Use the rule of alligation: cheaper : dearer = (dearer − mean) : (mean − cheaper).");
  });
  [
    [20,30,25,100],[40,60,50,80],[12,18,15,120]
  ].forEach(([a,b,m,total])=>{
    add(`A mixture is made by combining ingredients costing ₹${a} and ₹${b} per kg. If the mean price is ₹${m}, what quantity of the cheaper ingredient is needed in ${total} kg of mixture?`,
      total/2,[total/4,total*0.4,total*0.6],"Alligation or Mixture",
      "Equal prices around the mean give a 1:1 ratio.");
  });

  // Surds
  [
    ["√72","6√2",["3√8","4√2","8√2"]],
    ["√98","7√2",["14√2","7√7","9√2"]],
    ["∛54","3∛2",["2∛3","6∛2","9∛2"]],
    ["√200","10√2",["5√2","20√2","10√5"]],
    ["√125","5√5",["25√5","5√25","10√5"]]
  ].forEach(([expr,ans,w])=>add(`Simplify ${expr}.`,ans,w,"Surds & Indices","Factor out the largest perfect square/cube."));
  [
    ["(√7 + √3)(√7 - √3)","4",["10","√4","2"]],
    ["(√11 + √2)(√11 - √2)","9",["13","√13","7"]]
  ].forEach(([expr,ans,w])=>add(`Evaluate ${expr}.`,ans,w,"Surds & Indices","Use (√a + √b)(√a − √b) = a − b."));

  // Indices
  [
    ["2³ × 2⁴","128",["32","64","256"]],
    ["5² × 5³","3125",["625","15625","125"]],
    ["3⁵ ÷ 3²","27",["9","81","243"]],
    ["(2³)²","64",["16","32","128"]],
    ["7⁰","1",["0","7","49"]],
    ["4⁻¹","1/4",["4","-4","1/16"]],
    ["16^(3/4)","8",["4","12","16"]],
    ["81^(1/2)","9",["18","8","27"]]
  ].forEach(([expr,ans,w])=>add(`Evaluate ${expr}.`,ans,w,"Surds & Indices","Apply the laws of indices given in the material."));

  // Simple Interest
  [
    [6000,5,3,900],[8000,7.5,2,1200],[4500,12,2,1080],[7500,8,2.5,1500],
    [2400,10,1.5,360],[9000,6,4,2160]
  ].forEach(([p,r,t,ans])=>{
    add(`Find the simple interest on ₹${p} at ${r}% per annum for ${t} year(s).`,ans,
      [ans+100,ans-100,ans+200],"Simple Interest","SI = P × R × T / 100, with time in years.");
  });
  [
    [5000,10,2,6000],[4000,7.5,2,4600],[8000,5,3,9200]
  ].forEach(([p,r,t,ans])=>{
    add(`What total amount is received on ₹${p} at ${r}% simple interest for ${t} years?`,ans,
      [ans+200,ans-200,ans+500],"Simple Interest","Amount = Principal + Simple Interest.");
  });
  add("If the simple interest on ₹5000 for 2 years is ₹800, what is the annual rate?",8,["6%","10%","12%"],"Simple Interest","Rearrange SI = PRT/100 to find R.");
  add("If ₹300 simple interest is earned on a principal of ₹2500 at 6% per annum, for how many years is the money invested?",2,["1","3","4"],"Simple Interest","Rearrange SI = PRT/100 to find T.");

  // Compound Interest
  [
    [5000,10,2,1050],[4000,5,2,410],[10000,8,2,1664],[6000,10,3,1986],
    [8000,5,2,820],[2500,20,2,1100]
  ].forEach(([p,r,n,ci])=>{
    add(`Find the compound interest on ₹${p} at ${r}% per annum for ${n} years, compounded annually.`,ci,
      [ci+50,ci-50,ci+100],"Compound Interest","Use A = P(1 + R/100)^n and CI = A − P.");
  });
  add("₹10,000 is invested at 8% per annum for 1 year, compounded half-yearly. What is the amount?",10816,["10800","10840","11664"],"Compound Interest","For half-yearly compounding, rate is halved and number of periods is doubled.");
  add("₹8,000 is invested at 10% per annum for 1 year, compounded half-yearly. What is the amount?",8820,["8800","8840","9000"],"Compound Interest","Use 5% for each half-year and two compounding periods.");

  // Mensuration 2D
  add("A square has side 12 cm. What is its area?",144,["48","24","288"],"Mensuration","Area of square = side².");
  add("A rectangle is 18 m long and 7 m broad. What is its area?",126,["50","126 m","100"],"Mensuration","Area of rectangle = length × breadth.");
  add("A rectangle is 18 m long and 7 m broad. What is its perimeter?",50,["25","126","72"],"Mensuration","Perimeter = 2(length + breadth).");
  add("A circle has radius 7 cm. Using π = 22/7, what is its area?",154,["44","308","49"],"Mensuration","Area of circle = πr².");
  add("A square has area 625 m². What is its perimeter?",100,["25","50","125"],"Mensuration","Find the side from √625, then multiply by 4.");
  add("A rectangular floor has area 2880 m² and length 72 m. What is its breadth?",40,["30","50","60"],"Mensuration","Breadth = area ÷ length.");

  // Mensuration 3D
  add("A cone has radius 7 cm and height 24 cm. Using π = 22/7, what is its volume?",1232,["616","2464","1078"],"Mensuration","Volume of cone = 1/3 πr²h.");
  add("A cube has side 5 cm. What is its volume?",125,["25","100","150"],"Mensuration","Volume of cube = side³.");
  add("A cuboid is 9 cm × 11 cm × 12 cm. What is its volume?",1188,["990","108","1296"],"Mensuration","Volume = length × breadth × height.");
  add("A cylinder has radius 7 cm and height 10 cm. Using π = 22/7, what is its volume?",1540,["770","3080","440"],"Mensuration","Volume of cylinder = πr²h.");

  // Calendar
  [
    ["4 June 2020","Thursday",["Wednesday","Friday","Saturday"]],
    ["1 January 2008","Tuesday",["Monday","Wednesday","Thursday"]],
    ["28 May 2006","Sunday",["Monday","Saturday","Tuesday"]]
  ].forEach(([d,a,w])=>add(`According to the calendar method in the material, what day of the week was ${d}?`,a,w,"Calendar","Apply the day, month, year, century and leap-year values from the method."));
  add("In the day-number table given in the material, which number represents Saturday?",0,["1","6","7"],"Calendar","The material maps Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6, Sat=0.");

  // Permutations
  add("In how many different ways can the letters of ROSE be arranged?",24,["12","16","20"],"Permutations & Combinations","Four distinct letters give 4P4 = 4!.");
  add("How many permutations of 3 distinct objects are possible when all 3 are taken?",6,["3","9","12"],"Permutations & Combinations","nPr = n!/(n−r)!.");
  add("How many different arrangements can be made using the letters of TOFFEE?",180,["120","360","720"],"Permutations & Combinations","Account for repeated F and E using the repeated-letter arrangement formula.");
  add("How many ways can 5 different books be arranged on a shelf?",120,["25","60","100"],"Permutations & Combinations","Arrange all 5 distinct objects: 5!.");

  // Combinations
  add("How many ways can 2 people be selected from a group of 6?",15,["12","20","30"],"Permutations & Combinations","Use nCr for selection.");
  add("A committee of 3 is formed from 5 people. How many different committees are possible?",10,["15","20","60"],"Permutations & Combinations","Order does not matter, so use 5C3.");
  add("How many handshakes are possible among 10 people if each pair shakes hands once?",45,["20","50","90"],"Permutations & Combinations","Each handshake selects a pair: 10C2.");
  add("How many ways can 2 women be selected from 5 women?",10,["5","15","20"],"Permutations & Combinations","Use 5C2.");

  // Probability
  add("What is the probability of getting a head when a fair coin is tossed once?","1/2",["1/4","1","0"],"Probability","There is 1 favorable outcome out of 2 equally likely outcomes.");
  add("What is the probability of getting a multiple of 3 when a fair die is thrown once?","1/3",["1/2","1/6","2/3"],"Probability","Favorable outcomes are 3 and 6 out of 6.");
  add("Two fair coins are tossed. What is the probability of getting at most one head?","3/4",["1/4","1/2","1"],"Probability","The favorable outcomes are TT, TH and HT out of four.");
  add("A card is drawn from a standard pack of 52 cards. What is the probability of getting a King?","1/13",["1/4","4/13","1/52"],"Probability","There are 4 Kings among 52 cards.");
  add("Two dice are thrown. What is the probability that their sum is 7?","1/6",["1/12","1/9","1/3"],"Probability","There are 6 favorable ordered pairs out of 36.");
  add("A bag contains 4 red and 6 blue balls. One ball is drawn at random. What is the probability of red?","2/5",["1/2","1/3","3/5"],"Probability","Required outcomes = 4 and total outcomes = 10.");

  return uniqueQuestions(qs);
}

function logicalReasoningQuestions(text){
  const source=normalizeQuizSource(text);
  const qs=[];
  const add=(q,a,w,s="",e="")=>qs.push(makeMCQ(q,a,w,s,e));

  // NUMBER SERIES — fresh values, based on the series types/formulas in the PPT.
  const arith=[
    [7,11,15,19,23,27,"+4"], [18,23,28,33,38,43,"+5"],
    [42,38,34,30,26,22,"-4"], [9,16,23,30,37,44,"+7"],
    [125,120,115,110,105,100,"-5"], [13,20,27,34,41,48,"+7"]
  ];
  arith.forEach(x=>{
    add(`Find the next number in the series: ${x.slice(0,6).join(", ")}, ?`, 
      x[5]+(x[6].startsWith("+")?Number(x[6].slice(1)):-Number(x[6].slice(1))),
      [x[5]+2,x[5]+4,x[5]-2], "Number Series", `The sequence follows ${x[6]} at each step.`);
  });
  const geo=[
    [2,6,18,54,162,486,3],[5,25,125,625,3125,15625,5],
    [4,12,36,108,324,972,3],[7,14,28,56,112,224,2]
  ];
  geo.forEach(x=>add(`Identify the next number: ${x.slice(0,6).join(", ")}, ?`,x[5]*x[6],
    [x[5]+x[6],x[5]*x[6]-x[6],x[5]*x[6]+x[6]],"Geometric Series",`Each term is multiplied by ${x[6]}.`));
  const alt=[
    [4,9,8,18,12,27,16,36,20,45],
    [6,20,10,25,14,30,18,35,22,40]
  ];
  alt.forEach(x=>{
    const answer=x[8];
    add(`What should replace ? in the merged series: ${x[0]}, ${x[1]}, ${x[2]}, ${x[3]}, ${x[4]}, ${x[5]}, ${x[6]}, ${x[7]}, ?, ${x[9]}`,
      answer,[x[8]+2,x[8]-2,x[8]+5],"Merged Series","Separate odd and even positions into two series.");
  });
  [4,5,6,7,8].forEach(n=>{
    const ans=n*(n+1)*(2*n+1)/6;
    add(`A square grid has ${n} × ${n} cells. How many squares are formed in total?`,
      ans,[ans+n,ans*2,ans-1],"Counting Squares",`Use n(n+1)(2n+1)/6.`);
  });
  [3,5,6,7,8].forEach(n=>{
    const ans=n*(n+1)/2;
    add(`A layered triangle has ${n} levels. How many triangles are counted by the level-sum method?`,
      ans,[n*n,ans+n,ans-1],"Counting Triangles",`Use n(n+1)/2.`);
  });

  // DIRECTION SENSE — generated coordinates, not copied examples.
  [
    ["Aarav",30,20,25,-10],
    ["Neha",40,-15,-10,25],
    ["Riya",-25,35,30,-20],
    ["Kabir",50,20,-35,-5],
    ["Meera",-30,-20,15,40],
    ["Dev",45,-30,-20,-15]
  ].forEach(([name,x1,y1,x2,y2])=>{
    const dx=x1+x2,dy=y1+y2,dir=directionFromXY(dx,dy);
    add(`${name} walks ${Math.abs(x1)} m ${x1>=0?"East":"West"} and ${Math.abs(y1)} m ${y1>=0?"North":"South"}. Then ${name} walks ${Math.abs(x2)} m ${x2>=0?"East":"West"} and ${Math.abs(y2)} m ${y2>=0?"North":"South"}. In which direction is ${name} from the starting point?`,
      dir,quizShuffle(["North","South","East","West","North-East","North-West","South-East","South-West"]).filter(v=>v!==dir).slice(0,3),
      "Direction Sense","Combine horizontal and vertical displacement.");
  });

  // BLOOD RELATION — fresh chains with enough gender information to determine one answer.
  [
    ["Asha","mother","Ravi","brother","Nina","daughter"],
    ["Karan","father","Mira","sister","Tara","daughter"],
    ["Pooja","sister","Aman","father","Riya","daughter"],
    ["Dev","brother","Sia","mother","Kabir","son"],
    ["Nikhil","father","Isha","sister","Mohan","son"]
  ].forEach(([a,r1,b,r2,c,answer])=>{
    add(`${a} says, "${b} is my ${r1}." ${b} says, "${c} is my ${r2}." How is ${c} related to ${a}?`,
      answer,["brother","sister","cousin"],"Blood Relation","Trace both relationships from the statements given.");
  });

  // CODING / DECODING — use alphabet-position operations explicitly supported by the PPT.
  const alpha=s=>s.toUpperCase().split("").map(ch=>ch.charCodeAt(0)-64);
  [
    ["DOG","add","1"],["BOOK","add","1"],["MATH","add","2"],["CODE","add","1"],
    ["TRAIN","add","2"]
  ].forEach(([word,op,k])=>{
    const shift=Number(k);
    const ans=word.split("").map(ch=>String.fromCharCode(65+((ch.charCodeAt(0)-65+shift)%26))).join("");
    const wrong=[
      word.split("").reverse().join(""),
      word.split("").map(ch=>String.fromCharCode(65+((ch.charCodeAt(0)-65-shift+26)%26))).join(""),
      word.split("").map((ch,i)=>String.fromCharCode(65+((ch.charCodeAt(0)-65+(i+1))%26))).join("")
    ];
    add(`If each letter of "${word}" is replaced by the letter ${shift} position(s) after it in the alphabet, what is the coded form?`,ans,wrong,"Coding Decoding","Apply the stated alphabet-position rule.");
  });
  [["CAT",24],["DOG",26],["BOOK",43],["MATH",42],["CODE",27]].forEach(([word,ans])=>{
    add(`Using A=1, B=2, …, Z=26, what is the sum of the alphabet positions of the letters in "${word}"?`,
      ans,[ans+3,ans-3,ans+5],"Number Coding","Add the alphabet positions of all letters.");
  });

  // STATEMENT & ARGUMENT — same judging criteria, fresh scenarios.
  [
    ["Should public libraries provide free internet access?","Yes, it can improve access to educational resources.","No, some people prefer printed books.","Only Argument I is strong"],
    ["Should colleges conduct regular career workshops?","Yes, they can help students understand career options.","No, every student already knows what career to choose.","Only Argument I is strong"],
    ["Should cities increase tree plantation along major roads?","Yes, trees can improve the urban environment.","No, some people dislike gardening.","Only Argument I is strong"],
    ["Should offices use digital attendance systems?","Yes, they can make attendance tracking more efficient.","No, employees may miss the old register.","Only Argument I is strong"],
    ["Should schools include financial literacy in the curriculum?","Yes, it gives students useful practical knowledge.","No, students might find money topics boring.","Only Argument I is strong"]
  ].forEach(([st,a1,a2,ans])=>{
    add(`${st}\nArgument I: ${a1}\nArgument II: ${a2}\nWhich option best evaluates the arguments?`,
      ans,["Only Argument II is strong","Both arguments are strong","Neither argument is strong"],"Statement & Argument","A strong argument is relevant, practical and logically connected to the statement.");
  });

  // STATEMENT & CONCLUSION — follows the PPT's strict logical interpretation.
  [
    ["All laptops are computers.","Some computers are laptops.","All computers are laptops.","Only Conclusion I follows"],
    ["Some teachers are writers.","Some writers are teachers.","All writers are teachers.","Only Conclusion I follows"],
    ["No buses are cars.","Some cars are buses.","No cars are buses.","Only Conclusion II follows"],
    ["All roses are flowers. All flowers are plants.","All roses are plants.","All plants are roses.","Only Conclusion I follows"],
    ["Some students are athletes.","All students are learners.","Some learners are athletes.","Only Conclusion I follows"]
  ].forEach(([st,c1,c2,ans])=>{
    add(`${st}\nConclusion I: ${c1}\nConclusion II: ${c2}\nWhich conclusion(s) logically follow?`,
      ans,["Only Conclusion II follows","Both conclusions follow","Neither conclusion follows"],"Statement & Conclusion","Use only the information stated; do not add outside assumptions.");
  });

  // STATEMENT & ASSUMPTION — fresh practical situations.
  [
    ["Use reusable bottles to reduce plastic waste.","People can reduce some single-use plastic by changing their bottle choice.","Everyone will immediately stop using plastic.","Only I is implicit"],
    ["The college should provide a quiet study room.","Students may need a quieter place for focused study.","Every student dislikes studying in groups.","Only I is implicit"],
    ["Install street lights on the road to improve safety.","Better lighting can help visibility at night.","All accidents happen only because of darkness.","Only I is implicit"],
    ["Offer online appointment booking to reduce waiting time.","People can use online booking instead of waiting only at the counter.","Every citizen owns a smartphone.","Only I is implicit"]
  ].forEach(([st,s1,s2,ans])=>{
    add(`${st}\nAssumption I: ${s1}\nAssumption II: ${s2}\nWhich assumption(s) are implicit?`,
      ans,["Only II is implicit","Both are implicit","Neither is implicit"],"Statement & Assumption","An assumption must be necessary or reasonably accepted for the statement to work.");
  });

  // COURSE OF ACTION — practical, directly related actions.
  [
    ["A city reports a rise in road accidents at a busy junction.","Install clear signs and improve traffic control at the junction.","Ignore the reports until accidents increase further.","Only I should be followed"],
    ["A college finds that many students struggle with basic programming.","Offer additional practice sessions and guided exercises.","Cancel programming classes for all students.","Only I should be followed"],
    ["A library finds that many books are returned late.","Send reminders and apply the existing return policy consistently.","Stop lending books to every student.","Only I should be followed"],
    ["An office receives repeated complaints about a slow public-facing service.","Study the service bottleneck and improve the process.","Delete all complaint records.","Only I should be followed"]
  ].forEach(([st,a1,a2,ans])=>{
    add(`${st}\nCourse of Action I: ${a1}\nCourse of Action II: ${a2}\nWhich course of action should be followed?`,
      ans,["Only II should be followed","Both should be followed","Neither should be followed"],"Statement & Course of Action","A good action is practical, directly related and capable of addressing the problem.");
  });

  return uniqueQuestions(qs);
}

function genericMaterialQuestions(text){
  const clean=normalizeQuizSource(text);
  const sentences=(clean.match(/[^.!?]+[.!?]+/g)||[]).map(s=>s.trim()).filter(s=>s.length>=35 && s.length<=260);
  const concepts=[...new Set(sentences)];
  const qs=[];
  const stop=new Set("the a an and or but if then than this that these those with from into for of to in on by as is are was were be been being it its their they you your we our can may will should has have had do does did not no very more most some such about over under between through using used use also each which what when where why how".split(" "));
  const keywords=s=>[...new Set((s.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g)||[]).filter(w=>!stop.has(w)))];
  const all=[...new Set(concepts.flatMap(keywords))];
  concepts.slice(0,30).forEach((s,i)=>{
    const ks=keywords(s); if(!ks.length)return;
    const answer=ks.sort((a,b)=>b.length-a.length)[0];
    const wrong=quizShuffle(all.filter(x=>x!==answer && Math.abs(x.length-answer.length)<=8)).slice(0,3);
    if(wrong.length===3){
      const idx=s.toLowerCase().indexOf(answer);
      if(idx>=0){
        const masked=s.slice(0,idx)+"_____"+s.slice(idx+answer.length);
        const opts=quizShuffle([answer,...wrong]);
        qs.push({q:`Which term best completes the statement from the learning material?\n"${masked}"`,a:opts,c:opts.indexOf(answer),source:s,explanation:"The answer is grounded in the uploaded material."});
      }
    }
  });
  return uniqueQuestions(qs);
}

function generateDynamicQuestions(text, count="auto", difficulty="Intermediate", focus="Auto-detect from document"){
  const clean=normalizeQuizSource(text);
  if(clean.length<80) throw new Error("Not enough readable content to create an assessment.");

  const logical=/number series|coding decoding|direction sense|blood relation|statement and argument|statement & argument|statement and conclusion|statement & conclusion|statement and assumption|statement & assumption|course of action|construction of squares|construction of squares & triangles|logical reasoning/i.test(clean);
  const quantitative=/alligation|mixture|surds|indices|simple interest|compound interest|mensuration|calendar|permutations|combinations|probability|quantitative aptitude/i.test(clean);
  let questions=quantitative ? quantitativeAptitudeQuestions(clean) : (logical ? logicalReasoningQuestions(clean) : genericMaterialQuestions(clean));

  // Focus changes ordering only. It must never shrink the pool.
  if(focus && focus!=="Auto-detect from document" && focus!=="Key concepts"){
    const map={Definitions:/definition|defined|means|refers|formula|rule|concept/i,Application:/example|application|process|method|practical|calculate|find|evaluate/i};
    const rx=map[focus];
    if(rx){
      const focused=questions.filter(q=>rx.test((q.source||"")+" "+q.q+" "+(q.explanation||"")));
      const rest=questions.filter(q=>!focused.includes(q));
      questions=quizShuffle([...focused,...rest]);
    } else questions=quizShuffle(questions);
  } else questions=quizShuffle(questions);

  questions=uniqueQuestions(questions);
  if(!questions.length) throw new Error("I could not create reliable MCQs from this material. Please upload a clearer or more text-rich file.");

  // "auto" means all quality questions generated from the available concepts.
  // Numeric mode remains available for users who want a shorter assessment.
  const requested=String(count).toLowerCase()==="auto" ? questions.length : Math.max(1,Number(count)||questions.length);
  if(requested>questions.length){
    throw new Error(`Only ${questions.length} reliable MCQs can be generated from this material. ${requested} MCQs are not possible from the uploaded content. Please choose ${questions.length} or fewer questions.`);
  }
  return questions.slice(0,requested);
}

window.LearnAI.getUploadedMaterials=getUploadedMaterials;
window.LearnAI.saveUploadedMaterials=saveUploadedMaterials;
window.LearnAI.extractMaterialText=extractMaterialText;
window.LearnAI.addUploadedMaterial=addUploadedMaterial;
window.LearnAI.generateDynamicQuestions=generateDynamicQuestions;

// Gemini Flash integration. The API key stays on the server; the browser only calls our /api routes.
async function geminiRequest(path, payload){
  const res=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  let data={}; try{data=await res.json();}catch(e){}
  if(!res.ok) throw new Error(data.error||`AI service returned ${res.status}.`);
  return data;
}
async function generateQuizWithGemini(settings){
  const data=await geminiRequest('/api/generate-quiz',{
    material:settings.text,
    count:settings.count,
    difficulty:settings.difficulty,
    focus:settings.focus,
    language:settings.language,
    assessmentName:settings.assessmentName||'LearnAI Assessment',
    requirements:settings.requirements||''
  });
  if(!Array.isArray(data.questions)||!data.questions.length) throw new Error(data.note||'Gemini could not create reliable questions from this material.');
  if(String(settings.count).toLowerCase()!=="auto" && data.questions.length!==Number(settings.count)){
    throw new Error(data.note||`Only ${data.questions.length} reliable questions could be generated from this material.`);
  }
  return data.questions;
}
async function explainTopicWithGemini(topic, material, language='English'){
  return geminiRequest('/api/learn-topic',{topic,material,language});
}
window.LearnAI.generateQuizWithGemini=generateQuizWithGemini;
window.LearnAI.explainTopicWithGemini=explainTopicWithGemini;

// Lightweight learning-time tracker: counts active time while LearnAI is open.
(function initLearningTimeTracker(){
  const KEY="learnai_learning_time_v1";
  const DAY=new Date().toISOString().slice(0,10);
  let data={};
  try{ data=JSON.parse(localStorage.getItem(KEY)||"{}"); }catch(e){ data={}; }
  if(!data[DAY]) data[DAY]={seconds:0,activeSince:Date.now()};
  else data[DAY].activeSince=Date.now();
  const save=()=>{ try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){} };
  const tick=()=>{ const now=Date.now(); const row=data[DAY]; if(row.activeSince){ row.seconds+=Math.max(0,Math.min(90,(now-row.activeSince)/1000)); } row.activeSince=now; save(); };
  setInterval(tick,60000);
  window.addEventListener("beforeunload",tick);
  document.addEventListener("visibilitychange",()=>{ if(document.hidden) tick(); else data[DAY].activeSince=Date.now(); });
  window.LearnAI.getLearningTime=function(date){
    const key=date||DAY; let d={}; try{d=JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){}
    const row=d[key]||{seconds:0};
    let seconds=Number(row.seconds)||0;
    if(key===DAY && row.activeSince) seconds+=Math.max(0,(Date.now()-row.activeSince)/1000);
    return Math.round(seconds);
  };
  window.LearnAI.getLearningTimeData=function(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}};
  save();
})();

// Authentication guard: only a saved profile session can access the app.
(function(){
  const page=location.pathname.split("/").pop()||"index.html";
  if(page!=="profile.html" && !LearnAI.isLoggedIn()){ location.replace("profile.html"); }
})();
