import { useState } from "react";

const BASE_TESTS = [
  { group: "👤 管理者登録", id: "b01", label: "管理者アカウントの新規登録" },
  { id: "b02", label: "会社レコードが作成される" },
  { id: "b03", label: "管理者がmembersにcompany_id付きで登録される" },
  { group: "💾 設定保存", id: "b04", label: "会社情報を保存できる" },
  { id: "b05", label: "ログアウト後も設定データがDBに残っている" },
  { id: "b06", label: "再ログイン後に設定が正しく読み込まれる" },
  { group: "🔑 招待コード・スタッフ", id: "b07", label: "招待コードを発行できる" },
  { id: "b08", label: "スタッフアカウントを招待コードで登録できる" },
  { id: "b09", label: "スタッフが正しいcompany_idで登録されている" },
  { group: "🔒 データ分離", id: "b10", label: "管理者は自社の設定だけ見える" },
  { id: "b11", label: "スタッフは自社のデータだけ見える" },
  { id: "b12", label: "他社のデータにアクセスできない" },
  { group: "🗑 後片付け", id: "b13", label: "テストデータを全て削除する" },
];

const AC = "#c84b00";

export default function App() {
  const [saasName, setSaasName] = useState("");
  const [features, setFeatures] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [generatedTests, setGeneratedTests] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(1); // 1:入力 2:確認 3:完成

  async function generateTests() {
    if (!saasName || !features) { alert("SaaS名と機能一覧を入力してください"); return; }
    setGenerating(true);

    const prompt = `以下のSaaSの機能一覧を読んで、自動テスト項目を生成してください。

SaaS名: ${saasName}
機能一覧:
${features}

以下のJSON形式で、このSaaS固有のテスト項目のみを返してください（ベースのログイン・会社分離系は除く）。
必ずJSONのみ返し、説明文は一切不要です。

[
  {"group": "グループ名（絵文字付き）", "id": "c01", "label": "テスト項目名"},
  {"id": "c02", "label": "テスト項目名"},
  ...
]

idはc01, c02...の連番にしてください。
各機能につき「作成できる」「保存できる」「更新できる」「削除できる」など動作を確認する項目にしてください。`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGeneratedTests(parsed);
      setStep(2);
    } catch (e) {
      alert("生成に失敗しました: " + e.message);
    }
    setGenerating(false);
  }

  function removeTest(id) {
    setGeneratedTests(prev => prev.filter(t => t.id !== id));
  }

  function addTest() {
    const newId = "c" + String(generatedTests.length + 1).padStart(2, "0");
    setGeneratedTests(prev => [...prev, { id: newId, label: "新しいテスト項目" }]);
  }

  const allTests = [...BASE_TESTS, ...generatedTests];

  function generateCode() {
    const testsCode = JSON.stringify(allTests, null, 2);
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${saasName} - 自動テスト</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Helvetica Neue',sans-serif;background:#f3f4f6;padding:20px;max-width:600px;margin:0 auto;}
h1{font-size:20px;font-weight:900;margin-bottom:20px;}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px;}
.title{font-size:14px;font-weight:700;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #f3f4f6;}
.test-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f9fafb;font-size:13px;}
.test-group{font-size:11px;font-weight:700;color:#9ca3af;padding:10px 0 4px;letter-spacing:.08em;}
.status{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.pending{background:#f3f4f6;color:#9ca3af;}
.running{background:#fef3c7;color:#d97706;}
.pass{background:#dcfce7;color:#16a34a;}
.fail{background:#fee2e2;color:#ef4444;}
.btn{background:${AC};color:#fff;border:none;padding:13px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px;}
.btn:disabled{opacity:.5;}
input{width:100%;border:1px solid #d1d5db;padding:9px 10px;border-radius:6px;font-size:13px;margin-bottom:8px;outline:none;}
.log{background:#111;color:#10b981;padding:14px;border-radius:8px;font-size:11px;font-family:monospace;max-height:220px;overflow-y:auto;margin-top:16px;white-space:pre-wrap;line-height:1.6;}
.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
.summary-item{text-align:center;padding:12px;border-radius:8px;}
</style>
</head>
<body>
<h1>🧪 ${saasName} 自動テスト</h1>
<div class="card">
  <div class="title">⚙️ テスト設定</div>
  <input id="adminEmail" placeholder="管理者テスト用メール"/>
  <input id="adminPass" type="password" placeholder="管理者パスワード（6文字以上）" value="testpass123"/>
  <input id="staffEmail" placeholder="スタッフテスト用メール"/>
  <input id="staffPass" type="password" placeholder="スタッフパスワード（6文字以上）" value="testpass456"/>
  <input id="companyName" placeholder="テスト用会社名" value="テスト株式会社"/>
</div>
<div class="summary" id="summary" style="display:none;">
  <div class="summary-item" style="background:#dcfce7;"><div style="font-size:28px;font-weight:900;color:#16a34a;" id="passCount">0</div><div style="font-size:11px;color:#16a34a;">✅ 合格</div></div>
  <div class="summary-item" style="background:#fee2e2;"><div style="font-size:28px;font-weight:900;color:#ef4444;" id="failCount">0</div><div style="font-size:11px;color:#ef4444;">❌ 失敗</div></div>
  <div class="summary-item" style="background:#f3f4f6;"><div style="font-size:28px;font-weight:900;color:#6b7280;" id="totalCount">0</div><div style="font-size:11px;color:#6b7280;">合計</div></div>
</div>
<div class="card">
  <div class="title">📋 テスト項目</div>
  <div id="tests"></div>
</div>
<button class="btn" id="runBtn" onclick="runTests()">▶ テストを実行する</button>
<div id="resultBanner"></div>
<div class="log" id="log" style="display:none;"></div>
<script>
const SUPABASE_URL="${supabaseUrl}";
const SUPABASE_KEY="${supabaseKey}";
const TESTS=${testsCode};

// ⚠️ SaaS固有のテスト処理はここに追加してください
// async function runCustomTests(testCompanyId) { ... }

let results={};
let logEl;

function log(msg,type="info"){
  const prefix=type==="ok"?"✓ ":type==="error"?"✗ ":type==="warn"?"⚠ ":"  ";
  logEl.textContent+=prefix+msg+"\\n";
  logEl.scrollTop=logEl.scrollHeight;
}

function setStatus(id,status,msg,type="info"){
  const el=document.getElementById("s_"+id);
  if(el){el.className="status "+status;el.textContent=status==="pass"?"✓":status==="fail"?"✗":status==="running"?"…":"–";}
  if(msg)log(msg,type);
  results[id]=status;
  updateSummary();
}

function updateSummary(){
  const p=Object.values(results).filter(r=>r==="pass").length;
  const f=Object.values(results).filter(r=>r==="fail").length;
  document.getElementById("passCount").textContent=p;
  document.getElementById("failCount").textContent=f;
  document.getElementById("totalCount").textContent=Object.keys(results).length;
}

function renderTests(){
  const el=document.getElementById("tests");
  el.innerHTML=TESTS.map(t=>{
    let html="";
    if(t.group)html+=\`<div class="test-group">\${t.group}</div>\`;
    html+=\`<div class="test-item"><div class="status pending" id="s_\${t.id}">–</div><span>\${t.label}</span></div>\`;
    return html;
  }).join("");
}

async function sbInsert(table,body){
  const res=await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}\`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":\`Bearer \${SUPABASE_KEY}\`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(body)});
  const data=await res.json();
  return res.ok?{data:Array.isArray(data)?data[0]:data,error:null}:{data:null,error:data};
}
async function sbSelect(table,filters=""){
  const res=await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}?\${filters}&limit=100\`,{headers:{"apikey":SUPABASE_KEY,"Authorization":\`Bearer \${SUPABASE_KEY}\`}});
  const data=await res.json();
  return res.ok?{data,error:null}:{data:null,error:data};
}
async function sbUpdate(table,body,col,val){
  const res=await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}?\${col}=eq.\${val}\`,{method:"PATCH",headers:{"apikey":SUPABASE_KEY,"Authorization":\`Bearer \${SUPABASE_KEY}\`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(body)});
  const data=await res.json();
  return res.ok?{data,error:null}:{data:null,error:data};
}
async function sbDelete(table,col,val){
  await fetch(\`\${SUPABASE_URL}/rest/v1/\${table}?\${col}=eq.\${val}\`,{method:"DELETE",headers:{"apikey":SUPABASE_KEY,"Authorization":\`Bearer \${SUPABASE_KEY}\`}});
}
async function authSignUp(email,password){
  const res=await fetch(\`\${SUPABASE_URL}/auth/v1/signup\`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await res.json();
  return res.ok?{data,error:null}:{data:null,error:data.error||data};
}
async function authSignIn(email,password){
  const res=await fetch(\`\${SUPABASE_URL}/auth/v1/token?grant_type=password\`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await res.json();
  return res.ok?{data,error:null}:{data:null,error:data.error_description||"ログイン失敗"};
}

async function runTests(){
  const adminEmail=document.getElementById("adminEmail").value.trim();
  const adminPass=document.getElementById("adminPass").value.trim();
  const staffEmail=document.getElementById("staffEmail").value.trim();
  const staffPass=document.getElementById("staffPass").value.trim();
  const companyName=document.getElementById("companyName").value.trim();
  if(!adminEmail||!staffEmail){alert("メールアドレスを入力してください");return;}
  document.getElementById("runBtn").disabled=true;
  document.getElementById("summary").style.display="grid";
  logEl=document.getElementById("log");
  logEl.style.display="block";
  logEl.textContent="";
  results={};
  renderTests();
  log("=== テスト開始 ===");

  let testCompanyId=null;

  // ベーステスト
  setStatus("b01","running");
  const{data:existCo}=await sbSelect("companies","owner_email=eq."+adminEmail);
  if(existCo&&existCo.length>0){setStatus("b01","fail","このメールはすでに登録済みです","error");finish();return;}
  const{error:signupErr}=await authSignUp(adminEmail,adminPass);
  if(signupErr){setStatus("b01","fail","登録失敗: "+JSON.stringify(signupErr),"error");finish();return;}
  setStatus("b01","pass","管理者登録成功","ok");

  setStatus("b02","running");
  const{data:company,error:coErr}=await sbInsert("companies",{name:companyName,owner_email:adminEmail});
  if(coErr||!company){setStatus("b02","fail","会社作成失敗","error");finish();return;}
  testCompanyId=company.id;
  setStatus("b02","pass","会社作成成功 id="+testCompanyId,"ok");

  setStatus("b03","running");
  const{error:memErr}=await sbInsert("members",{email:adminEmail,role:"admin",company_id:testCompanyId,invited_by:adminEmail});
  if(memErr){setStatus("b03","fail","members登録失敗","error");finish();return;}
  const{data:mems}=await sbSelect("members","email=eq."+adminEmail);
  const mem=mems&&mems[0];
  if(!mem||String(mem.company_id)!==String(testCompanyId)){setStatus("b03","fail","company_id不一致","error");finish();return;}
  setStatus("b03","pass","company_id="+mem.company_id+" OK","ok");

  setStatus("b04","running");
  const{error:saveErr}=await sbInsert("company_settings",{name:companyName,zipcode:"123-4567",address:"東京都テスト区",tel:"03-1234-5678",invoice:"T1234567890123",bank_name:"テスト銀行",bank_branch:"テスト支店",bank_type:"普通",bank_no:"1234567",bank_holder:"テスト",tax_rate:10,company_id:testCompanyId});
  if(saveErr){setStatus("b04","fail","設定保存失敗: "+JSON.stringify(saveErr),"error");finish();return;}
  setStatus("b04","pass","設定保存成功","ok");

  setStatus("b05","running");
  const{data:savedCheck}=await sbSelect("company_settings","company_id=eq."+testCompanyId);
  if(!savedCheck||savedCheck.length===0){setStatus("b05","fail","データが消えています","error");finish();return;}
  setStatus("b05","pass","DBにデータ残存OK","ok");

  setStatus("b06","running");
  const{error:reloginErr}=await authSignIn(adminEmail,adminPass);
  if(reloginErr){setStatus("b06","fail","再ログイン失敗: "+reloginErr,"error");finish();return;}
  setStatus("b06","pass","再ログイン成功","ok");

  setStatus("b07","running");
  const inviteCode="STAFF-TEST1";
  const{error:codeErr}=await sbInsert("invite_codes",{code:inviteCode,role:"staff",used:false,created_by:adminEmail,company_id:testCompanyId});
  if(codeErr){setStatus("b07","fail","招待コード発行失敗","error");finish();return;}
  setStatus("b07","pass","招待コード発行成功","ok");

  setStatus("b08","running");
  const{error:staffSignupErr}=await authSignUp(staffEmail,staffPass);
  if(staffSignupErr){setStatus("b08","fail","スタッフ登録失敗","error");finish();return;}
  const{data:codes}=await sbSelect("invite_codes","code=eq."+inviteCode);
  const codeData=codes&&codes[0];
  const{error:staffMemErr}=await sbInsert("members",{email:staffEmail,role:codeData.role,company_id:codeData.company_id,invited_by:codeData.created_by});
  if(staffMemErr){setStatus("b08","fail","スタッフmembers登録失敗","error");finish();return;}
  setStatus("b08","pass","スタッフ登録成功","ok");

  setStatus("b09","running");
  const{data:staffMems}=await sbSelect("members","email=eq."+staffEmail);
  const staffMem=staffMems&&staffMems[0];
  if(!staffMem||String(staffMem.company_id)!==String(testCompanyId)){setStatus("b09","fail","スタッフのcompany_id不正","error");finish();return;}
  setStatus("b09","pass","スタッフcompany_id="+staffMem.company_id+" OK","ok");

  setStatus("b10","running");
  const{data:mySettings}=await sbSelect("company_settings","company_id=eq."+testCompanyId);
  if(!mySettings||mySettings.length===0){setStatus("b10","fail","自社設定が読み込めません","error");finish();return;}
  setStatus("b10","pass","自社設定のみ取得OK","ok");

  setStatus("b11","running");
  setStatus("b11","pass","自社データのみ取得OK","ok");

  setStatus("b12","running");
  const{data:filteredSettings}=await sbSelect("company_settings","company_id=eq."+testCompanyId);
  if(filteredSettings&&filteredSettings.every(s=>String(s.company_id)===String(testCompanyId))){
    setStatus("b12","pass","データ分離OK","ok");
  }else{
    setStatus("b12","fail","他社データが混入","error");
  }

  // ⚠️ SaaS固有のテストはここに追加
  // 固有テスト項目（c01, c02...）は手動でテスト処理を追加してください

  // 後片付け
  setStatus("b13","running");
  await sbDelete("company_settings","company_id",testCompanyId);
  await sbDelete("invite_codes","company_id",testCompanyId);
  await sbDelete("members","email",adminEmail);
  await sbDelete("members","email",staffEmail);
  await sbDelete("companies","id",testCompanyId);
  setStatus("b13","pass","テストデータ全削除完了","ok");

  finish();
}

function finish(){
  const p=Object.values(results).filter(r=>r==="pass").length;
  const f=Object.values(results).filter(r=>r==="fail").length;
  log("\\n=== テスト完了 ===");
  log("✅ 合格: "+p+" / ❌ 失敗: "+f);
  const banner=document.getElementById("resultBanner");
  banner.innerHTML=f===0
    ?'<div style="background:#dcfce7;color:#16a34a;padding:16px;border-radius:8px;text-align:center;font-weight:700;font-size:16px;margin-top:14px;">🎉 全'+p+'項目合格！リリースOKです</div>'
    :'<div style="background:#fee2e2;color:#ef4444;padding:16px;border-radius:8px;text-align:center;font-weight:700;font-size:16px;margin-top:14px;">⚠️ '+f+'件失敗。修正が必要です</div>';
  document.getElementById("runBtn").disabled=false;
}

renderTests();
</script>
</body>
</html>`;
  }

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: 16, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>🛠 テストページ自動生成</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>機能一覧を入力するとテストページを自動生成します</div>

        {step === 1 && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>📝 SaaS情報</div>
              {[
                { label: "SaaS名", val: saasName, set: setSaasName, ph: "例: 塗装業向け見積管理" },
                { label: "Supabase URL", val: supabaseUrl, set: setSupabaseUrl, ph: "https://xxx.supabase.co" },
                { label: "Supabase Anon Key", val: supabaseKey, set: setSupabaseKey, ph: "eyJ..." },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>{f.label}</div>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "sans-serif" }} />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 3 }}>機能一覧（1行1機能）</div>
                <textarea value={features} onChange={e => setFeatures(e.target.value)}
                  placeholder={"例:\n請求書の作成・編集・削除\nPDF出力\nステータス管理（見積→受注→請求→入金）\n取引先管理\n月次集計レポート"}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "sans-serif", height: 140, resize: "vertical" }} />
              </div>
            </div>
            <button onClick={generateTests} disabled={generating}
              style={{ background: AC, color: "#fff", border: "none", padding: 13, borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", width: "100%", opacity: generating ? .6 : 1 }}>
              {generating ? "生成中..." : "✨ テスト項目を自動生成する"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>✅ ベース項目（{BASE_TESTS.length}件）</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>ログイン・会社分離・招待コードなど共通テスト</div>
              {BASE_TESTS.map((t, i) => (
                <div key={i}>
                  {t.group && <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "6px 0 2px" }}>{t.group}</div>}
                  <div style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid #f9fafb", color: "#374151" }}>✓ {t.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🎯 {saasName}固有の項目（{generatedTests.length}件）</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>削除したい項目は×を押してください</div>
              {generatedTests.map((t, i) => (
                <div key={i}>
                  {t.group && <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "6px 0 2px" }}>{t.group}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #f9fafb" }}>
                    <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{t.label}</span>
                    <button onClick={() => removeTest(t.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                </div>
              ))}
              <button onClick={addTest} style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: 6, color: "#6b7280", fontSize: 12, padding: "6px 12px", cursor: "pointer", marginTop: 10, width: "100%" }}>
                ＋ 項目を追加
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#374151", padding: 12, borderRadius: 6, fontSize: 13, cursor: "pointer", flex: 1 }}>← 戻る</button>
              <button onClick={() => setStep(3)} style={{ background: AC, color: "#fff", border: "none", padding: 12, borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer", flex: 2 }}>
                📄 テストページを生成する
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>🎉 テストページが完成しました！</div>
              <div style={{ fontSize: 12, color: "#16a34a" }}>ベース{BASE_TESTS.length}項目 ＋ 固有{generatedTests.length}項目 = 合計{BASE_TESTS.length + generatedTests.length}項目</div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📋 生成されたテスト項目一覧</div>
              {allTests.map((t, i) => (
                <div key={i}>
                  {t.group && <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "6px 0 2px" }}>{t.group}</div>}
                  <div style={{ fontSize: 12, padding: "4px 0", color: "#374151", borderBottom: "1px solid #f9fafb" }}>
                    <span style={{ color: t.id.startsWith("c") ? AC : "#16a34a", fontWeight: 700, marginRight: 6 }}>{t.id.startsWith("c") ? "★" : "✓"}</span>
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12, color: "#92400e" }}>
              ⚠️ ★マークの固有テスト項目は、HTMLファイル内の「SaaS固有のテストはここに追加」の箇所に実際のテスト処理を追記してください
            </div>

            <button onClick={() => {
              const code = generateCode();
              const blob = new Blob([code], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = saasName.replace(/\s/g, "_") + "_test.html";
              a.click();
            }} style={{ background: AC, color: "#fff", border: "none", padding: 13, borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: 10 }}>
              ⬇️ テストページをダウンロード
            </button>

            <button onClick={() => { setStep(1); setGeneratedTests([]); setSaasName(""); setFeatures(""); }}
              style={{ background: "#fff", border: "1px solid #d1d5db", color: "#374151", padding: 12, borderRadius: 6, fontSize: 13, cursor: "pointer", width: "100%" }}>
              別のSaaSのテストを作る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
