(() => {
  const socket = io();
  const $ = id => document.getElementById(id);
  const profile = window.LearnAI?.getProfile?.() || {};
  let room = null, isHost = false, questions = [], current = 0, selected = null, timerId = null, questionStarted = 0, myResult = null, finalBoard = [];

  const show = id => $(id).classList.remove('hidden');
  const hide = id => $(id).classList.add('hidden');
  const message = text => { $('globalMessage').textContent = text || ''; };
  const playerName = () => profile.name || 'Learner';
  const initials = name => String(name).split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase();

  socket.on('connect', () => $('connectionText').textContent = 'Live multiplayer connected');
  socket.on('disconnect', () => $('connectionText').textContent = 'Connection lost — reconnecting…');

  function enterLobby(data) {
    room = data.room; isHost = room.hostId === socket.id;
    hide('setupView'); show('lobbyView'); hide('quizView'); hide('resultView');
    $('lobbyTitle').textContent = room.name; $('lobbyMeta').textContent = `${room.topic} • ${room.difficulty} • ${room.questionCount} questions • ${room.timer}s each`;
    $('roomCode').textContent = room.code; $('startBattle').style.display = isHost ? '' : 'none';
    renderPlayers(room.players);
  }
  function renderPlayers(players) {
    $('playerCount').textContent = players.length;
    $('playerList').innerHTML = players.map(p => `<div class="player-row"><span class="player-avatar">${initials(p.name)}</span><b>${escapeHtml(p.name)}</b>${p.id === room.hostId ? '<span class="host-badge">HOST</span>' : ''}</div>`).join('');
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  $('createForm').addEventListener('submit', e => {
    e.preventDefault(); message('');
    const config = { roomName:$('roomName').value, topic:$('topic').value, difficulty:$('difficulty').value, questionCount:Number($('questionCount').value), timer:Number($('timer').value), playerName:playerName() };
    socket.emit('room:create', config, result => result.ok ? enterLobby(result) : message(result.error));
  });
  $('joinForm').addEventListener('submit', e => {
    e.preventDefault(); message('');
    socket.emit('room:join', { code:$('joinCode').value.replace(/\D/g,''), playerName:$('joinName').value }, result => result.ok ? enterLobby(result) : message(result.error));
  });
  $('copyCode').addEventListener('click', async () => { try{await navigator.clipboard.writeText(room.code);$('copyCode').textContent='Copied!';setTimeout(()=>$('copyCode').textContent='Copy',1200);}catch(e){} });

  socket.on('room:update', updated => { if (!room || updated.code !== room.code) return; room=updated; isHost=room.hostId===socket.id; renderPlayers(room.players); $('startBattle').style.display=isHost?'':'none'; });

  $('startBattle').addEventListener('click', async () => {
    if (!isHost) return;
    $('startBattle').disabled = true; $('lobbyMessage').textContent = 'Generating the shared quiz…';
    try {
      const r = await fetch('/api/multiplayer/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:room.topic,difficulty:room.difficulty,questionCount:room.questionCount})});
      const data = await r.json(); if(!r.ok) throw new Error(data.error||'Generation failed.');
      socket.emit('room:start',{code:room.code,questions:data.questions}, result => { if(!result.ok){$('lobbyMessage').textContent=result.error;$('startBattle').disabled=false;} });
    } catch(err){$('lobbyMessage').textContent=err.message;$('startBattle').disabled=false;}
  });

  socket.on('quiz:started', data => { room=data.room; questions=data.questions; current=0; hide('setupView');hide('lobbyView');hide('resultView');show('quizView');$('quizTopicLabel').textContent=room.topic.toUpperCase(); renderQuestion(); });

  function renderQuestion(){
    clearInterval(timerId); selected=null; $('nextQuestion').disabled=true; $('answerState').textContent='Choose an answer';
    const q=questions[current]; $('questionNumber').textContent=`Question ${current+1} of ${questions.length}`; $('questionText').textContent=q.q; $('questionProgress').style.width=`${((current)/questions.length)*100}%`;
    $('options').innerHTML=q.a.map((a,i)=>`<button class="option-btn" data-index="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(a)}</button>`).join('');
    document.querySelectorAll('.option-btn').forEach(btn=>btn.addEventListener('click',()=>choose(Number(btn.dataset.index))));
    let left=room.timer; $('timerValue').textContent=left; questionStarted=performance.now();
    timerId=setInterval(()=>{left--;$('timerValue').textContent=left;if(left<=0){clearInterval(timerId);submitAnswer(null);}},1000);
  }
  function choose(index){if(selected!==null)return;selected=index;document.querySelectorAll('.option-btn').forEach(b=>b.classList.toggle('selected',Number(b.dataset.index)===index));submitAnswer(index);}
  function submitAnswer(answer){
    if(selected===-1)return; if(answer===null) selected=-1; clearInterval(timerId); const elapsed=Math.round(performance.now()-questionStarted);
    socket.emit('quiz:answer',{code:room.code,index:current,answer:answer===null?-1:answer,timeMs:elapsed}, result=>{ if(!result?.ok)return; $('answerState').textContent=result.correct?`Correct! +${result.points} points`:'Not correct — keep going!'; $('nextQuestion').disabled=false; updateLeaderboard(result.leaderboard||[]); });
  }
  $('nextQuestion').addEventListener('click',()=>{if(current<questions.length-1){current++;renderQuestion();}else{socket.emit('quiz:finish',{code:room.code});}});

  function updateLeaderboard(board){
    $('liveLeaderboard').innerHTML=board.slice(0,5).map(p=>`<div class="leader-row ${p.id===socket.id?'you':''}"><span>#${p.rank}</span><span>${escapeHtml(p.name)}</span><b>${p.score}</b></div>`).join('');
    const me=board.find(p=>p.id===socket.id); if(me)$('liveRank').textContent=`Your Rank #${me.rank}`;
  }
  socket.on('leaderboard:update', board=>{if(room?.code)updateLeaderboard(board);});
  socket.on('quiz:finished', data=>{finalBoard=data.leaderboard||[];room=data.room;hide('quizView');show('resultView');renderResults();});

  function renderResults(){
    const me=finalBoard.find(p=>p.id===socket.id)||{score:0,correct:0,wrong:questions.length,answered:questions.length,timeTaken:0}; myResult=me;
    const rank=finalBoard.findIndex(p=>p.id===socket.id)+1; const accuracy=questions.length?Math.round((me.correct/questions.length)*100):0;
    $('yourScore').textContent=me.score; $('resultTitle').textContent=rank===1?'You won the battle!':`You finished #${rank}`; $('resultSummary').textContent=`${room.topic} • ${finalBoard.length} players • ${questions.length} questions`;
    $('resultStats').innerHTML=[['Correct',me.correct],['Wrong',me.wrong],['Accuracy',accuracy+'%'],['Time taken',me.timeTaken+'s']].map(x=>`<div class="result-stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
    $('finalLeaderboard').innerHTML=finalBoard.map(p=>`<div class="final-row ${p.id===socket.id?'you':''}"><span class="rank-pill">#${p.rank}</span><span>${escapeHtml(p.name)}</span><b>${p.score}</b></div>`).join('');
    const totalCorrect=finalBoard.reduce((s,p)=>s+p.correct,0); const avg=finalBoard.length?Math.round(totalCorrect/(finalBoard.length*questions.length)*100):0;
    const strongest=questions.length?'Overall quiz accuracy':''; const challenge=me.wrong>0?`Review ${room.topic}`:'No major weak area';
    $('groupStats').innerHTML=`<div class="group-stat"><span>Overall Average</span><b>${avg}%</b></div><div class="group-stat"><span>Strongest Topic</span><b>${escapeHtml(strongest)}</b></div><div class="group-stat"><span>Most Challenging Topic</span><b>${escapeHtml(challenge)}</b></div><div class="group-stat"><span>Your Performance</span><b>${accuracy}%</b></div><div class="group-stat"><span>Your Rank</span><b>#${rank}</b></div>`;
    getFeedback(rank,accuracy,challenge);
  }
  async function getFeedback(rank,accuracy,weakTopic){
    try{const r=await fetch('/api/multiplayer/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:room.topic,score:myResult.score,accuracy,rank,totalPlayers:finalBoard.length,weakTopic})});const d=await r.json();$('aiFeedback').textContent=d.feedback||'Review your weaker areas and play again.';}catch(e){$('aiFeedback').textContent='Review the most challenging topic, then replay the quiz to improve your accuracy.';}
  }
  $('playAgain').addEventListener('click',()=>{hide('resultView');show('setupView');room=null;questions=[];finalBoard=[];});
  $('leaveRoom').addEventListener('click',()=>location.reload());
})();
