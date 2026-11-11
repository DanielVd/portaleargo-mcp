import {test} from "node:test";
import assert from "node:assert/strict";
import {getArgoConsentUrl,getArgoAuthorizationCode} from "../vendor/portaleargo-api/dist/loginRedirect.js";
const link={clientId:"client-1",state:"state-123",redirectUri:"it.argosoft.didup.famiglia.new://login-callback"};
const url="https://auth.portaleargo.it/oauth2/auth?client_id=client-1&state=state-123&redirect_uri=it.argosoft.didup.famiglia.new%3A%2F%2Flogin-callback&consent_verifier=test";
test("extracts Argo OAuth continuation from HTML with escaped ampersands",()=>{
  const html='<a class="auth-button" href="'+url.replaceAll("&","&amp;")+'">Continua</a>';
  assert.equal(getArgoConsentUrl(html,link),url);
});
test("rejects external continuation URLs and mismatching OAuth state",()=>{
  assert.throws(()=>getArgoConsentUrl('<a href="'+url.replace("auth.portaleargo.it","evil.example")+'">x</a>',link));
  assert.throws(()=>getArgoConsentUrl('<a href="'+url.replace("state-123","wrong")+'">x</a>',link));
});
test("checks callback URL and state before accepting authorization code",()=>{
  assert.equal(getArgoAuthorizationCode("it.argosoft.didup.famiglia.new://login-callback?code=valid&state=state-123",link),"valid");
  assert.throws(()=>getArgoAuthorizationCode("https://evil.example?code=bad&state=state-123",link));
  assert.throws(()=>getArgoAuthorizationCode("it.argosoft.didup.famiglia.new://login-callback?code=bad&state=wrong",link));
  assert.throws(()=>getArgoAuthorizationCode(undefined,link));
});
