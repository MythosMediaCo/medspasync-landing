(function(){
  const { useState, useEffect } = React;
  const POS_HEADERS = ['Name','Email','Date','Amount'];
  const REWARD_HEADERS = ['Name','Email','Date'];

  function parseCSV(text){
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map(h => h.trim());
    const rows = lines.map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h,i)=>{ obj[h] = (values[i]||'').trim(); });
      return obj;
    });
    return { headers, rows };
  }

  function levenshtein(a,b){
    const matrix = Array.from({length:a.length+1},()=>[]);
    for(let i=0;i<=a.length;i++) matrix[i][0]=i;
    for(let j=0;j<=b.length;j++) matrix[0][j]=j;
    for(let i=1;i<=a.length;i++){
      for(let j=1;j<=b.length;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        matrix[i][j]=Math.min(
          matrix[i-1][j]+1,
          matrix[i][j-1]+1,
          matrix[i-1][j-1]+cost
        );
      }
    }
    return matrix[a.length][b.length];
  }

  function similarity(a,b){
    const max=Math.max(a.length,b.length);
    if(max===0) return 1;
    return (max-levenshtein(a,b))/max;
  }

  function headerInfo(headers, expected){
    const mismatched=headers.map((h,i)=>h!==expected[i]);
    const suggestions=headers.reduce((arr,h,i)=>{
      if(mismatched[i] && expected[i]) arr.push(`${h} \u2192 ${expected[i]}`);
      return arr;
    },[]);
    return { mismatched, suggestions };
  }

  function matchRows(posRows, rewardRows){
    return posRows.map(p=>{
      let best={};
      let bestScore=0;
      rewardRows.forEach(r=>{
        const score=similarity(p.Name||'',r.Name||'')+
          similarity(p.Email||'',r.Email||'')+
          (p.Date===r.Date?1:0);
        if(score>bestScore){bestScore=score;best=r;}
      });
      return {
        row:p,
        confidence:Math.round((bestScore/3)*100),
        mismatches:{
          Name:p.Name!== (best.Name||''),
          Email:p.Email!== (best.Email||''),
          Date:p.Date!== (best.Date||''),
          Amount:false
        }
      };
    });
  }

  function CSVPreviewer(){
    const [pos,setPos]=useState(null);
    const [rew,setRew]=useState(null);
    const [posSug,setPosSug]=useState([]);
    const [rewSug,setRewSug]=useState([]);
    const [rows,setRows]=useState([]);

    window.updatePreview=(type,text)=>{
      if(!text) return;
      const parsed=parseCSV(text);
      if(type==='pos'){
        const info=headerInfo(parsed.headers,POS_HEADERS);
        setPosSug(info.suggestions);
        setPos(parsed);
      }else{
        const info=headerInfo(parsed.headers,REWARD_HEADERS);
        setRewSug(info.suggestions);
        setRew(parsed);
      }
    };

    useEffect(()=>{
      if(pos&&rew){
        setRows(matchRows(pos.rows, rew.rows).slice(0,5));
      }
    },[pos,rew]);

    const suggestions=[...posSug,...rewSug];
    if(!pos||!rew) return null;

    return React.createElement('div',{},
      suggestions.length>0 &&
        React.createElement('div',{className:'mb-4 text-sm text-red-600'},[
          React.createElement('p',{className:'font-semibold',key:'p'},'Header Suggestions:'),
          React.createElement('ul',{key:'u'},
            suggestions.map((s,i)=>React.createElement('li',{key:i},s))
          )
        ]),
      React.createElement('table',{className:'min-w-full text-sm border rounded'},[
        React.createElement('thead',{key:'h'},
          React.createElement('tr',{},
            ['Name','Email','Date','Amount','Match Confidence'].map((h,i)=>
              React.createElement('th',{key:i,className:'border px-2 py-1 bg-gray-100'},h)
            )
          )
        ),
        React.createElement('tbody',{key:'b'},
          rows.map((item,idx)=>
            React.createElement('tr',{key:idx},
              ['Name','Email','Date','Amount'].map((key,i)=>
                React.createElement('td',{
                  key:i,
                  className:'border px-2 py-1 '+(item.mismatches[key]?'bg-red-100 text-red-600':'')
                },item.row[key]||'')
              ).concat(
                React.createElement('td',{className:'border px-2 py-1',key:'c'}, item.confidence+'%')
              )
            )
          )
        )
      ])
    );
  }

  const rootEl=document.getElementById('preview');
  if(rootEl) ReactDOM.createRoot(rootEl).render(React.createElement(CSVPreviewer));
})();
