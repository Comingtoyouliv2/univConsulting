import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the NOVA product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>NOVA \| 대학 컨설팅 관리 플랫폼<\/title>/i);
  assert.match(html, /NOVA/);
  assert.match(html, /UNIVERSITY CONSULTING/);
  assert.match(html, /로그인/);
  assert.doesNotMatch(html, /회원가입|학생 계정 만들기|설정/);
  assert.doesNotMatch(html, /학생 화면 체험|관리자 화면 체험|YOUR JOURNEY, ORGANIZED|복잡한 입시 준비/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});
