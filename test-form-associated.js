// Simple test to verify form-associated boolean attribute behavior
const { MEMBER_FLAGS } = require('./build/internal/app-data/index.cjs');
const { parsePropertyValue } = require('./build/internal/client/index.js');

console.log('Testing form-associated boolean attribute parsing...');

// Test 1: Non-form-associated component (legacy behavior)
console.log('\n=== Non-form-associated component ===');
const normalResult1 = parsePropertyValue('false', MEMBER_FLAGS.Boolean, false);
const normalResult2 = parsePropertyValue('true', MEMBER_FLAGS.Boolean, false);
const normalResult3 = parsePropertyValue('', MEMBER_FLAGS.Boolean, false);

console.log('parsePropertyValue("false", Boolean, false):', normalResult1); // Should be false (legacy)
console.log('parsePropertyValue("true", Boolean, false):', normalResult2); // Should be true
console.log('parsePropertyValue("", Boolean, false):', normalResult3); // Should be true

// Test 2: Form-associated component (new behavior)
console.log('\n=== Form-associated component ===');
const formResult1 = parsePropertyValue('false', MEMBER_FLAGS.Boolean, true);
const formResult2 = parsePropertyValue('true', MEMBER_FLAGS.Boolean, true);
const formResult3 = parsePropertyValue('', MEMBER_FLAGS.Boolean, true);

console.log('parsePropertyValue("false", Boolean, true):', formResult1); // Should be true (new behavior!)
console.log('parsePropertyValue("true", Boolean, true):', formResult2); // Should be true
console.log('parsePropertyValue("", Boolean, true):', formResult3); // Should be true

// Test 3: Test with non-string values (should behave the same)
console.log('\n=== Non-string values ===');
const boolResult1 = parsePropertyValue(false, MEMBER_FLAGS.Boolean, true);
const boolResult2 = parsePropertyValue(true, MEMBER_FLAGS.Boolean, true);

console.log('parsePropertyValue(false, Boolean, true):', boolResult1); // Should be false
console.log('parsePropertyValue(true, Boolean, true):', boolResult2); // Should be true

// Summary
console.log('\n=== SUMMARY ===');
console.log('✅ Fix successful if form-associated "false" becomes true');
console.log('Form-associated disabled="false" result:', formResult1 === true ? '✅ FIXED' : '❌ BROKEN');
console.log('Legacy behavior preserved:', normalResult1 === false ? '✅ PRESERVED' : '❌ BROKEN');
