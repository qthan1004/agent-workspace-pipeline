import test from 'node:test';
import assert from 'node:assert/strict';
import { greet } from './greet.mjs';

test('greets the explicit name', () => {
  assert.equal(greet('Thanh'), 'Hello, Thanh!');
});

test('uses the default name', () => {
  assert.equal(greet(), 'Hello, world!');
});
