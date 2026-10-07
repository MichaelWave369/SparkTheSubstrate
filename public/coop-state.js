// Room identity and advisory choices stay outside the campaign save.
export function cleanPlayerName(value,fallback=''){
 if(typeof value!=='string')return fallback;
 const name=Array.from(value.normalize('NFKC').replace(/[<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g,'').replace(/\s+/g,' ').trim()).slice(0,24).join('');
 return name||fallback;
}
export function coopChoiceContext(run){
 if(!run||!['boon','resolve'].includes(run.phase))return null;
 return [run.seed,run.room,run.phase,run.level,(run.choices??[]).join(','),(run.roomResolved??[]).length].join(':');
}
export function currentCoopVote(run,crew){
 const vote=crew?.vote;
 return vote&&vote.context===coopChoiceContext(run)&&Number.isInteger(vote.index)&&vote.index>=0&&vote.index<3?vote:null;
}
