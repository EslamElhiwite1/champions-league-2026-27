import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=path.resolve('scripts/refresh-details.ts');
const tsx=path.resolve('node_modules/tsx/dist/cli.mjs');
function run(cache, scheduled=false, portraits=null){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'details-test-'));
 fs.mkdirSync(path.join(dir,'public/data'),{recursive:true});
 const match={matchId:'test-match',utcDate:new Date(Date.now()-86400000).toISOString(),status:'FINISHED',homeTeam:{name:'Home'},awayTeam:{name:'Away'}};
 fs.writeFileSync(path.join(dir,'public/data/knockout-snapshot.json'),JSON.stringify({matches:[match]}));
 if(portraits){fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});fs.writeFileSync(path.join(dir,'scripts/player-portraits.json'),JSON.stringify(portraits));}
 if(cache)fs.writeFileSync(path.join(dir,'.goal-cache.json'),JSON.stringify(cache));
 const result=spawnSync(process.execPath,[tsx,script],{cwd:dir,env:{...process.env,GOAL_API_KEY:'not-a-real-key',GOAL_SCHEDULED:String(scheduled)},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 return {dir,html:fs.readFileSync(path.join(dir,'public/match-details/test-match.html'),'utf8'),result};
}
const players=Array.from({length:11},(_,i)=>({lineupPlayer:i===0?'<img src=x onerror=alert(1)>':'Player '+i,lineupNumber:i+1,lineupPosition:i+1,playerKey:'key'+i,playerId:'id'+i}));
function cached(){return {items:{'test-match':{l:{hasLineups:true,homeFormation:'4-3-3',awayFormation:'4-4-2',home:{startingLineups:structuredClone(players)},away:{startingLineups:structuredClone(players)}},s:{hasStatistics:true,match:{fullTime:[{type:'Ball Possession',home:40,away:60},{type:'Ball Possession',home:45,away:55},{type:'Corners',home:3,away:5},{type:'Corners',home:3,away:5}]},players:{home:[{playerKey:'key0',rating:'8.2',playerName:'Player Zero',playerNumber:'1',minutesPlayed:'90'}]}},events:[{type:'GOAL',time:'45+2',homeScorer:'Scorer One',awayScorer:null,score:'1 - 0',info:'Penalty'}],version:3,complete:true,checkedAt:Date.now()}},day:new Date().toISOString().slice(0,10),calls:800,fixtures:[],discovered:Date.now()}}
test('renders 22 starters, safe names, linked ratings and only unambiguous metrics',()=>{const {html}=run(cached());assert.equal((html.match(/class="player"/g)||[]).length,22);assert.ok(html.includes('8.2'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('الاستحواذ'));assert.equal((html.match(/الركنيات/g)||[]).length,1);assert.ok(html.includes('Player Zero'));});
test('scheduled run with missing quota history makes placeholders without network',()=>{const {html,result}=run(null,true);assert.ok(html.includes('لم تُفحص بعد'));assert.ok(!html.includes('class="player"'));assert.ok(result.stderr.includes('quota cache missing'));});
test('persistent provider pause preserves cached content',()=>{const cache=cached();cache.paused=true;const {html}=run(cache);assert.ok(html.includes('Player Zero'));});

test('renders source-backed scorer, stoppage minute and goal score',()=>{const {html}=run(cached());assert.ok(html.includes('Scorer One'));assert.ok(html.includes('45+2'));assert.ok(html.includes('Penalty'));assert.ok(html.includes('1 - 0'));});
test('missing IDs never join to another player rating',()=>{const cache=cached();for(const p of cache.items['test-match'].l.home.startingLineups){delete p.playerId;delete p.playerKey}const {html}=run(cache);assert.ok(!html.includes('<strong>8.2</strong>'));});
test('does not invent a no-goal claim for upcoming or unchecked match',()=>{const {html}=run(null,true);assert.ok(!html.includes('انتهت دون أهداف'));assert.ok(html.includes('أسماء الهدافين ودقائق الأهداف غير متاحة'));});

test('renders an ID-bound approved portrait with credit and license',()=>{const photos=[{playerKey:'key0',name:'Player Zero',imageUrl:'https://upload.wikimedia.org/test.jpg',sourceUrl:'https://commons.wikimedia.org/wiki/File:Test.jpg',artist:'Test Artist',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'}];const {html}=run(cached(),false,photos);assert.ok(html.includes('class="portrait photo"'));assert.ok(html.includes('Test Artist'));assert.ok(html.includes('CC BY-SA 4.0'));});
test('rejects a photo URL outside the checked source domain',()=>{const photos=[{playerKey:'key0',imageUrl:'https://untrusted.invalid/photo.jpg'}];const {html}=run(cached(),false,photos);assert.ok(!html.includes('class="portrait photo"'));});
