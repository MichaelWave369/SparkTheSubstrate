// Clear edges and a central pickup lane are common to all arrangements.
export const ROOM_LAYOUTS=[
 [{x:250,y:160,w:52,h:78},{x:658,y:354,w:52,h:78}],
 [{x:255,y:185,w:72,h:40},{x:633,y:185,w:72,h:40},{x:255,y:395,w:72,h:40},{x:633,y:395,w:72,h:40}],
 [{x:200,y:230,w:105,h:34},{x:655,y:338,w:105,h:34}],
 [{x:265,y:130,w:34,h:135},{x:661,y:335,w:34,h:135}],
 [{x:215,y:190,w:45,h:45},{x:355,y:385,w:45,h:45},{x:560,y:170,w:45,h:45},{x:700,y:370,w:45,h:45}],
 [{x:260,y:340,w:130,h:35},{x:570,y:175,w:130,h:35}],
 [{x:210,y:145,w:90,h:42},{x:260,y:145,w:40,h:100},{x:660,y:355,w:40,h:100},{x:660,y:413,w:90,h:42}],
 [],
 [{x:250,y:180,w:130,h:36},{x:580,y:384,w:130,h:36}],
 [{x:240,y:150,w:40,h:50},{x:705,y:190,w:40,h:50},{x:305,y:420,w:40,h:34}],
 [{x:220,y:140,w:34,h:120},{x:700,y:340,w:34,h:120}],
 [{x:190,y:155,w:125,h:32},{x:640,y:410,w:125,h:32},{x:710,y:180,w:32,h:85}]
];
export function layoutIndex(room,run){return run?.dungeon?(run.dungeon.floor===7?11:(Math.imul(run.seed^run.dungeon.floor,2654435761)>>>0)%ROOM_LAYOUTS.length):room.layout;}
