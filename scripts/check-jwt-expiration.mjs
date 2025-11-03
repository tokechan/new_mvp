#!/usr/bin/env node

/**
 * Quick utility to check JWT expiration without verifying the signature.
 * Pass the token as the first CLI argument or set JWT_TOKEN env variable.
 *
 * Examples:
 *   node scripts/check-jwt-expiration.mjs <token>
 *   JWT_TOKEN=<token> node scripts/check-jwt-expiration.mjs
 */

const token = process.argv[2] ?? process.env.JWT_TOKEN;

if (!token) {
  console.error('Usage: node scripts/check-jwt-expiration.mjs <jwt-token>');
  console.error('Or set JWT_TOKEN env variable.');
  process.exitCode = 1;
  process.exit();
}

const parts = token.split('.');

if (parts.length < 2) {
  console.error('Invalid JWT: expected at least header and payload segments.');
  process.exitCode = 1;
  process.exit();
}

const decodeSegment = (segment) => {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch (error) {
    console.error('Failed to decode JWT segment:', error.message);
    process.exitCode = 1;
    process.exit();
  }
};

const [, payloadSegment] = parts;
const payload = decodeSegment(payloadSegment);

if (!payload || typeof payload !== 'object') {
  console.error('JWT payload is not a JSON object.');
  process.exitCode = 1;
  process.exit();
}

const nowSeconds = Math.floor(Date.now() / 1000);
const expSeconds = payload.exp;
const nbfSeconds = payload.nbf ?? null;

if (expSeconds == null) {
  console.error('JWT has no exp claim; cannot determine expiration.');
  process.exitCode = 1;
  process.exit();
}

const expDate = new Date(expSeconds * 1000);
const nbfDate = nbfSeconds != null ? new Date(nbfSeconds * 1000) : null;
const nowDate = new Date(nowSeconds * 1000);

console.log(`Token expires at: ${expDate.toISOString()}`);
console.log(`Current time    : ${nowDate.toISOString()}`);

if (nbfDate) {
  console.log(`Not valid before: ${nbfDate.toISOString()}`);
}

if (expSeconds > nowSeconds) {
  console.log('Status: Token is still within its exp window.');
  const secondsRemaining = expSeconds - nowSeconds;
  console.log(`Time until expiration: ${secondsRemaining} seconds (~${(secondsRemaining / 3600).toFixed(2)} hours).`);
  process.exitCode = 0;
} else {
  console.log('Status: Token has expired.');
  process.exitCode = 2;
}
