import test from 'node:test';
import assert from 'node:assert/strict';
import {CITY_BY_ID, getVotes, money, newGame, reduce, SWAN} from '../web/engine.js';
import {rulesContent} from '../web/rulebook.js';

test('the infrastructure guide describes the actual price of a headquarters', () => {
  for (const city of Object.values(CITY_BY_ID)) {
    assert.equal(city.headquarters_cost_million_rub, city.acquisition_cost_million_rub / 2);
  }
  assert.ok(rulesContent('infrastructure').includes('Половина цены города'));
});

test('the airport guide demonstrates a legal landing that cancels the extra roll', () => {
  const game = newGame({mode: 'manual'});
  game.players[0].position = 4;
  const landed = reduce(game, {type: 'ROLL', dice: [1, 1]});
  assert.equal(landed.players[0].position, 6);
  assert.equal(landed.players[0].airportPending, true);
  assert.equal(landed.extraRoll, false);
  assert.ok(rulesContent('airport', {page: 3}).includes('2 шага (1 + 1): 04 → 06'));
});

test('Catherine’s guide demonstrates the real Debates card and its doubled cost', () => {
  const card = SWAN.find(entry => entry.id === 'debates');
  const game = newGame();
  game.phase = 'decision';
  game.decision = {kind: 'swan', card};
  const accepted = reduce(game, {type: 'SWAN', accept: true});
  const example = '«'+card.name+'»: +'+card.votes+'% за '+money(card.cost)
    +' → +'+getVotes(accepted, 0)+'% за '+money(game.players[0].cash - accepted.players[0].cash);
  assert.ok(rulesContent('abilities').includes(example));
});
