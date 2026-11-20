import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,reduce,scenario} from '../web/engine.js';
import {campaignForArchive,parseCampaign} from '../web/storage.js';

test('starting another campaign after a demonstration archives the real campaign',()=>{
 const active=reduce(newGame(),{type:'ROLL',dice:[1,2]});
 const demo=scenario('yaroslavl');
 const archived=campaignForArchive(demo,JSON.stringify(active));
 assert.equal(archived.scenario,null);
 assert.equal(archived.players[0].position,active.players[0].position);
 assert.deepEqual(archived.players[0].hand,active.players[0].hand);
 assert.equal(campaignForArchive(active,null),active);
 assert.equal(campaignForArchive(demo,null),null);
 assert.equal(campaignForArchive(demo,JSON.stringify(demo)),null);
});

test('the blizzard demonstration can round-trip through save validation',()=>{
 const restored=parseCampaign(JSON.stringify(scenario('swan-blizzard')));
 assert.equal(restored.scenario,'swan-blizzard');
 assert.equal(restored.decision.card.id,'blizzard');
});
