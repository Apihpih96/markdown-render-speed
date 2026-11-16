const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const escAttr = s => s.replace(/&(?!(?:#(?:x[\da-f]+|\d+)|[a-z][\da-z]*);)/gi,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const normLabel = s => s.trim().toLowerCase().replace(/ß/g,'ss').replace(/\s+/g,' ');
const validTag = s => /^<\/?[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z_:][A-Za-z0-9_.:-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>$/.test(s);
const htmlTagAt = (s, i) => { let q='', j=i+1; for(;j<s.length;j++){const c=s[j];if(q){if(c===q)q='';}else if(c==='"'||c==="'")q=c;else if(c==='>')return s.slice(i,j+1);} return ''; };
const encodeUrl = value => { let s=value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,'$1'),hold=[];s=s.replace(/%/g,x=>{hold.push(x);return `ZZPCT${hold.length-1}ZZ`;}).replace(/\\/g,'\uE000');try{s=encodeURI(s);}catch{}s=s.replace(/%EE%80%80/gi,'%5C').replace(/\uE000/g,'%5C').replace(/ZZPCT(\d+)ZZ/g,(_,n)=>hold[+n]);return s;};
const entities = s => s.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2),16) : +e.slice(1); return n && n <= 0x10ffff ? String.fromCodePoint(n) : '\ufffd'; }
  const map = { amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0',copy:'©',reg:'®',trade:'™',hellip:'…',mdash:'—',ndash:'–',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”'}; return map[e] ?? m;
});
function oldInline(src, refs = {}, resolveEmphasis = true) {
  let out='', i=0;
  scan: while(i<src.length) {
    let m;
    if (src[i] === '\\' && i+1<src.length) { if(src[i+1]==='\n'){out+='<br>';i+=2;continue;} if(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(src[i+1])){out+=esc(src[i+1]);i+=2;continue;} }
    if(src[i]==='`' && (m=/^(`+)/.exec(src.slice(i)))) { const tok=m[0]; let at=-1,search=i+tok.length;while((search=src.indexOf('`',search))>=0){let n=1;while(src[search+n]==='`')n++;if(n===tok.length){at=search;break;}search+=n;}if(at>=0){let code=src.slice(i+tok.length,at).replace(/\n/g,' ');if(/^ .* $/.test(code)&&/[^ ]/.test(code))code=code.slice(1,-1);out+='<code>'+esc(code)+'</code>';i=at+tok.length;continue;}out+=tok;i+=tok.length;continue; }
    if(src[i]==='!'&&src[i+1]==='[' || src[i]==='[') { const start=i+(src[i]==='!'?1:0);let close=-1,brackets=0;for(let k=start+1;k<src.length;k++){if(src[k]==='\\'){k++;continue;}if(src[k]==='`'){let n=1;while(src[k+n]==='`')n++;const t='`'.repeat(n),z=src.indexOf(t,k+n);if(z>=0){k=z+n-1;continue;}}if(src[k]==='<'){let q='',z=k+1;for(;z<src.length;z++){const c=src[z];if(q){if(c===q&&src[z-1]!=='\\')q='';}else if(c==='"'||c==="'")q=c;else if(c==='>')break;}if(z<src.length){k=z;continue;}}if(src[k]==='[')brackets++;else if(src[k]===']'){if(!brackets){close=k;break;}brackets--;}} if(close>=0){let label=src.slice(start+1,close), end=close+1, href=null,title=''; if(src[end]==='('){let p=end+1,depth=0,q='',angle=false;for(;p<src.length;p++){const c=src[p];if(q){if(c===q&&src[p-1]!=='\\')q='';}else if(angle){if(c==='>'&&src[p-1]!=='\\')angle=false;}else if(c==='<')angle=true;else if(c==='"'||c==="'")q=c;else if(c==='\\'){p++;continue;}else if(c==='(')depth++;else if(c===')'){if(!depth)break;depth--;}} if(p<src.length){let raw=src.slice(end+1,p).trim();if(!raw)href='';let z=/^(<[^>]*>|(?:\\.|[^ \t\n<>])+?)(?:[ \t\n]+(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|\(([^)]*)\)))?$/.exec(raw);if(z){const angle=z[1].startsWith('<');href=z[1].replace(/^<|>$/g,'');title=z[2]||z[3]||z[4]||'';if(angle&&(/[\n\r]/.test(z[1])||/\\>$/.test(z[1])))href=null;}} end=p+1; }else {let refEnd=end;if(src[refEnd]==='['){let e=src.indexOf(']',refEnd+1);if(e>=0){const ref=src.slice(refEnd+1,e)||label,r=refs[normLabel(ref)];if(r){href=r.href;title=r.title;end=e+1;}}}if(href===null){let r=refs[normLabel(label)];if(r){href=r.href;title=r.title;}}}
       if(href===null&&src[close+1]==='('){const r=refs[normLabel(label)];if(r){href=r.href;title=r.title;end=close+1;}}
       if(href!==null){const renderedLabel=inline(label,refs);if(src[i]!=='!'&&renderedLabel.includes('<a href=')){href=null;}else{const url=escAttr(encodeUrl(href));title=title.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,'$1');const t=title?` title="${escAttr(title)}"`:'';const alt=escAttr(renderedLabel.replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g,'$1').replace(/<[^>]*>/g,''));out+=src[i]==='!'?`<img src="${url}" alt="${alt}"${t}>`:`<a href="${url}"${t}>${renderedLabel}</a>`;i=end;continue;}}
    }}
    if((m=/^<([A-Za-z][A-Za-z0-9.+-]{1,31}:[^\s<>]+)/.exec(src.slice(i)))&&src[i+m[0].length]==='>'){let h=m[1];try{h=encodeURI(h);}catch{}out+=`<a href="${escAttr(h)}">${esc(/^mailto:/i.test(m[1])&&m[1].startsWith('mailto:')?m[1].slice(7):m[1])}</a>`;i+=m[0].length+1;continue;}
    if((m=/^[A-Za-z][A-Za-z0-9.+-]{1,31}:[^\s<>/]+(?:\/[^\s<>/]+)?/.exec(src.slice(i)))&&!/[-_]/.test(src[i+m[0].length]||'')&&!/[-_]$/.test(m[0])){let u=m[0],trail='';while(/[.,!?;:/]$/.test(u)){trail=u.slice(-1)+trail;u=u.slice(0,-1);}out+=`<a href="${escAttr(encodeUrl(u))}">${esc(u)}</a>${esc(trail)}`;i+=m[0].length;continue;}
    if((m=/^<([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})>/.exec(src.slice(i)))){out+=`<a href="mailto:${esc(m[1])}">${esc(m[1])}</a>`;i+=m[0].length;continue;}
    if((m=/^(?:https?:\/\/|www\.)[^\s<>]+/i.exec(src.slice(i)))){let u=m[0],trail='';while(/[.,!?;:]$/.test(u)){trail=u.slice(-1)+trail;u=u.slice(0,-1);}while(u.endsWith(')')&&(u.match(/\)/g)||[]).length>(u.match(/\(/g)||[]).length){trail=')'+trail;u=u.slice(0,-1);}const entity=/&[a-z][a-z\d]+;$/i.exec(u);if(entity){trail=entity[0]+trail;u=u.slice(0,-entity[0].length);}const href=/^www\./i.test(u)?'http://'+u:u;out+=`<a href="${escAttr(encodeURI(href))}">${esc(u)}</a>${esc(trail)}`;i+=m[0].length;continue;}
    if(!/^mailto:/i.test(src.slice(Math.max(0,i-7),i))&&(m=/^[\w.+-]+@[\w.-]+\.[A-Za-z]{1,}(?![-_])/.exec(src.slice(i)))){out+=`<a href="mailto:${esc(m[0])}">${esc(m[0])}</a>`;i+=m[0].length;continue;}
    if(src[i]==='<'&&/^<\/?[A-Za-z]/.test(src.slice(i))&&(m=[htmlTagAt(src,i)])&&validTag(m[0])){out+=m[0];i+=m[0].length;continue;}
    if((m=/^<!\[CDATA\[[\s\S]*?\]\]>|^<![A-Z][^>]*>|^<\/?[A-Za-z][^>]*>|^<!--(?!-->|->)[\s\S]*?-->|^<\?[\s\S]*?\?>/.exec(src.slice(i)))&&(m[0].startsWith('<!--')||m[0].startsWith('<?')||m[0].startsWith('<!')||validTag(m[0]))){out+=m[0];i+=m[0].length;continue;}
    if(src[i]==='\n'){const trail=/ +$/.exec(src.slice(0,i));if(trail&&trail[0].length>=2){out=out.slice(0,-trail[0].length)+'<br>';i++;continue;}out+='\n';i++;continue;}
    if(src[i]==='_'&&/[\p{L}\p{N}]/u.test(src[i-1]||'')){let n=1;while(src[i+n]==='_')n++;out+=src.slice(i,i+n);i+=n;continue;}
    let mark=src[i],run=0;if(resolveEmphasis&&(mark==='*'||mark==='_'||mark==='~')){while(src[i+run]===mark)run++;const sizes=mark==='~'?(run===2?[2]:run===1?[1]:[]):run>=3?[3,2,1]:run===2?[2]:[1],prev=src[i-1]||' ',next=src[i+run]||' ',punct=c=>/[\p{P}\p{S}]/u.test(c),canOpen=!/\s/.test(next)&&(!punct(next)||/\s/.test(prev)||punct(prev));for(const size of sizes){if(size>run||!canOpen||(mark==='_'&&/[\p{L}\p{N}]/u.test(prev)))continue;let close=-1;for(let k=i+size;k<src.length;){let p=src.indexOf(mark,k),bt=src.indexOf('`',k);if(bt>=0&&(p<0||bt<p)){let n=1;while(src[bt+n]==='`')n++;const t='`'.repeat(n),z=src.indexOf(t,bt+n);if(z>=0){k=z+n;continue;}k=bt+n;continue;}if(p<0)break;const lb=src.lastIndexOf('[',p-1),rb=lb>=0?src.indexOf(']',lb+1):-1;let refLabel=rb>=p&&(src[rb+1]==='('||src[rb+1]==='['||(refs[normLabel(src.slice(lb+1,rb))]&&(rb+1===src.length||/\s/.test(src[rb+1]||''))));if(refLabel){k=p+1;continue;}if(rb>=p&&src[rb+1]==='('){let d=1,z=rb+2;for(;z<src.length&&d;z++){if(src[z]==='\\'){z++;continue;}if(src[z]==='(')d++;else if(src[z]===')')d--;}if(!d){k=z;continue;}}let slash=0;for(let q=p-1;q>=0&&src[q]==='\\';q--)slash++;if(slash%2){k=p+1;continue;}let n=0;while(src[p+n]===mark)n++;const before=src[p-1]||' ',after=src[p+n]||' ',canClose=!/\s/.test(before)&&(!punct(before)||/\s/.test(after)||punct(after)),alsoOpen=!/\s/.test(after)&&(!punct(after)||/\s/.test(before)||punct(before)),ruleThree=canClose&&alsoOpen&&(size+n)%3===0&&(size%3!==0||n%3!==0);if(n>=size&&p>i+size&&canClose&&!(mark==='_'&&/[\p{L}\p{N}]/u.test(after))&&!ruleThree){close=p;break;}k=p+n;}if(close<0)continue;let inner=src.slice(i+size,close), tags=size===3?['em','strong']:size===2?[mark==='~'?'del':'strong']:['em'];let rendered=inline(inner,refs);for(let z=tags.length-1;z>=0;z--)rendered=`<${tags[z]}>${rendered}</${tags[z]}>`;out+=rendered;i=close+size;continue scan;} }
    if(src[i]==='&'&&(m=/^&(?:#(?:x[\da-f]+|\d+)|[a-z][\da-z]*);/i.exec(src.slice(i)))){if(m[0][1]==='#'){const n=m[0][2].toLowerCase()==='x'?parseInt(m[0].slice(3,-1),16):parseInt(m[0].slice(2,-1),10);out+=n===0?'�':n>0x10ffff?'&amp;'+m[0].slice(1):esc(String.fromCodePoint(n));}else out+=m[0];i+=m[0].length;continue;}
    if(src[i]==='<'||src[i]==='>'){out+=src[i]==='<'?'&lt;':'&gt;';i++;continue;}
    if(src[i]===' '&&src.slice(i).match(/^ {2,}\n/)){out+='<br>';i+=src.slice(i).match(/^ {2,}\n/)[0].length;continue;}
    let j=i+1;while(j<src.length&&!/[\\`!*_~[<&>\n]/.test(src[j])&&!(src[j]===' '&&/^ +\n/.test(src.slice(j)))&&!/^(?:https?:\/\/|www\.)/i.test(src.slice(j))&&!/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(src.slice(j)))j++;if(j===i+1){out+=esc(src[i]);i++;}else{out+=esc(src.slice(i,j));i=j;}
  }
  return out;
}
// Delimiter-run resolver used by the replacement inline engine. It marks the
// source positions consumed by emphasis, then lets the regular inline scanner
// handle all non-delimiter constructs.
function newInline(src, refs = {}) {
  // The delimiter scan skips code and angle constructs; links are left to the
  // inline scanner after emphasis has been resolved.
  if (src.includes('[') || src.includes(']')) return oldInline(src, refs);
  const runs = [], n = src.length;
  const punctuation = c => !!c && /[\p{P}\p{S}]/u.test(c);
  for (let i = 0; i < n;) {
    if (src[i] === '\\') { i += Math.min(2, n - i); continue; }
    if (src[i] === '`') { let j=i; while(src[j]==='`')j++; const z=src.indexOf('`'.repeat(j-i),j); if(z>=0){i=z+j-i;continue;} i=j;continue; }
    if (src[i] === '<') { const z=src.indexOf('>',i+1); if(z>=0){i=z+1;continue;} }
    const c=src[i];
    if(c==='*'||c==='_'||c==='~') {
      let j=i+1; while(src[j]===c)j++;
      const prev=src[i-1]||' ', next=src[j]||' ';
      const lf=!/\s/u.test(next)&&(!punctuation(next)||/\s/u.test(prev)||punctuation(prev));
      const rf=!/\s/u.test(prev)&&(!punctuation(prev)||/\s/u.test(next)||punctuation(next));
      let canOpen=lf, canClose=rf;
      if(c==='_'){canOpen=lf&&(!rf||punctuation(prev));canClose=rf&&(!lf||punctuation(next));}
      if(c!=='~'||j-i<3)runs.push({c,start:i,end:j,len:j-i,left:j-i,open:canOpen,close:canClose});i=j;
    } else i++;
  }
  if (runs.length === 2 && runs[0].c === runs[1].c && runs[0].c !== '~' && runs[0].len >= 5 && runs[0].len % 2 && runs[0].len === runs[1].len && runs[0].open && runs[1].close) {
    const len = runs[0].len, inner = src.slice(runs[0].end, runs[1].start);
    let rendered = inline(inner, refs);
    for (let k = 0; k < Math.floor(len / 2); k++) rendered = `<strong>${rendered}</strong>`;
    if (len % 2) rendered = `<em>${rendered}</em>`;
    return rendered;
  }
  const stack=[], events=new Map(), removed=new Set();
  const event=(at,s)=>events.set(at,(events.get(at)||'')+s);
  for(const closer of runs){
    if(!closer.close) { if(closer.open)stack.push(closer); continue; }
    while(closer.left>0){
      let ix=-1;
      for(let q=stack.length-1;q>=0;q--){const op=stack[q];if(op.c!==closer.c||!op.left||!op.open)continue;
        const total=op.left+closer.left;
        if(op.c!=='~'&&(closer.open||op.close)&&(total%3===0)&&(op.left%3!==0||closer.left%3!==0))continue;
        ix=q;break;
      }
      if(ix<0)break;
      const op=stack[ix], oddTriple=op.c!=='~'&&op.left===3&&closer.left===3, two=op.c==='~'?op.left>=2&&closer.left>=2:op.left>=2&&closer.left>=2&&!oddTriple, use=oddTriple?1:two?2:1;
      stack.splice(ix+1);
      const tag=op.c==='~'?'del':op.len===3&&closer.len===3&&op.left===3&&closer.left===3?'strong':op.len===3&&closer.len===3&&op.left===2&&closer.left===2?'em':use===2?'strong':'em';
      const openAt=op.start+op.left-use, closeAt=closer.start+(closer.len-closer.left);
      // Runs can be consumed from the inside edge, as required for nested runs.
      for(let q=0;q<use;q++){removed.add(openAt+q);removed.add(closeAt+q);}
      op.left-=use; closer.left-=use;
      event(openAt,`<${tag}>`); event(closeAt+use,`</${tag}>`);
      if(!op.left)stack.splice(ix,1);
    }
    if(closer.open&&closer.left)stack.push(closer);
  }
  let transformed='';
  for(let i=0;i<=n;i++){
    if(events.has(i))transformed+=events.get(i);
    if(i<n&&!removed.has(i))transformed+=src[i];
  }
  return oldInline(transformed,refs,false);
}
function inline(src, refs = {}) { return newInline(src, refs); }
const startsBlock = l => /^(?: {0,3}(?:#{1,6}(?:\s|$)|>|(?:\*\s*){3,}$|(?:-\s*){3,}$|(?:_\s*){3,}$|```|~~~|<(?:!--|\?|!\[CDATA\[|\/?(?:address|article|aside|base|blockquote|body|caption|center|col|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul|script|style|pre|textarea)(?:\s|\/|>))|(?:[-+*]|[1-9][.)])\s))/.test(l);
export function parse(markdown) {
  let s=String(markdown).replace(/\r\n?/g,'\n').replace(/\0/g,'\ufffd'); const lines=s.split('\n'), refs={};
  let tabFence='',tabFenceSize=0;for(let i=0;i<lines.length;i++){const fm=/^ {0,3}(`{3,}|~{3,})/.exec(lines[i]);if(tabFence){if(fm&&fm[1][0]===tabFence&&fm[1].length>=tabFenceSize)tabFence='';continue;}if(/^>\t/.test(lines[i]))lines[i]=lines[i].replace(/^>\t+/,m=>'> '+' '.repeat(m.length>2?6:2));let col=0,k=0;while(k<lines[i].length&&(lines[i][k]===' '||lines[i][k]==='\t')){col=lines[i][k]==='\t'?col+(4-col%4):col+1;k++;}if(k&&lines[i].slice(0,k).includes('\t'))lines[i]=' '.repeat(col)+lines[i].slice(k);const open=/^ {0,3}(`{3,}|~{3,})/.exec(lines[i]);if(open){tabFence=open[1][0];tabFenceSize=open[1].length;}}
  let fenceChar='',fenceSize=0;for(let i=0;i<lines.length;i++){const fm=/^ {0,3}(`{3,}|~{3,})/.exec(lines[i]);if(fenceChar){if(fm&&fm[1][0]===fenceChar&&fm[1].length>=fenceSize)fenceChar='';continue;}if(fm){fenceChar=fm[1][0];fenceSize=fm[1].length;continue;}if(/^ {4}|^\t/.test(lines[i]))continue;if(/^ {0,3}>\s*\[((?:\\.|[^\]])+)\]:\s*(.*)$/.test(lines[i])){const q=/^ {0,3}(>\s*)\[((?:\\.|[^\]])+)\]:\s*(.*)$/.exec(lines[i]),raw=q[3];let href=raw.startsWith('<')?(raw.match(/^<([^>]*)>/)||[])[1]:((raw.match(/^(\S+)/)||[])[1]);if(href!==undefined){refs[normLabel(q[2])]??={href,title:''};lines[i]=q[1].trimEnd();continue;}}if(/^ {0,3}\[$/.test(lines[i])){let end=i+1;while(end<lines.length&&end<=i+4&&!/\]:/.test(lines[end]))end++;if(end<lines.length&&end<=i+4){const tail=/^ {0,3}([^\]]*)\]:[ \t]*(.*)$/.exec(lines[end]);if(tail){const prev=lines[i-1]||'',label=[lines[i].replace(/^ {0,3}\[/,''),...lines.slice(i+1,end),tail[1]].join('\n'),raw=tail[2];if(!prev.trim()||/^ {0,3}(?:#|>|(?:[-+*]|\d+[.)])\s|```|~~~|<)/.test(prev)){const z=raw.startsWith('<')?/^<([^>]*)>/.exec(raw):/^(\S+)/.exec(raw);if(z){refs[normLabel(label)]??={href:z[1],title:''};for(let x=i;x<=end;x++)lines[x]='';i=end;continue;}}}}}const m=/^ {0,3}\[((?:\\.|[^\]])+)\]:[ \t]*(.*)$/.exec(lines[i]);if(!m)continue;const prev=lines[i-1]||'';if(prev.trim()&&!/^ {0,3}\[((?:\\.|[^\]])+)\]:/.test(prev)&&!/^ {0,3}(?:#|>|(?:[-+*]|\d+[.)])\s|```|~~~|<)/.test(prev))continue;let key=normLabel(m[1]),raw=m[2],used=[i],valid=true;if(!raw&&i+1<lines.length&&lines[i+1].trim()){raw=lines[i+1].trim();used.push(++i);}let href='',title='';if(raw.startsWith('<')){let z=/^<([^>]*)>(.*)$/.exec(raw);if(z){if(z[2]&&!/^\s/.test(z[2]))valid=false;href=z[1];raw=z[2].trim();}}else{let z=/^(\S+)(.*)$/.exec(raw);if(z){href=z[1];raw=z[2].trim();}}if(!raw&&i+1<lines.length&&/^\s*["'(]/.test(lines[i+1])){const candidate=lines[i+1].trim(),q=candidate[0],end=q==='('?')':q;if(candidate.includes(end)&&!candidate.slice(candidate.lastIndexOf(end)+1).trim()){raw=candidate;used.push(++i);}}if(raw){const q=raw[0];if(q==='"'||q==="'"||q==='('){let close=q==='('?')':q;let body=raw.slice(1);while(!body.includes(close)&&i+1<lines.length&&lines[i+1].trim()){used.push(++i);body+='\n'+lines[i].trim();}let at=-1;for(let k=0;k<body.length;k++)if(body[k]===close&&body[k-1]!=='\\'){at=k;break;}if(at>=0){title=body.slice(0,at);if(body.slice(at+1).trim())valid=false;}else valid=false;}}if(valid&&(href||m[2].trim()==='<>')){if(!refs[key])refs[key]={href,title};for(const n of used)lines[n]='';}}
  const render=(a,depth=0,info)=>{let out='',i=0,pAt=-1;while(i<a.length){let l=a[i];if(!l.trim()){i++;continue;}
    let m;if((m=/^ {0,3}(#{1,6})(?:\s+|$)(.*)$/.exec(l))){const n=m[1].length;let t=m[2].replace(/\s+#+\s*$/,'').trim();if(/^#+\s*$/.test(t))t='';out+=`<h${n}>${inline(t,refs)}</h${n}>\n`;i++;continue;}
    if(/^ {0,3}(```+|~~~+)/.test(l)){m=/^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)[^\n]*$/.exec(l);if(m&&(m[2][0]==='~'||!l.slice(m[1].length+m[2].length).includes('`'))){const indent=m[1].length,fence=m[2],lang=m[3].replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,'$1');i++;let code=[];while(i<a.length&&!new RegExp('^ {0,3}'+fence[0]+'{'+fence.length+',}\\s*$').test(a[i])){let row=a[i++];if(indent)row=row.replace(new RegExp('^ {0,'+indent+'}'),'');code.push(row);}if(i<a.length)i++;if(code.length&&code.at(-1)==='')code.pop();const body=code.length?esc(code.join('\n')+'\n'):'';out+=`<pre><code${lang?` class="language-${escAttr(lang)}"`:''}>${body}</code></pre>\n`;continue;}}
    if(/^ {4}|^\t/.test(l)){let code=[];while(i<a.length&&(/^ {4}|^\t/.test(a[i])||!a[i].trim())){code.push(a[i].startsWith('\t')?a[i].slice(1):a[i].startsWith('    ')?a[i].slice(4):'');i++;}while(code.length&&!code.at(-1))code.pop();out+=`<pre><code>${esc(code.join('\n'))}\n</code></pre>\n`;continue;}
    if(/^ {0,3}>/.test(l)){let b=[],quotedFence='';while(i<a.length){if(/^ {0,3}>/.test(a[i])){const row=a[i++].replace(/^ {0,3}>[ \t]?/,'');const fm=/^ {0,3}(`{3,}|~{3,})/.exec(row);if(quotedFence){if(fm&&fm[1][0]===quotedFence[0]&&fm[1].length>=quotedFence.length)quotedFence='';}else if(fm)quotedFence=fm[1];b.push(row);continue;}if(quotedFence)break;if(/^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(a[i]))break;if(b.length&&!b.at(-1).trim()&&a[i].trim())break;const last=b.at(-1)||'',paragraph=!!last.trim()&&!startsBlock(last)&&!/^ {4}|^\t/.test(last);if(a[i].trim()&&(!/^ {4}|^\t/.test(a[i])||paragraph)&&(!startsBlock(a[i])||/^ {0,3}=+\s*$/.test(a[i]))){const lazy=paragraph?a[i++].replace(/^ {4}/,''):a[i++];b.push(paragraph&&/^ {0,3}(?:[-+*]|\d+[.)]|#{1,6})\s/.test(lazy)?lazy.replace(/^([-+*]|\d+[.)]|#{1,6})/,'\\$1'):/^ {0,3}=+\s*$/.test(lazy)?'    '+lazy:lazy);continue;}break;}if(b.length>1&&b.at(-1)===' '&&b.at(-2).trim()){b[b.length-2]+='\n ';b.pop();}out+='<blockquote>\n'+render(b,depth+1)+'</blockquote>\n';continue;}
    if(/^ {0,3}(?:\*\s*){3,}$|^ {0,3}(?:-\s*){3,}$|^ {0,3}(?:_\s*){3,}$/.test(l)){out+='<hr>\n';i++;continue;}
    if(/^ {0,3}<!--/.test(l)){let b=[l];i++;while(!b.at(-1).includes('-->')&&i<a.length)b.push(a[i++]);out+=b.join('\n')+(i<a.length&&a[i].trim()?'\n':'');continue;}
    if((m=/^ {0,3}<(script|style|textarea|pre)\b/i.exec(l))){const tag=m[1];if(new RegExp('</'+tag+'\\s*>','i').test(l)){out+=l+'\n';i++;continue;}let b=[l];i++;while(i<a.length){b.push(a[i]);if(new RegExp('</'+tag+'\\s*>','i').test(a[i++]))break;}if(b.at(-1)==='')b.pop();let j=i;while(j<a.length&&!a[j].trim())j++;if(j>i&&j<a.length&&!startsBlock(a[j])){i=j;out+=b.join('\n');}else out+=b.join('\n')+'\n';continue;}
    if(/^ {0,3}<\?/.test(l)||/^ {0,3}<!\[CDATA\[/.test(l)){const end=l.startsWith('<?')?'?>':']]>';let b=[l];i++;while(i<a.length&&!b.at(-1).includes(end))b.push(a[i++]);out+=b.join('\n')+'\n';continue;}
    if((m=/^ {0,3}<(div|table|details|summary|pre|script|style|section|article|ul|ol|p|blockquote)\b/i.exec(l))){const tag=m[1].toLowerCase();if(!l.includes('>')){let b=[l];i++;while(i<a.length&&!b.at(-1).includes('>'))b.push(a[i++]);if(i<a.length&&new RegExp('^\\s*</'+tag+'\\s*>','i').test(a[i]))b.push(a[i++]);if(!b.at(-1).trim())b.pop();out+=b.join('\n')+'\n';continue;}if(i+1<a.length&&!a[i+1].trim()){out+=l;i++;while(i<a.length&&!a[i].trim())i++;if(i===a.length)out+='\n';continue;}let b=[l];i++;while(i<a.length&&a[i].trim())b.push(a[i++]);out+=b.join('\n');if(i<a.length&&i===a.length-1)out+='\n';continue;}
    if(/^ {0,3}<\/[A-Za-z]/.test(l)&&validTag(l.trim())){let b=[l];i++;while(i<a.length&&a[i].trim())b.push(a[i++]);let j=i;while(j<a.length&&!a[j].trim())j++;if(j>i&&j<a.length&&(/^ {0,3}<\//.test(a[j])||!startsBlock(a[j]))){i=j;out+=b.join('\n');}else out+=b.join('\n')+'\n';continue;}
    if(/^ {0,3}<(?:!--|\?|!?[A-Za-z][A-Za-z0-9-]*(?:\s|\/|>))/.test(l)&&(/^(?: {0,3}<!--| {0,3}<\?| {0,3}<!)/.test(l)||(validTag(l.trim())&&/^ {0,3}<\/?[A-Za-z][A-Za-z0-9-]*(?:\s+[^<>]*)?\/?\s*>\s*$/.test(l)))){if(/^ {0,3}<\/?[A-Za-z][A-Za-z0-9-]*(?:\s+[^<>]*)?\/?\s*>\s*$/.test(l)&&!/^ {0,3}<\//.test(l)&&i+1<a.length&&!a[i+1].trim()){out+=l;i++;while(i<a.length&&!a[i].trim())i++;if(i===a.length)out+='\n';continue;}let b=[];while(i<a.length&&a[i].trim())b.push(a[i++]);let j=i;while(j<a.length&&!a[j].trim())j++;if(j>i&&j<a.length&&/^ {0,3}<\//.test(a[j])){i=j;out+=b.join('\n');}else out+=b.join('\n')+'\n';continue;}
    if(i+1<a.length&&!/^ {0,3}(?:[-+*]|\d+[.)])(?:\s|$)/.test(l)&&/^ {0,3}(=+|-+)\s*$/.test(a[i+1])){const n=a[i+1].trim()[0]==='='?1:2;out+=`<h${n}>${inline(l.trim(),refs)}</h${n}>\n`;i+=2;continue;}
    if(i+1<a.length&&l.includes('|')&&/^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(a[i+1])){const cells=x=>{let s=x.trim();if(s.startsWith('|'))s=s.slice(1);if(s.endsWith('|'))s=s.slice(0,-1);let out=[],v='',ticks=0;for(let z=0;z<s.length;z++){const c=s[z];if(c==='\\'){const next=s[z+1]||'';v+=next==='|'?'|':c+next;z++;continue;}if(c==='`'){let n=1;while(s[z+n]==='`')n++;if(!ticks)ticks=n;else if(ticks===n)ticks=0;v+=s.slice(z,z+n);z+=n-1;continue;}if(c==='|'&&!ticks){out.push(v.trim());v='';}else v+=c;}out.push(v.trim());return out;};const heads=cells(l),align=cells(a[i+1]).map(v=>v[0]===':'?(v.endsWith(':')?'center':'left'):(v.endsWith(':')?'right':''));if(heads.length!==align.length){const first=!out;out+='<p>'+inline(l,refs)+'\n'+inline(a[i+1],refs);i+=2;while(i<a.length&&a[i].trim()&&!startsBlock(a[i]))out+='\n'+inline(a[i++],refs);out+='</p>\n';if(info&&first)info.pEnd=out.length;pAt=out.length;continue;}out+='<table>\n<thead>\n<tr>\n'+heads.map((v,k)=>`<th${align[k]?` align="${align[k]}"`:''}>${inline(v,refs)}</th>\n`).join('')+'</tr>\n</thead>\n';i+=2;let rows=[];while(i<a.length&&a[i].trim()&&!startsBlock(a[i]))rows.push(cells(a[i++]));if(rows.length)out+='<tbody>'+rows.map(row=>'<tr>\n'+heads.map((_,k)=>`<td${align[k]?` align="${align[k]}"`:''}>${inline(row[k]||'',refs)}</td>\n`).join('')+'</tr>\n').join('')+'</tbody>';out+='</table>\n';continue;}
    if((m=/^( {0,3})([-+*]|\d{1,9}[.)])(?:([ \t]+)(.*)|$)/.exec(l))){
      const ordered=/^\d/.test(m[2]),tag=ordered?'ol':'ul',start=ordered?parseInt(m[2]):1;
      const markerSpace=m[3]||' ',spaceWidth=[...markerSpace].reduce((n,c)=>c==='\t'?n+(4-n%4):n+1,0),baseIndent=m[1].length+m[2].length+1,contentIndent=spaceWidth>4?baseIndent:m[1].length+m[2].length+Math.min(spaceWidth,4);
      const items=[];let loose=false;
      while(i<a.length){
        if(/^ {0,3}(?:\*\s*){3,}$|^ {0,3}(?:-\s*){3,}$|^ {0,3}(?:_\s*){3,}$/.test(a[i]))break;
        const x=/^( {0,3})([-+*]|\d{1,9}[.)])(?:([ \t]+)(.*)|$)/.exec(a[i]);
        if(!x||/^\d/.test(x[2])!==ordered||(ordered?x[2].at(-1)!==m[2].at(-1):x[2]!==m[2])||x[1].length<m[1].length)break;
        let text=x[4]||'';const ws=x[3]||' ';let w=[...ws].reduce((n,c)=>c==='\t'?n+(4-n%4):n+1,0),itemIndent=x[1].length+x[2].length+Math.min(w>4?1:w,4);
        if(w>4)text=' '.repeat(w-1)+text;
        const task=/^\[([ xX])\]\s+(.*)$/.exec(text),checked=task&&task[1].toLowerCase()==='x';if(task)text=task[2];
        i++;const sub=[text];let blankBefore=false;
        if(!text&&!x[3]&&i<a.length&&!a[i].trim()){items.push({sub,task,checked});let j=i;while(j<a.length&&!a[j].trim())j++;if(j<a.length&&/^( {0,3})([-+*]|\d{1,9}[.)])(?:[ \t]+|$)/.test(a[j])){loose=true;i=j;continue;}loose=true;break;}
        while(i<a.length){
          if(!a[i].trim()){
            // Blank lines inside a fenced block belong to that block and do
            // not make the containing list loose.
            let fence=null;
            for(const row of sub){const fm=/^ {0,3}(`{3,}|~{3,})/.exec(row);if(!fence){if(fm)fence={c:fm[1][0],n:fm[1].length};}else if(fm&&fm[1][0]===fence.c&&fm[1].length>=fence.n)fence=null;}
            if(fence){sub.push('');i++;continue;}
            let j=i;while(j<a.length&&!a[j].trim())j++;
          if(j<a.length&&a[j].length-a[j].trimStart().length>=itemIndent){
            const prev=sub.at(-1)||'', nextIndent=a[j].length-a[j].trimStart().length;
            const insideNested=/^\s*(?:[-+*]|\d{1,9}[.)])(?:\s|$)/.test(prev)&&
              (nextIndent>itemIndent||/^\s*(?:[-+*]|\d{1,9}[.)])(?:\s|$)/.test(a[j]));
            if(!insideNested)loose=true;
            blankBefore=true;while(i<j){sub.push('');i++;}continue;}
            break;
          }
          const indent=a[i].length-a[i].trimStart().length;
          if(indent>=itemIndent){sub.push(a[i++].slice(itemIndent));blankBefore=false;continue;}
          if(/^ {0,3}(?:[-+*]|[1-9][.)])(?:\s|$)/.test(a[i]))break;
          if(!blankBefore&&!startsBlock(a[i])){sub.push(a[i++].trimStart());continue;}
          break;
        }
        items.push({sub,task,checked});
        if(!a[i]?.trim()){
          let j=i;while(j<a.length&&!a[j].trim())j++;
          if(j<a.length&&/^( {0,3})([-+*]|\d{1,9}[.)])(?:[ \t]+|$)/.test(a[j]))loose=true;
          if(j===a.length||!/^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]+|$)/.test(a[j]))break;
          i=j;
        }
      }
      out+=`<${tag}${ordered&&start!==1?` start="${start}"`:''}>\n`;
      for(const it of items){
        const info={};let body=render(it.sub,depth+1,info).trimEnd();
        if(!loose){const lead=info.pEnd!==undefined;if(lead)body=body.slice(3,info.pEnd-5)+body.slice(info.pEnd);body=body.replace(/(<\/h[1-6]>\n)<p>([\s\S]*?)<\/p>/,'$1$2');if(!lead)body=body.replace(/\n(<(?:ul|ol|blockquote)>)/,'$1');if(/<\/(?:ul|ol|blockquote)>$/.test(body)||body.startsWith('<blockquote>'))body+='\n';if(!info.lastIsP&&/<\/h[1-6]>$/.test(body))body+='\n';}
        else if(body)body+='\n';
        if(!loose&&!info.lastIsP&&!body.endsWith('\n')&&(body.endsWith('<hr>')||body.startsWith('<pre>')||body.endsWith('</pre>')))body+='\n';
        const box=it.task?`<input${it.checked?' checked=""':''} disabled="" type="checkbox"> `:'';
        if(box&&body.startsWith('<p>'))body='<p>'+box+body.slice(3);
        else if(box)body=box+body;
        out+=`<li>${body}</li>\n`;
      }
      out+=`</${tag}>\n`;continue;
    }
    let para=[l],j=i+1;while(j<a.length&&a[j].trim()&&!startsBlock(a[j])){if(j+1<a.length&&/^ {0,3}(=+|-+)\s*$/.test(a[j+1])){const n=a[j+1].trim()[0]==='='?1:2;out+=`<h${n}>${inline(para.concat(a[j]).join('\n').trim(),refs)}</h${n}>\n`;i=j+2;para=null;break;}let row=a[j];if(/(?: {2,}|\\)$/.test(para.at(-1)))row=row.trimStart();para.push(row);j++;}if(!para)continue; i=j;if(info&&!out){out='<p>'+inline(para.join('\n'),refs)+'</p>\n';info.pEnd=out.length;}else out+='<p>'+inline(para.join('\n'),refs)+'</p>\n';pAt=out.length;
  }if(info)info.lastIsP=pAt===out.length;return out;};
  return render(lines);
}
