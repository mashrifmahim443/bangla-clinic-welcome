import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = String.raw`
import asyncio, json, os, sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width":1280,"height":1800})
        page = await context.new_page()
        if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") == "injected":
            key = os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"]
            session = os.environ["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"]
            cookies = json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON") or "[]")
        else:
            with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f:
                minted = json.load(f)
            key, session, cookies = minted["storage_key"], json.dumps(minted["session"]), minted.get("cookies") or []
        if cookies:
            await context.add_cookies([{**c,"url":"http://localhost:8080"} for c in cookies])
        await page.goto("http://localhost:8080")
        await page.evaluate("([k,v]) => localStorage.setItem(k,v)",[key,session])
        await page.goto("http://localhost:8080/admin/users")
        search = page.get_by_placeholder("নাম, ইমেইল বা ফোন খুঁজুন")
        await search.fill("forhadhossenmrktr")
        row = page.get_by_role("row").filter(has=page.locator("label",has_text="doctor"))
        await row.wait_for()
        uid = "e34bb449-4751-46a6-be07-789ba4887bca"
        role = sys.argv[1]
        checkbox = row.locator("label").filter(has_text=role).get_by_role("checkbox")
        originally_checked = await checkbox.is_checked()
        if originally_checked:
            await checkbox.uncheck()
            await page.wait_for_timeout(700)
        if role == "patient":
            result = await page.evaluate("""async uid => {
                const {supabase} = await import('/src/integrations/supabase/client.ts');
                const {error} = await supabase.rpc('admin_set_account_status',{_user:uid,_status:'pending'});
                return !error;
            }""",uid)
            assert result, 'Could not prepare pending account'
        try:
            await checkbox.check()
            await page.wait_for_timeout(900)
            approved = await page.evaluate("""async uid => {
                const {supabase} = await import('/src/integrations/supabase/client.ts');
                const {data,error} = await supabase.rpc('admin_users');
                if(error) throw new Error('Account verification failed');
                return data.find(u=>u.id===uid)?.account_status==='active';
            }""",uid)
            assert approved, 'Admin-assigned role did not approve account'
            if role == "doctor":
                await page.goto("http://localhost:8080/doctors")
                await page.get_by_text("ডা. ফোরহাদ হোসেন",exact=True).first.wait_for()
                await page.screenshot(path="/tmp/browser/role-approval/doctor-listed.png")
            print("verified")
        finally:
            if not originally_checked:
                await page.goto("http://localhost:8080/admin/users")
                await page.get_by_placeholder("নাম, ইমেইল বা ফোন খুঁজুন").fill("forhadhossenmrktr")
                row = page.get_by_role("row").filter(has=page.locator("label",has_text="doctor"))
                await row.locator("label").filter(has_text=role).get_by_role("checkbox").uncheck()
                await page.wait_for_timeout(700)
            await browser.close()

asyncio.run(main())
`;

describe("admin-assigned role approval (live signed-in regression)", () => {
  it("activates an existing doctor profile when admin checks doctor", () => {
    mkdirSync("/tmp/browser/role-approval", { recursive: true });
    writeFileSync("/tmp/browser/role-approval/check_role.py", script);
    const result = execFileSync("python3", ["/tmp/browser/role-approval/check_role.py", "doctor"], { encoding: "utf8", timeout: 60000 });
    expect(result.trim()).toBe("verified");
  }, 65000);

  it("approves a pending account when admin checks patient", () => {
    mkdirSync("/tmp/browser/role-approval", { recursive: true });
    writeFileSync("/tmp/browser/role-approval/check_role.py", script);
    const result = execFileSync("python3", ["/tmp/browser/role-approval/check_role.py", "patient"], { encoding: "utf8", timeout: 60000 });
    expect(result.trim()).toBe("verified");
  }, 65000);
});